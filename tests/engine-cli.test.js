import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,run,find,objects,parse,goalMet} from '../src/engine.js';
import {deployment,pod} from '../src/model.js';

for(const mode of ['client','server']){
  for(const command of [
    'kubectl run sample --image=nginx:1.27',
    'kubectl create deployment sample --image=nginx:1.27',
    'kubectl apply -f web.yaml',
    'kubectl delete deployment/web'
  ]){
    test(`${command}: ${mode} dry-run does not change the cluster or satisfy action goals`,()=>{
      const state=createLab({seed:[deployment()],files:{'web.yaml':[deployment('web',3)]}});
      const result=run(state,`${command} --dry-run=${mode}`);
      assert.equal(result.error,false,result.output);
      assert.match(result.output,/dry run/);
      const {trace:beforeTrace,events:beforeEvents,...before}=state,{trace:afterTrace,events:afterEvents,...after}=result.state;
      assert.deepEqual(after,before);
      assert.equal(result.event.action,'dry-run');
      assert.deepEqual(afterEvents,[...beforeEvents,result.event]);
      assert.equal(goalMet(result.state,{type:'event',match:{action:result.event.operation}}),false);
    });
  }
}

test('dry-run YAML/JSON shows the requested resource, without controller output or persistence',()=>{
  const state=createLab({seed:[deployment()],files:{'web.yaml':[deployment('web',3)]}});
  const applied=run(state,'kubectl apply -f web.yaml --dry-run=client -o json');
  assert.equal(applied.error,false,applied.output);
  assert.equal(JSON.parse(applied.output).spec.replicas,3);
  assert.equal(JSON.parse(applied.output)._sim,undefined);
  assert.equal(find(applied.state,'Deployment','web').spec.replicas,1);
  const created=run(state,'kubectl create deployment sample --image=nginx:1.27 --dry-run=server -o yaml');
  assert.match(created.output,/kind: "Deployment"/);
  assert.doesNotMatch(created.output,/dry run|_sim|readyReplicas/);
  assert.equal(find(created.state,'Deployment','sample'),undefined);
});

test('a dry-run observation can complete the draft lesson without creating its Deployment',()=>{
  const state=createLab();
  const result=run(state,'kubectl create deployment web --image=nginx:1.27 --dry-run=client -o yaml');
  assert.equal(result.error,false,result.output);
  assert.equal(goalMet(result.state,{type:'all',goals:[
    {type:'event',match:{action:'dry-run',kind:'Deployment',name:'web'}},
    {type:'absent',kind:'Deployment',name:'web'}
  ]}),true);
  assert.equal(goalMet(result.state,{type:'event',match:{action:'create'}}),false);
});

test('dry-run none executes normally and output flags print applied resources',()=>{
  const state=createLab({files:{'web.yaml':[deployment('web',2)]}});
  const result=run(state,'kubectl apply -f web.yaml --dry-run=none -o json');
  assert.equal(result.error,false,result.output);
  assert.equal(JSON.parse(result.output).spec.replicas,2);
  assert.equal(objects(result.state,'Pod').length,2);
  const deleted=run(result.state,'kubectl delete --filename web.yaml --dry-run=none');
  assert.equal(deleted.error,false,deleted.output);
  assert.equal(objects(deleted.state,'Pod').length,0);
});

test('known but unsupported flags and invalid dry-run modes fail before mutations',()=>{
  const state=createLab({seed:[deployment()],files:{'web.yaml':[deployment('web',3)]}});
  for(const command of [
    'kubectl delete deployment/web --dry-run=banana',
    'kubectl scale deployment/web --replicas=3 --dry-run=client',
    'kubectl apply -f web.yaml --replicas=3',
    'kubectl get pods --image=nginx:1.27',
    'kubectl set env deployment/web MODE=maintenance --output=yaml',
    'kubectl run sample --image=nginx:1.27 --restart=Never',
    'kubectl get pods -o unsupported',
    'kubectl apply -f web.yaml -- ignored-tail',
    'lab tick --dry-run=client'
  ]){
    const result=run(state,command);
    assert.equal(result.error,true,command);
    assert.deepEqual(result.state.objects,state.objects,command);
    assert.deepEqual(result.state.events,state.events,command);
  }
});

test('explicit false boolean flags do not become truthy strings',()=>{
  assert.equal(parse('kubectl get pods --all-namespaces=false').flags['all-namespaces'],false);
  const state=createLab({seed:[pod('sample')]});
  const result=run(state,'kubectl delete pods --all=false');
  assert.equal(result.error,true);
  assert.ok(find(result.state,'Pod','sample'));
  assert.equal(run(state,'kubectl delete pods --all=maybe').error,true);
});
