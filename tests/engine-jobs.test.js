import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,run,find,objects} from '../src/engine.js';
import {job,object} from '../src/model.js';

function execute(state,command){const result=run(state,command);assert.equal(result.error,false,result.output);return result.state;}
const workers=state=>objects(state,'Pod').filter(p=>p._sim.owner?.startsWith('Job/'));

for(const [name,modify] of [
  ['image pull failure',j=>j.spec.template.spec.containers[0].image='missing:1'],
  ['unschedulable requests',j=>j.spec.template.spec.containers[0].resources={requests:{cpu:'3'}}],
  ['missing configuration',j=>j.spec.template.spec.containers[0].envFrom=[{configMapRef:{name:'absent'}}]],
  ['missing volume',j=>j.spec.template.spec.volumes=[{name:'data',persistentVolumeClaim:{claimName:'absent'}}]]
]){
  test(`Job ${name} cannot complete just because time advances`,()=>{
    const j=job('blocked');modify(j);
    let state=createLab({seed:[j]});
    for(let tick=0;tick<2;tick++)state=execute(state,'lab tick');
    assert.equal(find(state,'Job','blocked').status.succeeded,0);
    assert.equal(find(state,'Job','blocked').status.active,1);
    assert.equal(workers(state)[0]._sim.complete,undefined);
    assert.equal(run(state,'kubectl wait --for=condition=Complete job/blocked').error,true);
  });
}

test('a quota-blocked Job with no workers cannot fabricate success',()=>{
  let state=createLab({seed:[object('ResourceQuota','none',{hard:{pods:'0'}}),job()]});
  state=execute(state,'lab tick');
  assert.equal(workers(state).length,0);
  assert.deepEqual(find(state,'Job','report').status,{active:0,succeeded:0,conditions:[]});
});

test('a worker completes only on a tick after its configuration blocker is repaired',()=>{
  const j=job();j.spec.template.spec.containers[0].envFrom=[{configMapRef:{name:'settings'}}];
  let state=createLab({seed:[j]});
  state=execute(state,'lab tick');
  state=execute(state,'kubectl create configmap settings --from-literal=MODE=ready');
  assert.equal(find(state,'Job','report').status.succeeded,0);
  assert.equal(workers(state)[0].status.phase,'Running');
  state=execute(state,'lab tick');
  assert.equal(find(state,'Job','report').status.succeeded,1);
  assert.equal(workers(state)[0].status.phase,'Succeeded');
  assert.equal(run(state,'kubectl wait --for=condition=Complete job/report').error,false);
  state=execute(state,'kubectl delete configmap settings');
  assert.equal(workers(state)[0].status.phase,'Succeeded');
});

test('parallel Jobs count completed workers in batches and wait for the full target',()=>{
  const j=job('batch');Object.assign(j.spec,{parallelism:2,completions:4});
  let state=createLab({seed:[j]});
  assert.equal(find(state,'Job','batch').status.active,2);
  state=execute(state,'lab tick');
  assert.deepEqual(find(state,'Job','batch').status,{active:2,succeeded:2,conditions:[]});
  assert.equal(workers(state).filter(p=>p.status.phase==='Succeeded').length,2);
  assert.equal(run(state,'kubectl wait --for=condition=Complete job/batch').error,true);
  state=execute(state,'lab tick');
  assert.deepEqual(find(state,'Job','batch').status,{active:0,succeeded:4,conditions:[{type:'Complete',status:'True'}]});
  assert.equal(workers(state).length,4);
  const serial=state.serial;
  state=execute(state,'kubectl delete pods --all');
  state=execute(state,'lab tick');
  assert.equal(workers(state).length,0);
  assert.equal(state.serial,serial);
  assert.equal(find(state,'Job','batch').status.succeeded,4);
});

test('parallelism does not create more workers than remaining completions',()=>{
  const j=job();Object.assign(j.spec,{parallelism:4,completions:1});
  const state=createLab({seed:[j]});
  assert.equal(workers(state).length,1);
});

test('Job completion depends on execution, not a readiness probe',()=>{
  const j=job();j.spec.template.spec.containers[0].readinessProbe={httpGet:{path:'/broken',port:80}};
  let state=createLab({seed:[j]});
  assert.equal(workers(state)[0].status.ready,false);
  assert.equal(workers(state)[0].status.phase,'Running');
  state=execute(state,'lab tick');
  assert.equal(workers(state)[0].status.phase,'Succeeded');
  assert.equal(find(state,'Job','report').status.succeeded,1);
});

test('init and main worker lifecycles advance separately after placement',()=>{
  const j=job();j.spec.template.spec.initContainers=[{name:'prepare',image:'busybox:1.37'}];
  j.spec.template.spec.nodeSelector={disk:'ssd'};
  let state=createLab({seed:[j]});
  state=execute(state,'lab tick');
  assert.equal(workers(state)[0]._sim.initDone,undefined);
  state=execute(state,'kubectl label node worker-1 disk=ssd');
  assert.match(workers(state)[0].status.reason,/^Init:/);
  state=execute(state,'lab tick');
  assert.equal(workers(state)[0].status.phase,'Running');
  assert.equal(find(state,'Job','report').status.succeeded,0);
  state=execute(state,'lab tick');
  assert.equal(find(state,'Job','report').status.succeeded,1);
});
