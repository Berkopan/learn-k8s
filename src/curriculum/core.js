import {object, pod, deployment, service, config, secret, job, cron, claim, stateful, daemon, container, copy, meta} from '../model.js';

export const CURRICULUM_VERSION = 1;
export const K='https://kubernetes.io/docs/';
export const modules = [
  ['Container temelleri','Image, container ve yaşam döngüsü','Paketleyici','https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/','docker pull IMAGE · docker run --name NAME IMAGE'],
  ['Kümenin pusulası','Control plane, node ve context','Kaşif',K+'concepts/overview/components/','kubectl get TYPE · kubectl describe TYPE NAME'],
  ['Pod atölyesi','En küçük birimden ilk teşhise','Pod ustası',K+'concepts/workloads/pods/','kubectl run NAME --image=IMAGE · kubectl get pods -o wide'],
  ['YAML ile düşünmek','İstenen durumu dosyaya dök','Bildirici',K+'tasks/manage-kubernetes-objects/declarative-config/','cat FILE · kubectl diff -f FILE · kubectl apply -f FILE'],
  ['Deployment döngüsü','Replica, reconciliation ve rollout','Orkestra şefi',K+'concepts/workloads/controllers/deployment/','kubectl scale deployment/NAME --replicas=N · kubectl rollout status deployment/NAME'],
  ['Trafiğin yolu','Service, endpoint ve DNS','Bağlantı kurucu',K+'concepts/services-networking/service/','kubectl expose deployment NAME --port=80 · kubectl get endpointslices'],
  ['Ayarlar ve sırlar','ConfigMap, Secret ve ortam değişkenleri','Yapılandırıcı',K+'concepts/configuration/configmap/','kubectl create configmap NAME --from-literal=KEY=VALUE'],
  ['Yer ve kaynak','Request, limit ve scheduling','Planlamacı',K+'concepts/configuration/manage-resources-containers/','kubectl set resources deployment/NAME --requests=cpu=100m,memory=64Mi'],
  ['Sağlık sinyalleri','Readiness, liveness, startup ve init','Sağlık gözlemcisi',K+'tasks/configure-pod-container/configure-liveness-readiness-startup-probes/','kubectl describe pod NAME · kubectl wait --for=condition=Ready pod/NAME'],
  ['Verinin ömrü','Volume, PVC ve StatefulSet','Veri koruyucu',K+'concepts/storage/persistent-volumes/','kubectl get pvc · kubectl describe pvc NAME · kubectl get statefulsets'],
  ['En az yetki','ServiceAccount, RBAC ve güvenlik','Yetki mimarı',K+'reference/access-authn-authz/rbac/','kubectl auth can-i VERB RESOURCE --as=system:serviceaccount:default:NAME'],
  ['Tamamlanan işler','Job, CronJob ve tekrar güvenliği','İş planlayıcı',K+'concepts/workloads/controllers/job/','kubectl create job NAME --image=busybox:1.37 -- echo done'],
  ['Arıza masası','Belirtiden kök nedene','Dedektif',K+'tasks/debug/debug-application/','kubectl get events · kubectl logs POD · kubectl describe pod POD'],
  ['Yük ve dayanıklılık','HPA, bakım ve kesinti bütçesi','Dayanıklılık uzmanı',K+'concepts/workloads/autoscaling/horizontal-pod-autoscale/','kubectl autoscale deployment NAME --min=2 --max=6 --cpu-percent=60'],
  ['Platform araçları','Ingress, ağ politikası ve Helm','Platform kurucusu',K+'concepts/services-networking/network-policies/','kubectl apply -f FILE · helm install NAME ./chart'],
  ['Saha görevleri','Uçtan uca operasyon senaryoları','Küme kaptanı',K+'tasks/debug/debug-application/','Gözlemle → hipotez kur → düzelt → doğrula'],
].map(([title,subtitle,badge,source,syntax],id)=>({id,title,subtitle,badge,source,syntax}));
export const E=(action,match={},times=1)=>({type:'event',match:{action,...match},times});
export const R=(kind,name,match={},namespace='default')=>({type:'resource',kind,name,match,namespace});
export const N=(kind,name,namespace='default')=>({type:'absent',kind,name,namespace});
export const C=(kind,count,match={})=>({type:'count',kind,count,match});
export const ALL=(...goals)=>({type:'all',goals});
export const S=(text,command,goal,hint)=>({text,command,goal,hint:hint||'Komut referansındaki kaynak türü, ad ve seçenekleri görevdeki değerlerle birleştir.'});
export const levels=[];
export function L(module,title,concept,mechanism,caution,steps,extra={}) {
  const id=levels.length+1;
  levels.push({id,module,title,concept,mechanism,caution,steps,seed:[],files:{},xp:40+Math.floor(module/4)*10+(id%8===0?40:0),minutes:steps.length+3,difficulty:module<4?'Temel':module<12?'Uygulama':'Saha',source:modules[module].source,...extra});
}
export const web=()=>deployment('web',2);
export const client=()=>pod('client',{containers:[{name:'client',image:'busybox:1.37',command:['sleep','3600']}]},{app:'client'});
export const patch=(type,name,data)=>`kubectl patch ${type} ${name} --type=merge -p '${JSON.stringify(data)}'`;
export const res=(cpu='100m',memory='64Mi')=>({requests:{cpu,memory},limits:{cpu:'1',memory:'256Mi'}});
export const healthy=(replicas=2)=>deployment('web',replicas,'nginx:1.27',{containers:[container('nginx:1.27',{resources:res(),readinessProbe:{httpGet:{path:'/',port:80},periodSeconds:5}})]});
export const brokenReady=()=>deployment('web',2,'nginx:1.27',{containers:[container('nginx:1.27',{readinessProbe:{httpGet:{path:'/broken',port:80}}})]});
export const role=()=>object('Role','reader',undefined,{rules:[{apiGroups:[''],resources:['pods'],verbs:['get','list']}]});
export const sa=()=>object('ServiceAccount','reader',undefined);
export const binding=()=>object('RoleBinding','reader-binding',undefined,{roleRef:{apiGroup:'rbac.authorization.k8s.io',kind:'Role',name:'reader'},subjects:[{kind:'ServiceAccount',name:'reader',namespace:'default'}]});
export const deny=()=>object('NetworkPolicy','isolate-web',{podSelector:{matchLabels:{app:'web'}},policyTypes:['Ingress'],ingress:[]});
export const allow=()=>object('NetworkPolicy','allow-client',{podSelector:{matchLabels:{app:'web'}},policyTypes:['Ingress'],ingress:[{from:[{podSelector:{matchLabels:{app:'client'}}}],ports:[{protocol:'TCP',port:80}]}]});
export const hpa=()=>object('HorizontalPodAutoscaler','web',{scaleTargetRef:{apiVersion:'apps/v1',kind:'Deployment',name:'web'},minReplicas:2,maxReplicas:6,metrics:[{type:'Resource',resource:{name:'cpu',target:{type:'Utilization',averageUtilization:60}}}]});
export const pdb=()=>object('PodDisruptionBudget','web-budget',{minAvailable:1,selector:{matchLabels:{app:'web'}}});
export const dockerState=(running=true)=>({docker:{images:['nginx:1.27'],containers:[{name:'web',image:'nginx:1.27',status:running?'Running':'Exited'}]}});
export const edit=(resource,mutate)=>{mutate(resource);return resource;};
export {object,pod,deployment,service,config,secret,job,cron,claim,stateful,daemon,container,copy,meta};
