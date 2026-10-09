import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,run,find,objects} from '../src/engine.js';
import {schedulingChecks} from '../src/simulator-core.js';
import {config,secret,deployment,pod,container} from '../src/model.js';

function execute(state,command){const result=run(state,command);assert.equal(result.error,false,result.output);return result.state;}
const configured=()=>deployment('web',1,'nginx:1.27',{containers:[container('nginx:1.27',{envFrom:[{configMapRef:{name:'settings'}}]})]});

test('set env imports individual key references and preserves unrelated env and envFrom',()=>{
  const d=configured();d.spec.template.spec.containers[0].env=[{name:'LOG_LEVEL',value:'info'}];
  let state=createLab({seed:[d,config(),secret(),config('extra',{'log-name':'backend'})]});
  state=execute(state,'kubectl set env deployment/web --from=configmap/extra');
  state=execute(state,'kubectl set env deployment/web --from=secret/credentials');
  const c=find(state,'Deployment','web').spec.template.spec.containers[0];
  assert.deepEqual(c.envFrom,[{configMapRef:{name:'settings'}}]);
  assert.deepEqual(c.env.find(e=>e.name==='LOG_NAME'),{name:'LOG_NAME',valueFrom:{configMapKeyRef:{name:'extra',key:'log-name'}}});
  assert.deepEqual(c.env.find(e=>e.name==='PASSWORD'),{name:'PASSWORD',valueFrom:{secretKeyRef:{name:'credentials',key:'PASSWORD'}}});
  assert.deepEqual(objects(state,'Pod')[0]._sim.envSnapshot,{MODE:'production',LOG_LEVEL:'info',LOG_NAME:'backend',PASSWORD:'demo-only'});
  state=execute(state,'kubectl set env deployment/web LOG_NAME=override');
  assert.equal(objects(state,'Pod')[0]._sim.envSnapshot.LOG_NAME,'override');
  assert.equal(run(state,'kubectl set env deployment/web --from=service/web').error,true);
});

test('imported key references do not automatically include subsequently added ConfigMap keys',()=>{
  let state=createLab({seed:[deployment(),config()]});
  state=execute(state,'kubectl set env deployment/web --from=configmap/settings');
  state.files['settings.yaml']=[config('settings',{MODE:'maintenance',NEW_KEY:'new'})];
  state=execute(state,'kubectl apply -f settings.yaml');
  assert.deepEqual(objects(state,'Pod')[0]._sim.envSnapshot,{MODE:'production'});
  state=execute(state,'kubectl rollout restart deployment/web');
  assert.deepEqual(objects(state,'Pod')[0]._sim.envSnapshot,{MODE:'maintenance'});
});

test('deleting a configuration source preserves a running container but blocks new replacements',()=>{
  let state=createLab({seed:[configured(),config()]});
  const original=objects(state,'Pod')[0].metadata.name;
  state=execute(state,'kubectl delete configmap settings');
  assert.equal(find(state,'Pod',original).status.ready,true);
  assert.equal(run(state,`kubectl exec ${original} -- printenv MODE`).output,'production');
  state=execute(state,'kubectl rollout restart deployment/web');
  assert.equal(find(state,'Pod',original).status.ready,true);
  const replacement=objects(state,'Pod').find(p=>p.metadata.name!==original);
  assert.equal(replacement.status.reason,'CreateContainerConfigError');
  assert.equal(replacement.status.phase,'Pending');
  assert.equal(replacement._sim.envSnapshot,undefined);
  state=execute(state,'kubectl create configmap settings --from-literal=MODE=maintenance');
  assert.equal(objects(state,'Pod').length,1);
  assert.equal(objects(state,'Pod')[0]._sim.envSnapshot.MODE,'maintenance');
});

test('missing required key references block startup; optional missing references are omitted',()=>{
  const p=pod('client',{containers:[container('nginx:1.27',{env:[
    {name:'REQUIRED',valueFrom:{configMapKeyRef:{name:'settings',key:'absent'}}},
    {name:'OPTIONAL',valueFrom:{secretKeyRef:{name:'absent',key:'password',optional:true}}}
  ]})]});
  let state=createLab({seed:[p,config()]});
  assert.equal(find(state,'Pod','client').status.reason,'CreateContainerConfigError');
  assert.equal(find(state,'Pod','client').status.phase,'Pending');
  state.files['settings.yaml']=[config('settings',{absent:'ready'})];
  state=execute(state,'kubectl apply -f settings.yaml');
  assert.deepEqual(find(state,'Pod','client')._sim.envSnapshot,{REQUIRED:'ready'});
});

test('Pending Pods obtain environment at actual modeled startup, not at scheduling failure',()=>{
  const p=pod('client',{nodeSelector:{disk:'ssd'},containers:[container('nginx:1.27',{envFrom:[{configMapRef:{name:'settings'}}]})]});
  let state=createLab({seed:[p,config()]});
  assert.equal(find(state,'Pod','client').status.phase,'Pending');
  assert.equal(find(state,'Pod','client')._sim.envSnapshot,undefined);
  state.files['settings.yaml']=[config('settings',{MODE:'maintenance'})];
  state=execute(state,'kubectl apply -f settings.yaml');
  state=execute(state,'kubectl label node worker-1 disk=ssd');
  assert.equal(find(state,'Pod','client')._sim.envSnapshot.MODE,'maintenance');
});

test('initial image failures remain Pending and do not match the Running field selector',()=>{
  let state=createLab();state=execute(state,'kubectl run broken --image=missing:1');
  assert.equal(find(state,'Pod','broken').status.phase,'Pending');
  assert.equal(find(state,'Pod','broken')._sim.envSnapshot,undefined);
  assert.equal(run(state,'kubectl get pods --field-selector=status.phase=Running').output,'No resources found.');
  state=execute(state,'kubectl set image pod/broken broken=nginx:1.27');
  assert.equal(find(state,'Pod','broken').status.phase,'Running');
});

test('each container keeps its own environment; default exec uses the first container',()=>{
  const p=pod('web',{containers:[
    {name:'app',image:'nginx:1.27',env:[{name:'MODE',value:'app'}]},
    {name:'sidecar',image:'busybox:1.37',env:[{name:'MODE',value:'sidecar'},{name:'SIDECAR_ONLY',value:'yes'}]}
  ]});
  const state=createLab({seed:[p]});
  assert.equal(run(state,'kubectl exec web -- printenv MODE').output,'app');
  assert.equal(run(state,'kubectl exec web -- printenv SIDECAR_ONLY').output,'');
  assert.deepEqual(find(state,'Pod','web')._sim.environments.sidecar,{MODE:'sidecar',SIDECAR_ONLY:'yes'});
});

test('scheduler diagnostic checks are pure and match the scheduler placement decision',()=>{
  const p=pod('waiting',{nodeSelector:{disk:'ssd'},containers:[container('nginx:1.27',{resources:{requests:{cpu:'1200m',memory:'100Mi'}}})]});
  let state=createLab({seed:[pod('busy',{nodeName:'worker-1',containers:[container('nginx:1.27',{resources:{requests:{cpu:'1300m'}}})]}),p]});
  state=execute(state,'kubectl label node worker-1 disk=ssd');
  const before=structuredClone(state),checks=schedulingChecks(state,find(state,'Pod','waiting'));
  assert.deepEqual(state,before);
  assert.equal(checks[0].selectorMatches,true);
  assert.equal(checks[0].available.cpu,700);
  assert.equal(checks[0].requested.cpu,1200);
  assert.equal(checks[0].fitsResources,false);
  assert.equal(checks[1].selectorMatches,false);
  assert.equal(checks.every(n=>!n.eligible),true);
  state=execute(state,'kubectl label node worker-2 disk=ssd');
  assert.equal(find(state,'Pod','waiting').spec.nodeName,'worker-2');
});
