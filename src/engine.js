import {helpText,helpTopic,validateDockerInvocation,dockerSuggestions} from './command-help.js';
import {copy, object, pod, deployment, service, job, cron, meta, isCluster, subset, merge, yaml, refKey, pathGet} from './model.js';
import { kindOf, tokenize, parse, validateInvocation, objects, find, quantity, matches, createLab, aliases, ensure, count, labelSelector, pushTrace, clean, validate, put, reconcile, resourceArgs, listRows, templateOf, apiCan, trafficResult } from './simulator-core.js';
export { kindOf, tokenize, parse, objects, find, quantity, matches, createLab };
const renderObjects=(items,format)=>format==='json'?JSON.stringify(items.length===1?clean(items[0]):{apiVersion:'v1',kind:'List',items:items.map(clean)},null,2):items.map(r=>yaml(clean(r))).join('\n---\n');
function execute(s,q){
  const {binary,args:a,flags:f,tail}=q;const ns=String(f.n||f.namespace||s.namespace);let event={action:binary,namespace:ns},out='';
  if(!binary)return {out:'',event:null};
  const topic=helpTopic(q);
  if(topic!==null)return {out:helpText(topic),event:{action:'help',topic}};
  validateInvocation(q);
  if(binary==='clear'||binary==='history')return {out:'',event:{action:binary}};
  if(binary==='ls')return {out:Object.keys(s.files).join('\n')||'(bu laboratuvarda dosya yok)',event:{action:'ls'}};
  if(binary==='cat'){if(!s.files[a[0]])throw new Error(`Dosya bulunamadı: ${a[0]}`);return {out:typeof s.files[a[0]]==='string'?s.files[a[0]]:s.files[a[0]].map(y=>yaml(y)).join('\n---\n'),event:{action:'cat',file:a[0]}};}
  if(binary==='lab'){
    event={action:`lab ${a[0]}`,value:a[1]};
    if(a[0]==='load'){s.load=Number(a[1]);if(!Number.isFinite(s.load)||s.load<0||s.load>500)throw new Error('lab load 0–500 arası CPU request yüzdesi gerektirir.');out=`Simüle CPU kullanımı: request değerinin %${s.load} kadarı. HPA döngüsü için lab tick.`;}
    else if(a[0]==='request'){const response=trafficResult(s,a[1],ns);out=response.output;event.request=response.request;}
    else if(a[0]==='tick'){
      s.ticks++;
      for(const p of objects(s,'Pod')){
        if(p.status?.reason?.startsWith('Init:'))p._sim.initDone=true;
        else if(p._sim.owner?.startsWith('Job/')&&p.status?.phase==='Running'&&p.status.reason==='Running')p._sim.complete=true;
      }
      for(const h of objects(s,'HorizontalPodAutoscaler')){const d=ensure(s,'Deployment',h.spec.scaleTargetRef.name,h.metadata.namespace),target=h.spec.metrics?.[0]?.resource?.target?.averageUtilization||60;if(!(d.spec.template.spec.containers||[]).every(c=>c.resources?.requests?.cpu)){h.status={conditions:[{type:'ScalingActive',status:'False',reason:'FailedGetResourceMetric'}]};pushTrace(s,'HPA','CPU request eksik; utilization hesaplanamaz.','error');continue;}const desired=Math.min(h.spec.maxReplicas,Math.max(h.spec.minReplicas||1,Math.ceil((d.spec.replicas||1)*s.load/target)));d.spec.replicas=desired;h.status={currentCPUUtilizationPercentage:s.load,desiredReplicas:desired};pushTrace(s,'HPA',`ceil(current × ${s.load}/${target}) → ${desired} replica`);}
      out=`Simülasyon adımı ${s.ticks}: init/Job/HPA denetleyicileri ilerletildi. Gerçek zaman geçmedi.`;
    }else throw new Error('LAB komutu bulunamadı. help kullan.');reconcile(s);return {out,event};
  }
  if(binary==='docker'){
    validateDockerInvocation(a,f,tail);
    event={action:`docker ${a[0]}`,name:a[1]};const image=a[1];
    if(a[0]==='pull'){if(!image)throw new Error('Image gerekli.');if(!s.docker.images.includes(image))s.docker.images.push(image);pushTrace(s,'Registry',`${image}: katmanlar yerel image deposuna alındı.`);out=`Pull complete (simulated)\nStatus: Downloaded ${image}`;}
    else if(a[0]==='images')out='REPOSITORY:TAG\n'+s.docker.images.join('\n');
    else if(a[0]==='run'){const name=f.name||`container-${++s.serial}`;if(!image)throw new Error('Image gerekli.');if(s.docker.containers.some(c=>c.name===name))throw new Error('Container adı zaten kullanılıyor.');if(!s.docker.images.includes(image))s.docker.images.push(image);s.docker.containers.push({name,image,status:'Running'});event.name=name;out=`${name} started (simulated)`;pushTrace(s,'Runtime',`${name}: image → çalışan container`);}
    else if(a[0]==='ps')out=s.docker.containers.filter(c=>f.all||f.a||c.status==='Running').map(c=>`${c.name}\t${c.image}\t${c.status}`).join('\n')||'No containers.';
    else if(a[0]==='tag'){if(!s.docker.images.includes(image))throw new Error('Kaynak image yok.');if(!a[2])throw new Error('Yeni tag gerekli.');if(!s.docker.images.includes(a[2]))s.docker.images.push(a[2]);out=`Tagged ${a[2]} (aynı image için yeni etiket)`;}
    else {const c=s.docker.containers.find(c=>c.name===image);if(!c)throw new Error(`Container bulunamadı: ${image}`);if(a[0]==='stop'){c.status='Exited';out=image;}else if(a[0]==='rm'){if(c.status==='Running')throw new Error('Çalışan container önce durdurulmalı.');s.docker.containers=s.docker.containers.filter(x=>x!==c);out=image;}else if(a[0]==='logs')out='Server listening on port 80\nGET / 200';else if(a[0]==='inspect')out=JSON.stringify(c,null,2);else throw new Error('Desteklenmeyen docker komutu. help kullan.');}return {out,event};
  }
  if(binary==='helm'){
    const [verb,name]=a;event={action:`helm ${verb}`,name};const release=s.releases.find(r=>r.name===name);
    if(verb==='list')out=s.releases.map(r=>`${r.name}\t${r.revisions.length}\tdeployed`).join('\n')||'No releases.';
    else if(verb==='install'||verb==='upgrade'){
      if(verb==='install'&&release)throw new Error('Release zaten var.');if(verb==='upgrade'&&!release)throw new Error('Release bulunamadı.');if(a[2]!=='./chart')throw new Error('Bu simülatör yalnızca lab içindeki ./chart örnek chartını destekler.');
      const raw=f.set||'replicaCount=1', [key,value]=String(raw).split('=');if(key!=='replicaCount')throw new Error('Örnek chart yalnızca replicaCount değerini modeller.');const replicas=count(value),r=release||{name,revisions:[]};r.revisions.push(replicas);if(!release)s.releases.push(r);const d=deployment(name,replicas);d.metadata.namespace=ns;put(s,d);const svc=service(name);svc.metadata.namespace=ns;put(s,svc);out=`Release ${name}: revision ${r.revisions.length}, replicas=${replicas}`;
    }else if(verb==='history'){if(!release)throw new Error('Release yok.');out=release.revisions.map((n,i)=>`${i+1}\treplicas=${n}`).join('\n');}
    else if(verb==='rollback'){if(!release)throw new Error('Release yok.');const n=release.revisions[Number(a[2])-1];if(n===undefined)throw new Error('Revision yok.');ensure(s,'Deployment',name,ns).spec.replicas=n;release.revisions.push(n);out=`Rolled back ${name}; yeni revision ${release.revisions.length}`;}
    else if(verb==='uninstall'){if(!release)throw new Error('Release yok.');s.releases=s.releases.filter(r=>r!==release);s.objects=s.objects.filter(r=>!((r.metadata.name===name&&['Deployment','Service'].includes(r.kind))||r._sim?.owner===`Deployment/${name}`||r.kind==='ReplicaSet'&&r._sim?.owner===name));out=`Release ${name} uninstalled`;}
    else throw new Error('Desteklenmeyen Helm komutu. help kullan.');reconcile(s);return {out,event};
  }
  if(binary==='curl'){if(!s.forward)throw new Error('Önce kubectl port-forward kullan. Gerçek ağ bağlantısı açılmaz.');const url=a[0]?.match(/^http:\/\/(?:localhost|127\.0\.0\.1):(\d+)(?:\/.*)?$/);if(!url||Number(url[1])!==s.forward.local)throw new Error('Yalnız açık simüle port-forward üzerindeki localhost portuna istek gönderilebilir.');const response=trafficResult(s,s.forward.service,s.forward.namespace);return {out:response.output,event:{action:'curl',request:response.request}};}
  if(binary!=='kubectl')throw new Error(`${binary}: command not found. Bu güvenli simülasyonda help komutunu kullan.`);
  const verb=a.shift();event={action:verb,namespace:ns};
  if(f.as&&verb!=='auth'){
    const supported=['get','describe','delete'];if(!supported.includes(verb))throw new Error('Bu model --as ile get/describe/delete ve auth can-i işlemlerini yetkilendirir; diğer işlemleri bu kimlikle modellemez.');
    const {kind,name}=resourceArgs(a),resource=Object.entries(aliases).find(([key,value])=>value===kind&&key.endsWith('s'))?.[0];
    const permission=verb==='get'?(name?'get':'list'):verb==='describe'?'get':'delete';
    if(f.A||f['all-namespaces']||isCluster(kind)||!apiCan(s,permission,resource,f.as,ns))throw new Error(`Forbidden: ${f.as} cannot ${permission} ${resource||kind} in namespace ${ns}.`);
  }
  if(verb==='version')return {out:'Client: learn-k8s simulated kubectl\nServer: no real Kubernetes server\nStable API concepts; not a full version emulator.',event};
  if(verb==='cluster-info')return {out:'Kubernetes control plane (simulated): https://api.learning.local\nCoreDNS (simulated): kube-system\nRuntime: containerd (conceptual; no daemon is running)',event};
  if(verb==='api-resources')return {out:[...new Set(Object.values(aliases))].join('\n'),event};
  if(verb==='config'){
    event={action:`config ${a[0]}`,name:a[1],namespace:ns};
    if(a[0]==='current-context')out=s.context;else if(a[0]==='get-contexts')out='CURRENT  NAME       NAMESPACE\n'+['learning','staging'].map(x=>`${s.context===x?'*':' '}        ${x}      ${x==='learning'?'default':'staging'}`).join('\n');
    else if(a[0]==='use-context'){if(!['learning','staging'].includes(a[1]))throw new Error('Context bulunamadı.');s.context=a[1];s.namespace=a[1]==='staging'?'staging':'default';out=`Switched to context "${a[1]}". Bu eğitimde iki context aynı simüle kümeyi kullanır.`;}
    else if(a[0]==='set-context'&&f.current&&f.namespace){ensure(s,'Namespace',f.namespace);s.namespace=f.namespace;out=`Context namespace: ${s.namespace}`;}else throw new Error('Desteklenmeyen config işlemi.');return {out,event};
  }
  if(verb==='explain'){const schemas={'pod':'Pod: aynı node üzerinde birlikte zamanlanan container grubu.\nFIELDS: apiVersion, kind, metadata, spec, status','pod.spec.containers':'containers <[]Container> - required\nFIELDS: name, image, ports, env, resources, readinessProbe, livenessProbe, startupProbe','deployment.spec.replicas':'replicas <integer>\nİstenen Pod sayısı. Controller gözlenen durumu bu sayıya yakınsar.','service.spec.selector':'selector <map[string]string>\nAynı namespace içindeki Pod etiketleriyle eşleşir.','pod.spec.restartPolicy':'restartPolicy <string>\nAlways | OnFailure | Never'};if(!schemas[a[0]])throw new Error('Bu alan yerel şema özetinde yok. Desteklenenler: '+Object.keys(schemas).join(', '));return {out:schemas[a[0]],event:{...event,path:a[0]}};}
  if(['get','describe','top'].includes(verb)){
    const {kind,name}=resourceArgs(a);event={...event,kind,name,selector:f.l||f.selector,output:f.o||f.output,allNamespaces:!!(f.A||f['all-namespaces']),previous:!!f.previous};
    if(kind==='Event')return {out:s.trace.map(t=>`${t.actor}\t${t.text}`).join('\n')||objects(s,'Pod',ns).map(p=>`${p.metadata.name}\t${p._sim.message}`).join('\n')||'No events.',event};
    if(!Object.values(aliases).includes(kind)&&kind!=='all')throw new Error(`Kaynak türü bulunamadı: ${kind}`);
    let items=objects(s,kind==='all'?null:kind,f.A||f['all-namespaces']?null:ns).filter(r=>(!name||r.metadata.name===name)&&labelSelector(r.metadata.labels,f.l||f.selector));
    if(kind==='all')items=items.filter(r=>['Pod','Service','Deployment','ReplicaSet','StatefulSet','DaemonSet','Job','CronJob','HorizontalPodAutoscaler'].includes(r.kind));
    if(f['field-selector'])items=items.filter(r=>String(f['field-selector']).split(',').every(x=>{const [k,v]=x.split('=');return pathGet(r,k)===v;}));
    if(name&&!items.length)throw new Error(`${kind} "${name}" bulunamadı.`);
    if(verb==='top'){if(!['Pod','Node'].includes(kind))throw new Error('top yalnız pods veya nodes için desteklenir.');if(!s.metrics)throw new Error('Metrics API not available. Gerçek kümede metrics-server gerekir.');out='NAME              CPU(cores)   MEMORY(bytes)\n'+items.map(r=>`${r.metadata.name.padEnd(18)} ${Math.round(s.load*2)}m        64Mi`).join('\n');}
    else if(f.o==='json'||f.output==='json')out=JSON.stringify(name?clean(items[0]):{apiVersion:'v1',kind:'List',items:items.map(clean)},null,2);
    else if(f.o==='yaml'||f.output==='yaml'||verb==='describe')out=items.map(r=>yaml(clean(r))+(verb==='describe'&&r._sim?.message?`\nEvents: ${r._sim.message}`:'')).join('\n---\n');
    else {out=listRows(items,(f.o||f.output)==='wide');if(f['show-labels'])out+='\n\nLABELS\n'+items.map(r=>`${r.metadata.name}: ${Object.entries(r.metadata.labels||{}).map(([k,v])=>`${k}=${v}`).join(',')||'<none>'}`).join('\n');}
    pushTrace(s,'API server',`${kind}: ${items.length} kaynak okundu.`);return {out,event};
  }
  if(verb==='run'){if(!a[0]||!f.image)throw new Error('kubectl run NAME --image=IMAGE gerekli.');const r=pod(a[0],{containers:[{name:a[0],image:f.image,...(f.env?{env:[{name:String(f.env).split('=')[0],value:String(f.env).split('=').slice(1).join('=')}]}:{})}]},{run:a[0]});r.metadata.namespace=ns;const saved=put(s,r,{create:true});event={...event,kind:'Pod',name:a[0],output:f.o||f.output};out=event.output?renderObjects([saved],event.output):`pod/${a[0]} created`;}
  else if(verb==='create'){
    let [raw,name]=a,kind=kindOf(raw),r;event={...event,kind,name};
    if(kind==='Namespace')r=object(kind,name,{}, {metadata:{name,labels:{'kubernetes.io/metadata.name':name}}});
    else if(kind==='Deployment'){if(!f.image)throw new Error('--image gerekli.');r=deployment(name,count(f.replicas??1),f.image);r.spec.template.spec.containers[0].name=String(f.image).split('/').pop().split(':')[0];}
    else if(kind==='ConfigMap'||kind==='Secret'){if(kind==='Secret'){if(name!=='generic')throw new Error('Bu lab secret generic sözdizimini destekler.');name=a[2];event.name=name;}const data={};for(const literal of f['from-literal']||[]){const i=literal.indexOf('=');if(i<1)throw new Error('--from-literal=KEY=VALUE gerekli.');data[literal.slice(0,i)]=literal.slice(i+1);}if(!Object.keys(data).length)throw new Error('En az bir --from-literal gerekli.');r=object(kind,name,undefined,kind==='Secret'?{type:'Opaque',stringData:data}:{data});}
    else if(kind==='ServiceAccount')r=object(kind,name,undefined);
    else if(kind==='Role'){if(!f.verb||!f.resource)throw new Error('--verb ve --resource gerekli.');r=object(kind,name,undefined,{rules:[{apiGroups:[''],resources:String(f.resource).split(','),verbs:String(f.verb).split(',')}]});}
    else if(kind==='RoleBinding'){if(!f.role||!f.serviceaccount)throw new Error('--role ve --serviceaccount gerekli.');const [subjectNs,account]=String(f.serviceaccount).split(':');r=object(kind,name,undefined,{roleRef:{apiGroup:'rbac.authorization.k8s.io',kind:'Role',name:f.role},subjects:[{kind:'ServiceAccount',name:account,namespace:subjectNs}]});}
    else if(kind==='Job'){if(f.from){const c=ensure(s,'CronJob',String(f.from).split('/').pop(),ns);r=object('Job',name,copy(c.spec.jobTemplate.spec));}else{if(!f.image)throw new Error('--image gerekli.');r=job(name);r.spec.template.spec.containers[0].image=f.image;if(tail.length)r.spec.template.spec.containers[0].command=tail;}}
    else if(kind==='CronJob'){if(!f.schedule||!f.image)throw new Error('--schedule ve --image gerekli.');r=cron(name);r.spec.schedule=f.schedule;r.spec.jobTemplate.spec.template.spec.containers[0].image=f.image;}
    else if(kind==='Ingress'){const match=String(f.rule||'').match(/^([^/]+)\/\*=([^:]+):(\d+)$/);if(!match)throw new Error('--rule="HOST/*=SERVICE:PORT" gerekli.');r=object(kind,name,{ingressClassName:f.class||'nginx',rules:[{host:match[1],http:{paths:[{path:'/',pathType:'Prefix',backend:{service:{name:match[2],port:{number:Number(match[3])}}}}]}}]});}
    else throw new Error('Bu create türü desteklenmiyor; YAML ile apply kullan.');
    r.metadata.namespace=ns;
    const saved=put(s,r,{create:true});event.output=f.o||f.output;out=event.output?renderObjects([saved],event.output):`${kind.toLowerCase()}/${name} created`;
  }
  else if(['apply','diff'].includes(verb)){
    const file=f.f||f.filename;if(!file||!s.files[file]||typeof s.files[file]==='string')throw new Error('Geçerli bir lab YAML dosyası gerekli. ls ile dosyaları gör.');
    const docs=copy(s.files[file]);if(!docs.length)throw new Error('Manifest boş.');event={...event,file};
    for(const r of docs){if(f.n||f.namespace)r.metadata.namespace=ns;validate(s,r);}
    if(verb==='diff'){out=docs.map(r=>{const existing=find(s,r.kind,r.metadata.name,r.metadata.namespace||ns);return subset(existing,r)?`= ${r.kind}/${r.metadata.name}: değişiklik yok`:`+ ${r.kind}/${r.metadata.name}\n${yaml(r)}`;}).join('\n');return {out,event};}
    const saved=docs.map(r=>put(s,r));event.output=f.o||f.output;out=event.output?renderObjects(saved,event.output):saved.map(r=>`${r.kind.toLowerCase()}/${r.metadata.name} configured`).join('\n');
  }
  else if(verb==='delete'){
    const file=f.f||f.filename;let targets;if(file){if(!s.files[file]||typeof s.files[file]==='string')throw new Error('YAML dosyası bulunamadı.');targets=s.files[file].map(r=>ensure(s,r.kind,r.metadata.name,(f.n||f.namespace)?ns:r.metadata.namespace||ns));}else{const {kind,name}=resourceArgs(a);event={...event,kind,name};if(!name&&!f.all)throw new Error('Kaynak adı ya da --all gerekli.');targets=name?[ensure(s,kind,name,ns)]:objects(s,kind,ns);}
    for(const r of targets){s.objects=s.objects.filter(o=>o!==r&&!(o.metadata.namespace===r.metadata.namespace&&(o._sim?.owner===`${r.kind}/${r.metadata.name}`||r.kind==='Deployment'&&o.kind==='ReplicaSet'&&o._sim?.owner===r.metadata.name))&&!(r.kind==='Namespace'&&o.metadata.namespace===r.metadata.name));if(r.kind==='PersistentVolumeClaim')for(const pv of objects(s,'PersistentVolume'))if(pv.spec.claimRef?.name===r.metadata.name&&pv.spec.claimRef.namespace===r.metadata.namespace)pv.status={phase:'Released'};pushTrace(s,'API server',`${r.kind}/${r.metadata.name} silindi.`,'remove');}event.output=f.o||f.output;out=event.output?renderObjects(targets,event.output):targets.map(r=>`${r.kind.toLowerCase()}/${r.metadata.name} deleted`).join('\n')||'No resources found.';
  }
  else if(['scale','expose','label','annotate','patch'].includes(verb)){
    const {kind,name}=resourceArgs(a),r=ensure(s,kind,name,ns);event={...event,kind,name};
    if(verb==='scale'){if(!['Deployment','StatefulSet'].includes(kind)||f.replicas===undefined)throw new Error('Ölçeklenebilir kaynak ve --replicas gerekli.');r.spec.replicas=count(f.replicas);out=`${kind}/${name} scaled`;}
    if(verb==='expose'){if(!['Deployment','Pod'].includes(kind))throw new Error('Bu lab Deployment veya Pod expose etmeyi destekler.');const selector=kind==='Deployment'?r.spec.selector.matchLabels:r.metadata.labels;const svc=service(f.name||name,copy(selector),Number(f.port||80),Number(f['target-port']||f.port||80),{type:f.type||'ClusterIP'});svc.metadata.namespace=ns;put(s,svc,{create:true});out=`service/${svc.metadata.name} exposed`;}
    if(verb==='label'||verb==='annotate'){const assignments=a.slice(a[0].includes('/')?1:2);if(!assignments.length)throw new Error('KEY=VALUE gerekli.');const field=verb==='label'?'labels':'annotations';r.metadata[field]||={};for(const pair of assignments){if(pair.endsWith('-'))delete r.metadata[field][pair.slice(0,-1)];else {const i=pair.indexOf('=');if(i<1)throw new Error('KEY=VALUE gerekli.');const key=pair.slice(0,i),value=pair.slice(i+1);if(r.metadata[field][key]!==undefined&&r.metadata[field][key]!==value&&!f.overwrite)throw new Error('Mevcut değeri değiştirmek için --overwrite gerekli.');r.metadata[field][key]=value;}}out=`${kind}/${name} ${verb} updated`;}
    if(verb==='patch'){if(kind==='PersistentVolumeClaim')throw new Error('PVC değiştirilemez alanları bu modelde patch edilmez. Boş ve henüz Bound olmamış örnek claim için dersteki yeniden oluşturma yolunu izle.');if(f.type&&f.type!=='merge')throw new Error('Bu simülatörde --type=merge desteklenir. JSON Patch / strategic merge taklit edilmez.');const patch=JSON.parse(String(f.p||f.patch||''));const updated=merge(r,patch);validate(s,updated);s.objects[s.objects.indexOf(r)]=updated;out=`${kind}/${name} patched`;}
  }
  else if(verb==='set'){
    const sub=a.shift(),{kind,name}=resourceArgs(a),r=ensure(s,kind,name,ns),spec=templateOf(r);if(!spec)throw new Error('Pod template bulunamadı.');event={...event,action:`set ${sub}`,kind,name};const pairs=a.slice(a[0].includes('/')?1:2);
    if(sub==='image'){for(const pair of pairs){const [cname,...parts]=pair.split('='),image=parts.join('=');if(!image)throw new Error('CONTAINER=IMAGE gerekli.');const targets=spec.containers.filter(c=>cname==='*'||c.name===cname);if(!targets.length)throw new Error(`Container adı bulunamadı: ${cname}`);targets.forEach(c=>c.image=image);}out=`${kind}/${name} image updated`;}
    else if(sub==='env'){
      const updates=[];
      if(f.from){
        const [type,resourceName]=String(f.from).split('/'),sourceKind=kindOf(type);
        if(!['ConfigMap','Secret'].includes(sourceKind))throw new Error('--from yalnız configmap/NAME veya secret/NAME kabul eder.');
        const source=ensure(s,sourceKind,resourceName,ns),ref=sourceKind==='Secret'?'secretKeyRef':'configMapKeyRef';
        for(const key of Object.keys(source.data||{}).sort())updates.push({name:key.replace(/[^a-zA-Z0-9_]/g,'_').toUpperCase(),valueFrom:{[ref]:{name:resourceName,key}}});
      }
      for(const pair of pairs){const [key,...rest]=pair.split('=');if(!key||!rest.length)throw new Error('KEY=VALUE gerekli.');updates.push({name:key,value:rest.join('=')});}
      if(!updates.length)throw new Error('En az bir ortam değişkeni gerekli.');
      for(const c of spec.containers){
        c.env||=[];
        for(const update of updates){c.env=c.env.filter(e=>e.name!==update.name);c.env.push(copy(update));}
      }
      out=`${kind}/${name} environment updated`;
    }
    else if(sub==='resources'){for(const c of spec.containers){c.resources||={};for(const field of ['requests','limits'])if(f[field])c.resources[field]=Object.fromEntries(String(f[field]).split(',').map(x=>{const i=x.indexOf('=');if(i<1)throw new Error('cpu=100m,memory=64Mi gibi kaynak çiftleri gerekli.');return [x.slice(0,i),x.slice(i+1)];}));}validate(s,r);out=`${kind}/${name} resources updated`;}
    else throw new Error('Desteklenmeyen set komutu.');
  }
  else if(verb==='rollout'){
    const sub=a.shift(),{kind,name}=resourceArgs(a),r=ensure(s,kind,name,ns);if(kind!=='Deployment')throw new Error('Bu lab rollout işlemini Deployment üzerinde modeller.');event={...event,action:`rollout ${sub}`,kind,name};
    if(sub==='history')out=(r._sim.history||[]).map(h=>`${h.revision}\t${h.template.spec.containers.map(c=>c.image).join(', ')}`).join('\n');
    else if(sub==='status'){const ready=objects(s,'Pod',ns).filter(p=>p._sim?.owner===`Deployment/${name}`&&p._sim.revision===r._sim.revision&&p.status.ready).length;if(ready<(r.spec.replicas||0))throw new Error(`Waiting for deployment "${name}" rollout: ${ready}/${r.spec.replicas} yeni Pod hazır. describe ile sorunu bul.`);out=`deployment "${name}" successfully rolled out`;}
    else if(sub==='restart'){r.spec.template.metadata.annotations={...r.spec.template.metadata.annotations,'kubectl.kubernetes.io/restartedAt':`sim-tick-${++s.serial}`};out=`deployment/${name} restarted`;}
    else if(sub==='undo'){const history=r._sim.history||[],target=f['to-revision']?history.find(h=>h.revision===Number(f['to-revision'])):history.at(-2);if(!target)throw new Error('Geri dönülecek revision yok.');r.spec.template=copy(target.template);out=`deployment/${name} rolled back`;}
    else throw new Error('Desteklenmeyen rollout işlemi.');
  }
  else if(verb==='logs'||verb==='exec'){
    const raw=a[0],p=raw?.startsWith('deployment/')?objects(s,'Pod',ns).find(p=>p._sim?.owner===raw):ensure(s,'Pod',String(raw||'').replace(/^pod\//,''),ns);if(!p)throw new Error('Pod bulunamadı.');event={...event,kind:'Pod',name:p.metadata.name,previous:!!f.previous};
    if(verb==='logs'){if(f.previous&&!p.status.restarts)throw new Error('Önceki container örneği bulunamadı.');out=p._sim.log||(['CrashLoopBackOff','CreateContainerConfigError'].includes(p.status.reason)?`ERROR: ${p._sim.message||'application exited with code 1'}`:p.status.reason==='ImagePullBackOff'?'Container henüz başlamadı; image çekilemedi.':'Server listening on port 80\nGET / 200\nrequest_id=lab-42 status=ok');}
    else{if(p.status.phase!=='Running'||['CrashLoopBackOff','CreateContainerConfigError','ImagePullBackOff'].includes(p.status.reason))throw new Error('exec için çalışan ve erişilebilir bir container gerekli.');event.command=tail.join(' ');if(tail[0]==='printenv')out=tail[1]?String(p._sim.envSnapshot?.[tail[1]]??''):Object.entries(p._sim.envSnapshot||{}).map(([k,v])=>`${k}=${v}`).join('\n')||'(custom environment empty)';else if(tail[0]==='hostname')out=p.metadata.name;else if(['wget','curl'].includes(tail[0])){const response=trafficResult(s,tail.find(w=>w.startsWith('http'))||tail.at(-1),ns,p.metadata.name);out=response.output;event.request=response.request;}else if(tail[0]==='nslookup'){const host=tail[1],r=ensure(s,'Service',host.split('.')[0],host.split('.')[1]||ns);out=`Server: 10.96.0.10\nName: ${host}\nAddress: ${r.spec.clusterIP}`;}else throw new Error('Desteklenen container komutları: printenv, hostname, nslookup, wget, curl. İnteraktif shell açılmaz.');}
  }
  else if(verb==='port-forward'){const {kind,name}=resourceArgs(a);let svc=kind==='Service'?ensure(s,kind,name,ns):objects(s,'Service',ns).find(x=>x.metadata.name===name);if(!svc)throw new Error('Bu örnekte Service üzerinden port-forward kullan.');const ports=a.at(-1);if(!/^\d+:\d+$/.test(ports))throw new Error('LOCAL:REMOTE port çifti gerekli.');s.forward={local:Number(ports.split(':')[0]),service:`${svc.metadata.name}:${ports.split(':')[1]}`,namespace:ns};event={...event,kind,name};out=`Forwarding from 127.0.0.1:${ports.split(':')[0]} -> ${ports.split(':')[1]} (simulated)\nGerçek port açılmadı. curl http://localhost:${ports.split(':')[0]} ile örnek isteği gör.`;}
  else if(verb==='autoscale'){const {kind,name}=resourceArgs(a);const r=ensure(s,kind,name,ns);if(kind!=='Deployment')throw new Error('Bu örnekte Deployment autoscale edilir.');const min=count(f.min||1),max=count(f.max),target=Number(f['cpu-percent']||80);if(max<min||min<1||target<=0)throw new Error('Geçersiz HPA sınırları.');const h=object('HorizontalPodAutoscaler',name,{scaleTargetRef:{apiVersion:'apps/v1',kind:'Deployment',name},minReplicas:min,maxReplicas:max,metrics:[{type:'Resource',resource:{name:'cpu',target:{type:'Utilization',averageUtilization:target}}}]});h.metadata.namespace=r.metadata.namespace;put(s,h,{create:true});event={...event,kind:'HorizontalPodAutoscaler',name};out=`horizontalpodautoscaler/${name} autoscaled`;}
  else if(verb==='auth'){if(a[0]!=='can-i')throw new Error('auth can-i kullan.');out=apiCan(s,a[1],a[2],f.as,ns)?'yes':'no';event={...event,action:'auth can-i',verb:a[1],resource:a[2],identity:f.as,answer:out};}
  else if(['cordon','uncordon','drain'].includes(verb)){
    const n=ensure(s,'Node',a[0]);event={...event,kind:'Node',name:a[0]};
    if(verb==='drain'){
      const onNode=objects(s,'Pod').filter(p=>p.spec.nodeName===a[0]);
      if(onNode.some(p=>!p._sim.owner)&&!f.force)throw new Error('Yönetilmeyen Pod var. Bu labda kontrollü workload ile drain dene.');
      if(onNode.some(p=>p._sim.owner?.startsWith('DaemonSet/'))&&!f['ignore-daemonsets'])throw new Error('DaemonSet Podları için --ignore-daemonsets gerekli.');
      const candidates=onNode.filter(p=>!p._sim.owner?.startsWith('DaemonSet/'));
      for(const pdb of objects(s,'PodDisruptionBudget')){
        const matchesBudget=p=>p.metadata.namespace===pdb.metadata.namespace&&matches(p.metadata.labels,pdb.spec.selector?.matchLabels||{});
        const affected=candidates.filter(p=>matchesBudget(p)&&!['Succeeded','Failed'].includes(p.status.phase));
        if(!affected.length)continue;
        const ready=objects(s,'Pod',pdb.metadata.namespace).filter(p=>matchesBudget(p)&&p.status.ready).length;
        const removedReady=affected.filter(p=>p.status.ready).length;
        if(ready-removedReady<Number(pdb.spec.minAvailable||0))throw new Error('Cannot evict pod: PodDisruptionBudget would be violated. Önce kapasiteyi ve minAvailable değerini incele.');
      }
      s.objects=s.objects.filter(p=>!candidates.includes(p));
    }
    n.spec.unschedulable=verb!=='uncordon';out=`node/${a[0]} ${verb==='drain'?'drained':verb==='cordon'?'cordoned':'uncordoned'}`;
  }
  else if(verb==='taint'){const {kind,name}=resourceArgs(a);if(kind!=='Node')throw new Error('Node gerekli.');const n=ensure(s,kind,name),text=a.at(-1);event={...event,kind,name};if(text.endsWith('-')){const key=text.slice(0,-1).split(':')[0];n.spec.taints=n.spec.taints.filter(t=>t.key!==key);}else{const m=text.match(/^([^=]+)=([^:]+):(NoSchedule|PreferNoSchedule)$/);if(!m)throw new Error('KEY=VALUE:NoSchedule biçimini kullan.');n.spec.taints=[...n.spec.taints.filter(t=>t.key!==m[1]),{key:m[1],value:m[2],effect:m[3]}];}out=`node/${name} tainted`;}
  else if(verb==='wait'){const {kind,name}=resourceArgs(a),r=ensure(s,kind,name,ns),condition=String(f.for||'').replace('condition=','').toLowerCase();const ok=condition==='ready'?r.status?.ready:condition==='available'?(r.status?.availableReplicas||0)>0:condition==='complete'?(r.status?.conditions||[]).some(c=>c.type==='Complete'&&c.status==='True'):false;if(!ok)throw new Error(`Timeout (simulated): ${kind}/${name} ${condition} koşulu henüz sağlanmıyor.`);event={...event,kind,name,condition};out=`${kind}/${name} condition met`;}
  else throw new Error(`kubectl ${verb}: bu simülatörde desteklenmiyor. help ile desteklenen komutları gör.`);
  if(!f['dry-run']||f['dry-run']==='none')reconcile(s);return {out,event};
}
/** Transactional: errors never partially mutate the caller's cluster. */
export function run(state,input) {
  const next=copy(state);next.trace=[];
  try{
    const invocation=parse(input),mode=invocation.flags['dry-run'];
    const {out,event}=execute(next,invocation);
    if(invocation.binary==='kubectl'&&['client','server'].includes(mode)&&event?.action!=='help'){
      const dryEvent={...event,action:'dry-run',operation:event.action,mode};
      return {state:{...state,trace:[{actor:'API / CLI',text:`Dry run (${mode}): küme durumu değiştirilmedi.`,tone:'normal'}]},output:event.output?out:`${out} (dry run: ${mode})`,error:false,event:dryEvent};
    }
    if(event)next.events.push(event);next.events=next.events.slice(-250);if(!next.trace.length)pushTrace(next,'Terminal',event?.action==='help'?'Komut referansı açıldı.':'İşlem tamamlandı; kaynak durumu korundu.');return {state:next,output:out,error:false,event};
  }
  catch(error){return {state:{...state,trace:[{actor:'API / CLI',text:error.message,tone:'error'}]},output:error.message,error:true};}
}
export function goalMet(s,g){
  if(g.type==='event')return s.events.filter(e=>subset(e,g.match)).length >= (g.times||1);
  if(g.type==='resource'){const r=find(s,g.kind,g.name,g.namespace||'default');return !!r&&subset(r,g.match||{});}
  if(g.type==='absent')return !find(s,g.kind,g.name,g.namespace||'default');
  if(g.type==='count')return objects(s,g.kind,g.namespace||'default').filter(r=>subset(r,g.match||{})).length===g.count;
  if(g.type==='state')return subset(s,g.match);
  if(g.type==='dockerImage')return s.docker.images.includes(g.image);
  if(g.type==='dockerContainer')return s.docker.containers.some(c=>subset(c,g.match));
  if(g.type==='dockerAbsent')return !s.docker.containers.some(c=>c.name===g.name);
  if(g.type==='all')return g.goals.every(x=>goalMet(s,x));
  return false;
}
export const suggestionWords=[...dockerSuggestions,'kubectl get pods','kubectl get nodes','kubectl get deployments','kubectl get services','kubectl get events','kubectl get pods -o wide','kubectl describe pod','kubectl apply -f','kubectl scale deployment/web --replicas=3','kubectl rollout status deployment/web','kubectl logs','lab tick','lab load 90','help','ls','cat','clear','history'];
