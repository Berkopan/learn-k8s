import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,delimiter} from 'node:path';
import {spawnSync} from 'node:child_process';
import {parseAllDocuments} from 'yaml';
import {LAB_IDS,buildLabArchive,archivePath} from '../scripts/package-labs.mjs';

const root=resolve('public/labs');
function manifests(path){return parseAllDocuments(readFileSync(path,'utf8')).map(document=>{
  assert.deepEqual(document.errors,[],path);return document.toJS();
});}
function noSimulationFields(value){
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    assert.notEqual(key,'_sim');assert.notEqual(key,'status');noSimulationFields(child);
  }
}

for(const id of LAB_IDS){
  test(`${id}: actual Kubernetes manifests are scoped to the owned lab namespace`,()=>{
    const directory=join(root,id),namespace=`learn-k8s-${id}`;
    const ns=manifests(join(directory,'namespace.yaml'))[0];
    assert.equal(ns.apiVersion,'v1');assert.equal(ns.kind,'Namespace');assert.equal(ns.metadata.name,namespace);
    assert.equal(ns.metadata.labels['learn-k8s.io/lab'],id);
    for(const name of readdirSync(directory).filter(name=>name.endsWith('.yaml')&&name!=='namespace.yaml')){
      for(const object of manifests(join(directory,name))){
        assert.equal(object.apiVersion,object.kind==='Deployment'?'apps/v1':'v1');
        assert.ok(['Deployment','Pod','Service','ConfigMap'].includes(object.kind));
        assert.equal(object.metadata.namespace,namespace);
        noSimulationFields(object);
      }
    }
    const starter=manifests(join(directory,'starter.yaml'));
    const d=starter.find(object=>object.kind==='Deployment');
    assert.equal(d.spec.replicas,2);
    assert.deepEqual(d.spec.selector.matchLabels,d.spec.template.metadata.labels);
    for(const doc of ['README.md','README.tr.md']){
      const text=readFileSync(join(directory,doc),'utf8');
      for(const script of ['start.sh','verify.sh','cleanup.sh'])assert.ok(text.includes(script));
      assert.ok(text.includes('https://kubernetes.io/'));
    }
    for(const name of readdirSync(directory).filter(name=>name.endsWith('.sh'))){
      const result=spawnSync('sh',['-n',join(directory,name)],{encoding:'utf8'});
      assert.equal(result.status,0,`${name}: ${result.stderr||result.error}`);
    }
  });

  test(`${id}: committed ZIP is reproducible and contains the current source bytes`,()=>{
    const first=buildLabArchive(id),second=buildLabArchive(id);
    assert.ok(first.equals(second));
    assert.ok(first.equals(readFileSync(archivePath(id))),`Run node scripts/package-labs.mjs after editing ${id}.`);
  });

  for(const script of ['start.sh','cleanup.sh']){
    test(`${id}: ${script} refuses a namespace owned by another workload before writes`,()=>{
      const temporary=mkdtempSync(join(tmpdir(),'learn-k8s-lab-guard-'));
      try{
        const log=join(temporary,'calls.log');
        writeFileSync(join(temporary,'kubectl'),'#!/bin/sh\nprintf "%s\\n" "$*" >> "$LAB_TEST_LOG"\nif [ "$1" = get ] && [ "$2" = namespace ]; then\n  printf "%s|foreign-owner" "$3"\nfi\n',{mode:0o755});
        const result=spawnSync('sh',[join(root,id,script)],{encoding:'utf8',env:{...process.env,PATH:`${temporary}${delimiter}${process.env.PATH||''}`,LAB_TEST_LOG:log}});
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/Refusing to modify/);
        const calls=readFileSync(log,'utf8').trim().split('\n');
        assert.equal(calls.length,1);
        assert.ok(calls[0].startsWith(`get namespace learn-k8s-${id} `));
      }finally{rmSync(temporary,{recursive:true,force:true});}
    });
  }
}

test('starter manifests contain the intended image, selector and environment exercises',()=>{
  const broken=manifests(join(root,'deployment-repair/starter.yaml'));
  assert.match(broken.find(o=>o.kind==='Deployment').spec.template.spec.containers[0].image,/learner-typo/);
  const networking=manifests(join(root,'service-selector/starter.yaml'));
  assert.notDeepEqual(networking.find(o=>o.kind==='Service').spec.selector,networking.find(o=>o.kind==='Deployment').spec.template.metadata.labels);
  const configuration=manifests(join(root,'configmap-refresh/starter.yaml'));
  assert.equal(configuration.find(o=>o.kind==='ConfigMap').data.MODE,'production');
  assert.deepEqual(configuration.find(o=>o.kind==='Deployment').spec.template.spec.containers[0].envFrom,[{configMapRef:{name:'settings'}}]);
  assert.equal(manifests(join(root,'configmap-refresh/settings-maintenance.yaml'))[0].data.MODE,'maintenance');
});
