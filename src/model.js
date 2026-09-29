/** Pure data helpers. Manifests are ordinary Kubernetes objects, not command fixtures. */
export const copy = value => structuredClone(value);
export const meta = (name, namespace = 'default', labels = {}) => ({name, namespace, labels});
export const object = (kind, name, spec = {}, extra = {}) => ({apiVersion: ['Deployment','StatefulSet','DaemonSet','ReplicaSet'].includes(kind) ? 'apps/v1' : ['Job','CronJob'].includes(kind) ? 'batch/v1' : ['Role','RoleBinding'].includes(kind) ? 'rbac.authorization.k8s.io/v1' : kind === 'NetworkPolicy' || kind === 'Ingress' ? 'networking.k8s.io/v1' : kind === 'PodDisruptionBudget' ? 'policy/v1' : kind === 'HorizontalPodAutoscaler' ? 'autoscaling/v2' : kind === 'StorageClass' ? 'storage.k8s.io/v1' : 'v1', kind, metadata: meta(name), spec, ...extra});
export const container = (image = 'nginx:1.27', extra = {}) => ({name:'web', image, ports:[{containerPort:80}], ...extra});
export const pod = (name='web', extra={}, labels={app:name}) => object('Pod',name,{containers:[container()],...extra},{metadata:meta(name,'default',labels)});
export const deployment = (name='web', replicas=1, image='nginx:1.27', extra={}) => object('Deployment',name,{replicas,selector:{matchLabels:{app:name}},template:{metadata:{labels:{app:name}},spec:{containers:[container(image)],...extra}}});
export const service = (name='web', selector={app:name}, port=80, targetPort=80, extra={}) => object('Service',name,{type:'ClusterIP',selector,ports:[{port,targetPort}],...extra});
export const config = (name='settings', data={MODE:'production'}) => object('ConfigMap',name,undefined,{data});
export const secret = (name='credentials', stringData={PASSWORD:'demo-only'}) => object('Secret',name,undefined,{type:'Opaque',stringData});
export const job = (name='report',extra={}) => object('Job',name,{backoffLimit:3,template:{metadata:{labels:{app:name}},spec:{restartPolicy:'Never',containers:[{name:'worker',image:'busybox:1.37',command:['sh','-c','echo report-ready']}]}},...extra});
export const cron = (name='backup') => object('CronJob',name,{schedule:'*/5 * * * *',concurrencyPolicy:'Forbid',jobTemplate:{spec:job().spec}});
export const claim = (name='data', storage='1Gi', extra={}) => object('PersistentVolumeClaim',name,{accessModes:['ReadWriteOnce'],resources:{requests:{storage}},storageClassName:'standard',...extra});
export const stateful = (name='db', replicas=2) => object('StatefulSet',name,{...deployment(name,replicas,'redis:7.4').spec,serviceName:name});
export const daemon = (name='agent') => object('DaemonSet',name,{selector:{matchLabels:{app:name}},template:{metadata:{labels:{app:name}},spec:{containers:[{name:'agent',image:'busybox:1.37',command:['sleep','3600']}]}}});
export const pathGet = (o,path) => path.split('.').reduce((x,k)=>x?.[k],o);
export function subset(actual, expected) {
  if (expected === null || typeof expected !== 'object') return actual === expected;
  if (actual === null || typeof actual !== 'object') return false;
  return Object.entries(expected).every(([k,v])=>subset(actual[k],v));
}
export function merge(target, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return copy(patch);
  const out = {...target};
  for (const [key,value] of Object.entries(patch)) {
    if (['__proto__','constructor','prototype'].includes(key)) throw new Error('Unsafe object key');
    if (value === null) delete out[key];
    else out[key] = typeof value === 'object' && !Array.isArray(value) ? merge(out[key], value) : copy(value);
  }
  return out;
}
// Small serializer used by the simulator. The editor uses the full YAML library for parsing.
export function yaml(value, indent=0) {
  const scalar = v => v === null ? 'null' : typeof v === 'string' ? JSON.stringify(v) : String(v);
  if (value === null || typeof value !== 'object') return scalar(value);
  const pad=' '.repeat(indent), entries=Array.isArray(value)?value.map(v=>['-',v]):Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k+':',v]);
  if (!entries.length) return Array.isArray(value)?'[]':'{}';
  return entries.map(([key,v])=>pad+key+(v !== null && typeof v === 'object' && Object.keys(v).length ? '\n'+yaml(v,indent+2) : ' '+(typeof v==='object'&&v!==null?JSON.stringify(v):scalar(v)))).join('\n');
}
export const refKey = r => `${r.kind}/${r.metadata.namespace || ''}/${r.metadata.name}`;
export const isCluster = kind => ['Node','Namespace','PersistentVolume','StorageClass','CustomResourceDefinition','ClusterRole','ClusterRoleBinding'].includes(kind);
