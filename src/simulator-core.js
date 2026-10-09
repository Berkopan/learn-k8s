import {generalHelp} from './command-help.js';
import {copy, object, pod, deployment, service, job, cron, meta, isCluster, subset, merge, yaml, refKey, pathGet} from './model.js';

const aliases = {po:'Pod',pod:'Pod',pods:'Pod',deploy:'Deployment',deployment:'Deployment',deployments:'Deployment',rs:'ReplicaSet',replicaset:'ReplicaSet',replicasets:'ReplicaSet',svc:'Service',service:'Service',services:'Service',ns:'Namespace',namespace:'Namespace',namespaces:'Namespace',node:'Node',nodes:'Node',no:'Node',cm:'ConfigMap',configmap:'ConfigMap',configmaps:'ConfigMap',secret:'Secret',secrets:'Secret',sa:'ServiceAccount',serviceaccount:'ServiceAccount',serviceaccounts:'ServiceAccount',pvc:'PersistentVolumeClaim',persistentvolumeclaim:'PersistentVolumeClaim',persistentvolumeclaims:'PersistentVolumeClaim',pv:'PersistentVolume',persistentvolumes:'PersistentVolume',sc:'StorageClass',storageclass:'StorageClass',storageclasses:'StorageClass',sts:'StatefulSet',statefulset:'StatefulSet',statefulsets:'StatefulSet',ds:'DaemonSet',daemonset:'DaemonSet',daemonsets:'DaemonSet',job:'Job',jobs:'Job',cj:'CronJob',cronjob:'CronJob',cronjobs:'CronJob',hpa:'HorizontalPodAutoscaler',horizontalpodautoscaler:'HorizontalPodAutoscaler',role:'Role',roles:'Role',rolebinding:'RoleBinding',rolebindings:'RoleBinding',netpol:'NetworkPolicy',networkpolicy:'NetworkPolicy',networkpolicies:'NetworkPolicy',ing:'Ingress',ingress:'Ingress',ingresses:'Ingress',pdb:'PodDisruptionBudget',poddisruptionbudget:'PodDisruptionBudget',poddisruptionbudgets:'PodDisruptionBudget',quota:'ResourceQuota',resourcequota:'ResourceQuota',resourcequotas:'ResourceQuota',limitrange:'LimitRange',limitranges:'LimitRange',limits:'LimitRange',endpointslice:'EndpointSlice',endpointslices:'EndpointSlice',events:'Event',event:'Event'};
export const kindOf = text => aliases[String(text).toLowerCase()] || text;
const booleanFlags = new Set(['a','A','all-namespaces','all','show-labels','overwrite','w','watch','d','it','i','t','ignore-daemonsets','delete-emptydir-data','force','list','previous','help']);
const knownFlags = new Set([...booleanFlags,'n','namespace','o','output','l','selector','f','filename','image','replicas','port','target-port','type','name','from-literal','from','from-file','env','requests','limits','cpu-percent','min','max','schedule','restart','as','verb','resource','role','serviceaccount','class','rule','p','patch','timeout','for','container','c','tail','sort-by','field-selector','dry-run','context','k','set','to-revision','command','record','overrides','v','tolerations']);
/** Shell-like tokenization without a shell. Quotes are handled; no eval/exec/network access. */
export function tokenize(input) {
  if (input.length>8000) throw new Error('Komut çok uzun (en fazla 8000 karakter).');
  let words=[], word='', quote='', escape=false, started=false;
  for (const ch of input.trim()) {
    if (escape) {word+=ch;escape=false;started=true;continue;}
    if (ch==='\\' && quote!=="'") {escape=true;continue;}
    if (quote) {if(ch===quote) quote=''; else word+=ch;started=true;continue;}
    if(ch==='"'||ch==="'"){quote=ch;started=true;continue;}
    if(/\s/.test(ch)){if(started){words.push(word);word='';started=false;}continue;}
    if(['|',';','>','<','&','`'].includes(ch)) throw new Error('Bu terminal shell çalıştırmaz. Pipe, yönlendirme ve komut zinciri desteklenmiyor; komutları tek tek gir.');
    word+=ch;started=true;
  }
  if(quote) throw new Error('Kapatılmamış tırnak.');
  if(escape) word+='\\';
  if(started) words.push(word);
  return words;
}
export function parse(input) {
  const words=tokenize(input), binary=words.shift(), args=[],flags={}, tail=[]; let after=false;
  for(let i=0;i<words.length;i++){
    const w=words[i];if(w==='--'){after=true;continue;}if(after){tail.push(w);continue;}
    if(w.startsWith('-')&&w!=='-'){
      const [key,...rest]=w.replace(/^--?/,'').split('=');
      if(!knownFlags.has(key))throw new Error(`Desteklenmeyen seçenek: ${w}. help komutuyla desteklenen sözdizimini gör.`);
      let value=rest.length?rest.join('='):booleanFlags.has(key)?true:words[++i];
      if(value===undefined)throw new Error(`--${key} için bir değer gerekli.`);
      if(booleanFlags.has(key)&&rest.length){
        if(!['true','false'].includes(value))throw new Error(`--${key} yalnız true veya false kabul eder.`);
        value=value==='true';
      }
      if(key==='from-literal')flags[key]=[...(flags[key]||[]),value];else flags[key]=value;
    }else args.push(w);
  }
  return {binary,args,flags,tail};
}
// A flag being recognized by the tokenizer does not make it meaningful for every
// command. Reject unsupported combinations before any simulated mutation occurs.
export function validateInvocation({binary,args,flags,tail}) {
  if(binary==='docker')return; // Docker has its own command and arity contract.
  let permitted=[],command=binary;
  if(binary==='kubectl'){
    const [verb,sub]=args;
    command=`kubectl ${verb||''}`.trim();
    const common=['n','namespace','as'];
    const reads=['A','all-namespaces','l','selector','field-selector'];
    const output=['o','output'];
    const dryRun=['dry-run',...output];
    const byVerb={
      get:[...reads,...output,'show-labels'],describe:reads,top:['A','all-namespaces','l','selector'],
      run:['image','env',...dryRun],apply:['f','filename',...dryRun],diff:['f','filename'],
      delete:['f','filename','all',...dryRun],scale:['replicas'],
      expose:['name','port','target-port','type'],label:['overwrite'],annotate:['overwrite'],patch:['type','p','patch'],
      logs:['previous'],exec:[], 'port-forward':[],autoscale:['min','max','cpu-percent'],auth:[],
      cordon:[],uncordon:[],drain:['ignore-daemonsets','force'],taint:[],wait:['for','timeout'],
      version:[],'cluster-info':[],'api-resources':[],explain:[]
    };
    if(verb==='create'){
      const byKind={Deployment:['image','replicas'],ConfigMap:['from-literal'],Secret:['from-literal'],
        Namespace:[],ServiceAccount:[],Role:['verb','resource'],RoleBinding:['role','serviceaccount'],
        Job:['image','from'],CronJob:['image','schedule'],Ingress:['class','rule']};
      permitted=[...common,...dryRun,...(byKind[kindOf(sub)]||[])];
      command+=` ${sub||''}`;
    }else if(verb==='set'){
      permitted=[...common,...({image:[],env:['from'],resources:['requests','limits']}[sub]||[])];
      command+=` ${sub||''}`;
    }else if(verb==='rollout'){
      permitted=[...common,...(sub==='undo'?['to-revision']:[])];
      command+=` ${sub||''}`;
    }else if(verb==='config'){
      permitted=sub==='set-context'?['current','namespace']:[];
      command+=` ${sub||''}`;
    }else permitted=[...common,...(byVerb[verb]||[])];
    if(tail.length&&verb!=='exec'&&!(verb==='create'&&kindOf(sub)==='Job'))throw new Error('Bu komut container komut kuyruğu kabul etmez.');
    if(flags['dry-run']!==undefined&&!['none','client','server'].includes(flags['dry-run']))throw new Error('--dry-run için none, client veya server kullan.');
    const format=flags.o??flags.output;
    const formats=verb==='get'?['yaml','json','wide']:['yaml','json'];
    if(format!==undefined&&!formats.includes(format))throw new Error(`Çıktı biçimi desteklenmiyor: ${format}. Desteklenenler: ${formats.join(', ')}.`);
  }else if(binary==='helm'){
    command=`helm ${args[0]||''}`.trim();
    permitted=['install','upgrade'].includes(args[0])?['n','namespace','set']:['n','namespace'];
    if(tail.length)throw new Error('Bu komut container komut kuyruğu kabul etmez.');
  }else if(tail.length)throw new Error('Bu komut container komut kuyruğu kabul etmez.');
  for(const flag of Object.keys(flags))if(!permitted.includes(flag))throw new Error(`${command}: --${flag} bu komut için desteklenmiyor. help ile desteklenen sözdizimini gör.`);
}
export const objects = (s,kind,ns) => s.objects.filter(o=>(!kind||o.kind===kind)&&(!ns||isCluster(o.kind)||o.metadata.namespace===ns));
export const find = (s,kind,name,ns=s.namespace) => objects(s,kind,ns).find(o=>o.metadata.name===name);
const ensure = (s,kind,name,ns=s.namespace) => {const r=find(s,kind,name,ns);if(!r)throw new Error(`Error from server (NotFound): ${kind} "${name}" bulunamadı (namespace: ${ns}).`);return r;};
const count = (value,label='replicas') => {const n=Number(value);if(!Number.isInteger(n)||n<0||n>12)throw new Error(`${label}: bu görsel laboratuvarda 0–12 arasında bir tamsayı kullan. Bu bir Kubernetes sınırı değildir.`);return n;};
export const quantity = (v, cpu=false) => {
  if(v===undefined)return 0;const t=String(v);
  if(cpu){if(!/^(?:\d+(?:\.\d+)?|\.\d+)m?$/.test(t))return NaN;return t.endsWith('m')?parseFloat(t):Number(t)*1000;}
  const m=t.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);if(!m)return NaN;
  return Number(m[1])*({Ki:1024,Mi:1024**2,Gi:1024**3,Ti:1024**4,K:1000,M:1000**2,G:1000**3,T:1000**4}[m[2]]||1)/(1024**2);
};
export const matches = (labels={},selector={}) => Object.entries(selector).every(([k,v])=>labels[k]===v);
function labelSelector(labels, text) {return !text||String(text).split(',').every(pair=>{if(pair.includes('!=')){const [k,v]=pair.split('!=');return labels?.[k]!==v;}if(pair.includes('=')){const [k,v]=pair.split('=');return labels?.[k]===v;}return Object.hasOwn(labels||{},pair);});}
const pushTrace=(s,actor,text,tone='normal')=>s.trace.push({actor,text,tone});
const clean = o => {const r=copy(o);delete r._sim;return r;};
const decode = str => new TextDecoder().decode(Uint8Array.from(atob(str),c=>c.charCodeAt(0)));
const encode = str => btoa(Array.from(new TextEncoder().encode(str),b=>String.fromCharCode(b)).join(''));
function validate(s,r) {
  if(!r||typeof r!=='object'||!r.apiVersion||!r.kind||!r.metadata?.name)throw new Error('Manifest apiVersion, kind ve metadata.name içermeli.');
  if(!Object.values(aliases).includes(r.kind)&&r.kind!=='Namespace')throw new Error(`Bu simülatör ${r.kind} türünü henüz modellemiyor.`);
  if(!/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(r.metadata.name))throw new Error('Geçersiz kaynak adı. Küçük harf, sayı ve tire kullan.');
  if(!isCluster(r.kind)&&!find(s,'Namespace',r.metadata.namespace||s.namespace))throw new Error(`Namespace bulunamadı: ${r.metadata.namespace||s.namespace}`);
  if(['Deployment','StatefulSet','ReplicaSet'].includes(r.kind)){count(r.spec?.replicas??1);if(!r.spec?.selector?.matchLabels||!r.spec?.template?.spec?.containers?.length)throw new Error('Workload selector.matchLabels ve template.spec.containers gerektirir.');if(!matches(r.spec.template.metadata?.labels,r.spec.selector.matchLabels))throw new Error('selector, Pod template etiketleriyle eşleşmiyor.');}
  const cs=r.spec?.containers||r.spec?.template?.spec?.containers||[];
  if(r.kind==='Pod'&&!cs.length)throw new Error('Pod en az bir container gerektirir.');
  for(const c of cs){if(!c.name||!c.image)throw new Error('Container name ve image gerektirir.');for(const key of ['cpu','memory']){const a=quantity(c.resources?.requests?.[key],key==='cpu'),b=quantity(c.resources?.limits?.[key],key==='cpu');if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0)throw new Error('Geçersiz kaynak miktarı.');if(b&&a>b)throw new Error(`${key} request, limit değerini aşamaz.`);}}
  if(r.kind==='HorizontalPodAutoscaler'&&(!Number.isInteger(r.spec?.minReplicas)||!Number.isInteger(r.spec?.maxReplicas)||r.spec.minReplicas<1||r.spec.maxReplicas>12||r.spec.maxReplicas<r.spec.minReplicas))throw new Error('HPA min/max: 1–12 sınırlarında geçerli tamsayılar gerekli.');
  if(r.kind==='ResourceQuota'&&Object.keys(r.spec?.hard||{}).some(k=>k!=='pods'))throw new Error('Bu simülatör ResourceQuota içinde yalnız pods sınırını modeller.');
  if(r.kind==='Service'&&(!r.spec?.ports?.length||r.spec.ports.some(p=>!Number.isInteger(Number(p.port))||p.port<1||p.port>65535)))throw new Error('Service için 1–65535 arasında port gerekli.');
}
function put(s,source,{create=false}={}) {
  const r=copy(source);r.metadata={...r.metadata};
  if(isCluster(r.kind))delete r.metadata.namespace;else r.metadata.namespace ||= s.namespace;
  validate(s,r);const existing=s.objects.find(o=>refKey(o)===refKey(r));
  if(!existing&&r.kind==='Pod'){const quotas=objects(s,'ResourceQuota',r.metadata.namespace);for(const q of quotas){const hard=q.spec?.hard?.pods;if(hard!==undefined&&objects(s,'Pod',r.metadata.namespace).filter(p=>!['Succeeded','Failed'].includes(p.status?.phase)).length>=Number(hard))throw new Error(`Forbidden: exceeded quota ${q.metadata.name}, pods=${hard}.`);}}
  if(create&&existing)throw new Error(`Error from server (AlreadyExists): ${r.kind} "${r.metadata.name}" zaten var.`);
  if(r.kind==='Secret'&&r.stringData){r.data={...r.data,...Object.fromEntries(Object.entries(r.stringData).map(([k,v])=>[k,encode(String(v))]))};delete r.stringData;}
  if(existing){r._sim=existing._sim;s.objects[s.objects.indexOf(existing)]=r;}else {r._sim={...r._sim,id:++s.serial};s.objects.push(r);}
  pushTrace(s,'API server',`${r.kind}/${r.metadata.name} ${existing?'güncellendi':'kaydedildi'}.`);
  return r;
}
function environment(s,p){const out={};for(const c of p.spec.containers||[]){for(const ref of c.envFrom||[]){const k=ref.configMapRef?'ConfigMap':'Secret',r=find(s,k,ref.configMapRef?.name||ref.secretRef?.name,p.metadata.namespace);if(!r)return null;Object.assign(out,k==='Secret'?Object.fromEntries(Object.entries(r.data||{}).map(([key,value])=>[key,decode(value)])):r.data||{});}for(const item of c.env||[])out[item.name]=item.value??(item.valueFrom?.fieldRef?.fieldPath==='metadata.name'?p.metadata.name:'[valueFrom]');}return out;}
function podStatus(s,p) {
  p._sim ||= {};
  const containers=p.spec.containers||[];
  const requests=containers.reduce((a,c)=>({cpu:a.cpu+quantity(c.resources?.requests?.cpu,true),memory:a.memory+quantity(c.resources?.requests?.memory)}),{cpu:0,memory:0});
  let reason='Running',ready=true;
  if(!p.spec.nodeName){const nodes=objects(s,'Node').filter(n=>!n.spec.unschedulable&&matches(n.metadata.labels,p.spec.nodeSelector||{})&&(n.spec.taints||[]).every(t=>t.effect==='PreferNoSchedule'||(p.spec.tolerations||[]).some(x=>x.key===t.key&&(x.operator==='Exists'||x.value===t.value)&&(!x.effect||x.effect===t.effect))));
    nodes.sort((a,b)=>objects(s,'Pod').filter(q=>q.spec.nodeName===a.metadata.name&&q.status?.phase!=='Succeeded').length-objects(s,'Pod').filter(q=>q.spec.nodeName===b.metadata.name&&q.status?.phase!=='Succeeded').length);
    const target=nodes.find(n=>{const used=objects(s,'Pod').filter(q=>q!==p&&q.spec.nodeName===n.metadata.name&&q.status?.phase!=='Succeeded').reduce((a,q)=>{for(const c of q.spec.containers||[]){a.cpu+=quantity(c.resources?.requests?.cpu,true);a.memory+=quantity(c.resources?.requests?.memory);}return a;},{cpu:0,memory:0});return used.cpu+requests.cpu<=2000&&used.memory+requests.memory<=2048;});
    if(target){p.spec.nodeName=target.metadata.name;pushTrace(s,'Scheduler',`${p.metadata.name} → ${target.metadata.name}`);}else{reason='Pending';ready=false;p._sim.message='FailedScheduling: uygun node yok; request, nodeSelector, taint ve cordon durumunu kontrol et.';}
  }
  if(reason==='Running'){
    if(containers.some(c=>/missing|nonexistent|bad-tag/.test(c.image))){reason='ImagePullBackOff';ready=false;p._sim.message='Failed to pull image: etiketi veya registry erişimini kontrol et.';}
    else if(environment(s,p)===null){reason='CreateContainerConfigError';ready=false;p._sim.message='Bulunamayan ConfigMap veya Secret referansı.';}
    else if((p.spec.volumes||[]).some(v=>v.persistentVolumeClaim&&find(s,'PersistentVolumeClaim',v.persistentVolumeClaim.claimName,p.metadata.namespace)?.status?.phase!=='Bound')){reason='Pending';ready=false;p._sim.message='PersistentVolumeClaim henüz Bound değil.';}
    else if(p.spec.initContainers?.length&&!p._sim.initDone){reason=`Init:0/${p.spec.initContainers.length}`;ready=false;p._sim.message='Init container çalışıyor. lab tick ile bir simülasyon adımı ilerlet.';}
    else if(p._sim.failure){reason=p._sim.failure;ready=false;}
    else if(containers.some(c=>c.livenessProbe?.httpGet?.path==='/broken')){reason='CrashLoopBackOff';ready=false;p._sim.restarts=Math.max(p._sim.restarts||0,1+s.ticks);p._sim.message='Liveness HTTP /broken yanıtı 404; kubelet container yeniden başlatıyor.';}
    else if(containers.some(c=>c.readinessProbe?.httpGet?.path==='/broken')){ready=false;p._sim.message='Readiness başarısız: Running, fakat Service endpoint listesinde değil.';}
    else if(p._sim.complete){reason='Succeeded';ready=false;}
    else{p._sim.message='Container çalışıyor; readiness koşulu başarılı.';}
  }
  if(!p._sim.envSnapshot&&environment(s,p)!==null)p._sim.envSnapshot=environment(s,p);
  p.status={phase:['ImagePullBackOff','CreateContainerConfigError','CrashLoopBackOff'].includes(reason)?'Running':reason.startsWith('Init:')?'Pending':reason,reason,ready,restarts:p._sim.restarts||0,podIP:p.spec.nodeName?`10.244.${p.spec.nodeName.endsWith('2')?2:1}.${(p._sim.id||1)%240+10}`:'<none>'};
}
function reconcile(s) {
  // Claims bind only when the selected class exists; the training cluster has a mock CSI provisioner.
  for(const pvc of objects(s,'PersistentVolumeClaim')){
    if(find(s,'StorageClass',pvc.spec.storageClassName)){pvc.status={phase:'Bound'};pvc.spec.volumeName||=`pv-${pvc.metadata.name}-${pvc._sim?.id||0}`;if(!find(s,'PersistentVolume',pvc.spec.volumeName)){put(s,object('PersistentVolume',pvc.spec.volumeName,{capacity:{storage:pvc.spec.resources.requests.storage},accessModes:pvc.spec.accessModes,storageClassName:pvc.spec.storageClassName,persistentVolumeReclaimPolicy:'Retain',claimRef:{name:pvc.metadata.name,namespace:pvc.metadata.namespace},csi:{driver:'learn-k8s.local',volumeHandle:pvc.spec.volumeName}},{status:{phase:'Bound'}}));pushTrace(s,'CSI provisioner',`${pvc.metadata.name} → ${pvc.spec.volumeName}`);}}else pvc.status={phase:'Pending'};
  }
  const controllers=s.objects.filter(r=>['Deployment','StatefulSet','DaemonSet','Job'].includes(r.kind));
  for(const d of controllers){d._sim||={};const ns=d.metadata.namespace, name=d.metadata.name;let n=d.kind==='DaemonSet'?objects(s,'Node').length:d.kind==='Job'?(d._sim.complete?0:Number(d.spec.parallelism||1)):Number(d.spec.replicas??1);n=Math.min(n,12);
    const fingerprint=JSON.stringify(d.spec.template);if(d._sim.fingerprint!==fingerprint){d._sim.revision=(d._sim.revision||0)+1;d._sim.fingerprint=fingerprint;d._sim.history||=[];d._sim.history.push({revision:d._sim.revision,template:copy(d.spec.template)});pushTrace(s,'Controller',`${d.kind}/${name}: revision ${d._sim.revision}`);}
    if(d.kind==='Deployment'){
      for(const rs of objects(s,'ReplicaSet',ns).filter(r=>r._sim?.owner===name))rs.spec.replicas=0;
      const rsName=`${name}-r${d._sim.revision}`;let rs=find(s,'ReplicaSet',rsName,ns);if(!rs){rs=object('ReplicaSet',rsName,{replicas:n,selector:d.spec.selector,template:copy(d.spec.template)},{metadata:meta(rsName,ns,{app:name}),_sim:{owner:name}});s.objects.push(rs);}rs.spec.replicas=n;
    }
    const controlled=()=>objects(s,'Pod',ns).filter(p=>p._sim?.owner===`${d.kind}/${name}`);
    let current=controlled().filter(p=>p._sim.revision===d._sim.revision);
    while(current.filter(p=>p.status?.phase!=='Succeeded').length<n){
      const quota=objects(s,'ResourceQuota',ns).find(q=>q.spec?.hard?.pods!==undefined&&objects(s,'Pod',ns).filter(p=>!['Succeeded','Failed'].includes(p.status?.phase)).length>=Number(q.spec.hard.pods));if(quota){d._sim.message=`FailedCreate: exceeded quota ${quota.metadata.name}`;pushTrace(s,'Controller',d._sim.message,'error');break;}
      const id=++s.serial;const index=d.kind==='StatefulSet'?Array.from({length:12},(_,i)=>i).find(i=>!current.some(p=>p.metadata.name===`${name}-${i}`)):current.length;
      const podName=d.kind==='StatefulSet'?`${name}-${index}`:d.kind==='DaemonSet'?`${name}-worker-${index+1}`:`${name}-r${d._sim.revision}-${id}`;
      const existing=find(s,'Pod',podName,ns);if(existing)s.objects.splice(s.objects.indexOf(existing),1);
      const p=object('Pod',podName,copy(d.spec.template.spec),{metadata:meta(podName,ns,copy(d.spec.template.metadata?.labels||{app:name})),_sim:{id,owner:`${d.kind}/${name}`,revision:d._sim.revision}});
      if(d.kind==='DaemonSet')p.spec.nodeName=objects(s,'Node')[index]?.metadata.name;
      s.objects.push(p);current.push(p);pushTrace(s,'Controller',`${podName} oluşturuldu.`, 'add');
    }
    while(current.length>n && d.kind!=='Job'){const p=current.pop();s.objects.splice(s.objects.indexOf(p),1);pushTrace(s,'Controller',`${p.metadata.name} kaldırıldı.`, 'remove');}
    current.forEach(p=>podStatus(s,p));const ready=current.filter(p=>p.status.ready).length;
    if(ready>=n||d.kind!=='Deployment')for(const old of controlled().filter(p=>p._sim.revision!==d._sim.revision))s.objects.splice(s.objects.indexOf(old),1);
    if(d.kind==='Deployment')for(const rs of objects(s,'ReplicaSet',ns).filter(r=>r._sim?.owner===name)){rs.status={replicas:controlled().filter(p=>p._sim.revision===Number(rs.metadata.name.split('-r').pop())).length};if(rs.metadata.name!==`${name}-r${d._sim.revision}`)rs.spec.replicas=rs.status.replicas;}
    d.status=d.kind==='Job'?{active:d._sim.complete?0:n,succeeded:d._sim.complete?Number(d.spec.completions||1):0,conditions:d._sim.complete?[{type:'Complete',status:'True'}]:[]}:{replicas:controlled().length,readyReplicas:controlled().filter(p=>p.status?.ready).length,updatedReplicas:current.length,availableReplicas:controlled().filter(p=>p.status?.ready).length};
  }
  objects(s,'Pod').forEach(p=>podStatus(s,p));
  s.objects=s.objects.filter(r=>r.kind!=='EndpointSlice');
  for(const svc of objects(s,'Service')){
    svc.spec.clusterIP||=`10.96.0.${(svc._sim?.id||1)%240+10}`;
    const endpoints=objects(s,'Pod',svc.metadata.namespace).filter(p=>matches(p.metadata.labels,svc.spec.selector||{})&&p.status.ready);
    if(!svc.spec.selector)continue;
    s.objects.push(object('EndpointSlice',`${svc.metadata.name}-endpoints`,undefined,{apiVersion:'discovery.k8s.io/v1',metadata:meta(`${svc.metadata.name}-endpoints`,svc.metadata.namespace,{'kubernetes.io/service-name':svc.metadata.name}),addressType:'IPv4',ports:svc.spec.ports.map(p=>({port:p.targetPort||p.port,protocol:'TCP'})),endpoints:endpoints.map(p=>({addresses:[p.status.podIP],conditions:{ready:true},targetRef:{kind:'Pod',name:p.metadata.name}}))}));
  }
}
export function createLab(level={}) {
  const s={namespace:'default',context:'learning',serial:10,ticks:0,load:35,metrics:true,objects:[],files:copy(level.files||{}),events:[],trace:[],docker:{images:[],containers:[]},releases:[],forward:null};
  for(const name of ['default','kube-system','staging'])s.objects.push(object('Namespace',name,{}, {metadata:{name,labels:{'kubernetes.io/metadata.name':name}}}));
  for(const [index,name] of ['worker-1','worker-2'].entries())s.objects.push(object('Node',name,{unschedulable:false,taints:[]},{metadata:{name,labels:{'kubernetes.io/hostname':name,zone:index?'west':'east'}},status:{conditions:[{type:'Ready',status:'True'}],capacity:{cpu:'2',memory:'2Gi'}}}));
  s.objects.push(object('StorageClass','standard',undefined,{metadata:{name:'standard'},provisioner:'learn-k8s.local',volumeBindingMode:'Immediate',reclaimPolicy:'Retain'}));
  for(const r of level.seed||[])put(s,r);
  Object.assign(s,copy(level.state||{}));
  reconcile(s);s.events=[];s.trace=[];return s;
}
function resourceArgs(args) {const [raw,name]=args;const [type,inline]=String(raw||'').split('/');return {kind:kindOf(type),name:inline||name};}
function listRows(items,wide=false) {if(!items.length)return 'No resources found.';const rows=[['KIND','NAME','NAMESPACE','STATUS',...(wide?['NODE / DETAIL']:[])],...items.map(r=>[r.kind,r.metadata.name,r.metadata.namespace||'—',r.status?.reason||(r.kind==='Deployment'||r.kind==='StatefulSet'?`${r.status?.readyReplicas||0}/${r.spec.replicas??1} Ready`:r.status?.phase||(r.kind==='Job'?`${r.status?.succeeded||0} Complete`:r.kind==='Service'?r.spec.type||'ClusterIP':r.kind==='Node'?(r.spec.unschedulable?'Ready,SchedulingDisabled':'Ready'):'Active')),...(wide?[r.spec?.nodeName||r.spec?.clusterIP||r.spec?.storageClassName||'—']:[])])];const widths=rows[0].map((_,i)=>Math.min(50,Math.max(...rows.map(r=>String(r[i]).length))+3));return rows.map(row=>row.map((x,i)=>String(x).padEnd(widths[i])).join('')).join('\n');}
function templateOf(r){return r.kind==='Pod'?r.spec:r.spec?.template?.spec;}
function apiCan(s,verb,resource,identity,ns){if(!identity)return true;const parts=String(identity).split(':');if(parts.length!==4||parts[0]!=='system'||parts[1]!=='serviceaccount')return false;const account=parts[3],accountNs=parts[2];return objects(s,'RoleBinding',ns).some(b=>(b.subjects||[]).some(x=>x.kind==='ServiceAccount'&&x.name===account&&(x.namespace||ns)===accountNs)&&(find(s,'Role',b.roleRef?.name,ns)?.rules||[]).some(r=>(r.verbs.includes(verb)||r.verbs.includes('*'))&&(r.resources.includes(resource)||r.resources.includes('*'))));}
function traffic(s,host,ns,sourceName) {
  const hostname=host.replace(/^https?:\/\//,'').split('/')[0], [address,portText]=hostname.split(':'),parts=address.split('.');const serviceName=parts[0],targetNs=parts[1]||ns,svc=ensure(s,'Service',serviceName,targetNs),port=Number(portText||80);
  if(!svc.spec.ports.some(p=>Number(p.port)===port))throw new Error(`Connection refused: Service ${serviceName}, ${port} portunu sunmuyor.`);
  if(!svc.spec.selector)throw new Error('Selector bulunmayan Service için bu model otomatik endpoint üretmez.');
  const targets=objects(s,'Pod',targetNs).filter(p=>p.status.ready&&matches(p.metadata.labels,svc.spec.selector||{}));
  if(!targets.length)throw new Error('503 Service Unavailable: hazır endpoint yok. Selector ve readiness durumunu kontrol et.');
  const mapping=svc.spec.ports.find(p=>Number(p.port)===port),targetPort=mapping.targetPort||mapping.port;
  if(!targets[0].spec.containers.some(c=>(c.ports||[{containerPort:80}]).some(p=>Number(p.containerPort)===Number(targetPort)||p.name===targetPort)))throw new Error('Connection refused: targetPort, örnek container uygulamasının dinlediği portla eşleşmiyor.');
  const source=sourceName?ensure(s,'Pod',sourceName,ns):null;
  if(source&&!source.status.ready)throw new Error('Kaynak Pod çalışır durumda değil.');
  const policies=objects(s,'NetworkPolicy',targetNs).filter(p=>matches(targets[0].metadata.labels,p.spec.podSelector?.matchLabels||{})&&(p.spec.policyTypes||['Ingress']).includes('Ingress'));
  if(policies.length&&!policies.some(p=>(p.spec.ingress||[]).some(rule=>(!rule.ports||rule.ports.some(x=>Number(x.port)===Number(svc.spec.ports.find(p=>Number(p.port)===port).targetPort||port)))&&(!rule.from||rule.from.some(x=>(!x.podSelector||source&&matches(source.metadata.labels,x.podSelector.matchLabels||{}))&&(!x.namespaceSelector||matches(find(s,'Namespace',ns)?.metadata.labels,x.namespaceSelector.matchLabels||{}))&&(x.namespaceSelector||ns===targetNs))))))throw new Error('Connection timed out: NetworkPolicy trafiği engelliyor.');
  pushTrace(s,'Service',`${serviceName}:${port} → ${targets[0].metadata.name}`,'traffic');return `HTTP/1.1 200 OK\nService: ${serviceName}.${targetNs}\nPod: ${targets[0].metadata.name}\nHello from the simulated cluster!`;
}
const help=generalHelp();
knownFlags.add('current');booleanFlags.add('current');
for(const flag of ['watch','w','from-file','sort-by','context','k','command','record','overrides','v','tolerations','container','c','tail','i','t','it','delete-emptydir-data','list'])knownFlags.delete(flag);

export { aliases, ensure, count, labelSelector, pushTrace, clean, validate, put, reconcile, resourceArgs, listRows, templateOf, apiCan, traffic, help };
