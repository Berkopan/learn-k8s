import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,run,find,objects} from '../src/engine.js';
import {traffic} from '../src/simulator-core.js';
import {deployment,pod,service,object,daemon} from '../src/model.js';

function execute(state,command){const result=run(state,command);assert.equal(result.error,false,result.output);return result.state;}
const policy=ingress=>object('NetworkPolicy','web-ingress',{podSelector:{matchLabels:{app:'web'}},policyTypes:['Ingress'],ingress});

test('empty inner ingress lists allow all sources and ports, while an empty outer list denies',()=>{
  for(const ingress of [[{}],[{from:[]}],[{ports:[]}],[{from:[],ports:[]}]]){
    const state=createLab({seed:[deployment(),service(),pod('client'),policy(ingress)]});
    const result=run(state,'kubectl exec client -- wget -qO- http://web:80');
    assert.equal(result.error,false,`${JSON.stringify(ingress)}: ${result.output}`);
  }
  const denied=createLab({seed:[deployment(),service(),pod('client'),policy([])]});
  assert.equal(run(denied,'kubectl exec client -- curl http://web:80').error,true);
  const restricted=createLab({seed:[deployment(),service(),pod('client'),policy([{from:[{podSelector:{matchLabels:{app:'allowed'}}}],ports:[{port:80}]}])]});
  assert.equal(run(restricted,'kubectl exec client -- curl http://web:80').error,true);
});

test('an empty peer admits cross-namespace traffic but a podSelector alone stays namespaced',()=>{
  const d=deployment(),svc=service(),np=policy([{from:[{}]}]);
  for(const r of [d,svc,np])r.metadata.namespace='staging';
  let state=createLab({seed:[d,svc,np,pod('client')]});
  const allowed=run(state,'kubectl exec client -- curl http://web.staging:80');
  assert.equal(allowed.error,false,allowed.output);
  state.files['policy.yaml']=[{...np,spec:{...np.spec,ingress:[{from:[{podSelector:{}}]}]}}];
  state=execute(state,'kubectl apply -f policy.yaml');
  assert.equal(run(state,'kubectl exec client -- curl http://web.staging:80').error,true);
});

test('an unrelated empty PDB does not veto drain and an affected budget still protects its Pods',()=>{
  const budget=object('PodDisruptionBudget','other-budget',{minAvailable:1,selector:{matchLabels:{app:'other'}}});
  let state=createLab({seed:[budget]});
  state=execute(state,'kubectl drain worker-1 --ignore-daemonsets');
  assert.equal(find(state,'Node','worker-1').spec.unschedulable,true);
  const protectedBudget=object('PodDisruptionBudget','web-budget',{minAvailable:1,selector:{matchLabels:{app:'web'}}});
  state=createLab({seed:[deployment(),protectedBudget]});
  const refused=run(state,'kubectl drain worker-1 --ignore-daemonsets');
  assert.equal(refused.error,true);
  assert.deepEqual(refused.state.objects,state.objects);
});

test('DaemonSet Pods retained by drain do not spend disruption budget',()=>{
  const d=daemon('agent');
  const budget=object('PodDisruptionBudget','agent-budget',{minAvailable:2,selector:{matchLabels:{app:'agent'}}});
  let state=createLab({seed:[d,budget]});
  const before=objects(state,'Pod').map(p=>p.metadata.name);
  state=execute(state,'kubectl drain worker-1 --ignore-daemonsets');
  assert.deepEqual(objects(state,'Pod').map(p=>p.metadata.name),before);
});

test('successful equivalent HTTP commands record normalized observations and keep legacy events',()=>{
  const state=createLab({seed:[deployment(),service(),pod('client')]});
  const request={service:'web',namespace:'default',port:80,status:200};
  const lab=run(state,'lab request web');
  assert.equal(lab.error,false,lab.output);
  assert.equal(lab.event.action,'lab request');
  assert.equal(lab.event.value,'web');
  assert.deepEqual(lab.event.request,{...request,source:null});
  for(const tool of ['curl','wget']){
    const result=run(state,`kubectl exec client -- ${tool} http://web.default.svc.cluster.local:80/`);
    assert.equal(result.error,false,result.output);
    assert.equal(result.event.action,'exec');
    assert.equal(result.event.name,'client');
    assert.deepEqual(result.event.request,{...request,source:'client'});
    assert.deepEqual(result.state.events.at(-1).request,result.event.request);
  }
  const forwarded=execute(state,'kubectl port-forward service/web 8080:80');
  const response=run(forwarded,'curl http://localhost:8080');
  assert.equal(response.event.action,'curl');
  assert.deepEqual(response.event.request,{...request,source:null});
  assert.equal(typeof traffic(structuredClone(state),'web','default'),'string');
});

test('request observations retain destination namespace and Service port, with no success event on failure',()=>{
  const d=deployment(),svc=service('web',{app:'web'},8080,80);
  for(const r of [d,svc])r.metadata.namespace='staging';
  const state=createLab({seed:[d,svc,pod('client')]});
  const result=run(state,'kubectl exec client -- curl http://web.staging:8080');
  assert.equal(result.event.namespace,'default');
  assert.deepEqual(result.event.request,{service:'web',namespace:'staging',port:8080,source:'client',status:200});
  const failure=run(state,'kubectl exec client -- curl http://web.staging:80');
  assert.equal(failure.error,true);
  assert.equal(failure.event,undefined);
  assert.deepEqual(failure.state.events,state.events);
  assert.equal(run(state,'kubectl exec client -- hostname').event.request,undefined);
});
