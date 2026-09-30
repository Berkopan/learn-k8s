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
const goalClue=goal=>{
  if(!goal)return '';
  if(goal.type==='event')return ' Bu adımın başarısı bir gözlem olayıyla doğrulanır; yalnızca nesne yazmak yetmez.';
  if(goal.type==='resource')return ` Son durumda ${goal.kind}/${goal.name} üzerinde beklenen değişiklik görünmeli.`;
  if(goal.type==='absent')return ` Sonunda ${goal.kind}/${goal.name} artık bulunmamalı.`;
  if(goal.type==='count')return ` Sonuçta ${goal.kind} sayısının hedefe yaklaştığını gözlemle.`;
  if(goal.type==='all')return ' Tek bir başarılı komut cevabıyla yetinme; birden fazla koşulun birlikte sağlanması gerekiyor.';
  if(goal.type==='dockerImage')return ' Sonuç çalışan container değil, yerel image envanterindeki referanstır.';
  if(goal.type==='dockerContainer')return ' Sonuçta container örneğinin yaşam döngüsü ve durumu değişmiş olmalı.';
  if(goal.type==='dockerAbsent')return ' Container kaydı kalkmalı; image deposu bundan bağımsızdır.';
  if(goal.type==='state')return ' Laboratuvarın simüle durumundaki değişikliği sonraki gözlem adımında doğrula.';
  return '';
};
const commandClue=command=>{
  const c=(command||'').trim();
  if(/^docker pull\b/.test(c))return 'Container başlatma; image referansını registry’den yerel image deposuna getiren işlemi düşün.';
  if(/^docker images\b/.test(c))return 'Çalışan süreçleri değil, yerelde bilinen image referanslarını listeleyen envantere bak.';
  if(/^docker run\b/.test(c))return 'Yeni bir container örneği oluşturuyorsun; örnek adı ile image referansını birbirinden ayır.';
  if(/^docker ps\b/.test(c))return c.includes('--all')?'Yalnız çalışanları değil durmuş kayıtları da kapsayan container listesini iste.':'Image listesini değil çalışan container örneklerini sorgula.';
  if(/^docker inspect\b/.test(c))return 'Liste özeti yetmez; tek container’ın ayrıntılı metadata ve image bilgisini aç.';
  if(/^docker logs\b/.test(c))return 'Container durumunu değiştirme; uygulamanın stdout/stderr akışını gözlemle.';
  if(/^docker tag\b/.test(c))return 'Yeni süreç başlatmadan mevcut image içeriğine ikinci bir okunabilir referans ekle.';
  if(/^docker stop\b/.test(c))return 'Silmek yerine önce çalışan sürecin yaşam döngüsünü durdur.';
  if(/^docker rm\b/.test(c))return 'Image’a dokunmadan durmuş container kaydını kaldır.';
  if(/^kubectl cluster-info\b/.test(c))return 'Bir iş yükünü değiştirmeden API server ve control-plane erişim özetini sorgula.';
  if(/^kubectl version\b/.test(c))return 'İstemci ile sunucu bilgisini aynı çıktıda karşılaştıran sürüm sorgusunu kullan.';
  if(/^kubectl config current-context\b/.test(c))return 'Kaynak yazmadan önce etkin kubeconfig context’inin hangisi olduğunu doğrula.';
  if(/^kubectl config get-contexts\b/.test(c))return 'Tek bir context yerine kubeconfig içindeki mevcut context listesini gözlemle.';
  if(/^kubectl api-resources\b/.test(c))return 'Kaynak adını ezberlemek yerine API’nin sunduğu türleri ve kısa adları keşfet.';
  if(/^kubectl explain\b/.test(c))return 'Canlı nesneyi değiştirme; API şemasındaki alan yolunu açıklatan komutu kullan.';
  if(/^kubectl get\b/.test(c)){
    if(/\s-o\s+yaml\b|--output[= ]yaml\b/.test(c))return 'Özet tablo yerine nesnenin alanlarını görebilmek için YAML çıktısı iste.';
    if(/\s-o\s+wide\b|--output[= ]wide\b/.test(c))return 'Standart tablonun sakladığı node/IP gibi ek sütunlar için geniş çıktıyı kullan.';
    if(/\s-l\s|--selector(?:=|\s)/.test(c))return 'Bütün nesneleri tarama; görevin söz ettiği etiketi selector olarak sorguya ekle.';
    if(/\s-n\s|--namespace(?:=|\s)/.test(c))return 'Aynı ad başka namespace’te olabilir; sorgunun kapsamını komutta açıkça belirt.';
    return 'Önce mevcut durumu değiştirmeden doğru kaynak türünü listele; READY/STATUS gibi gözlenen alanları oku.';
  }
  if(/^kubectl describe\b/.test(c))return 'Tablo özeti yerine tek nesnenin koşullarını, seçicilerini ve olaylarını ayrıntılı aç.';
  if(/^kubectl create namespace\b/.test(c))return 'Namespaced bir iş yükü değil, yeni bir ad kapsamı oluşturman gerekiyor.';
  if(/^kubectl create configmap\b/.test(c))return 'Uygulama image’ına gömmek yerine düz yapılandırma anahtarını ayrı bir ConfigMap nesnesine koy.';
  if(/^kubectl create secret\b/.test(c))return 'Yapılandırmadan ayrı tutulan hassas değeri Secret nesnesi olarak oluştur; base64’ü şifreleme sanma.';
  if(/^kubectl create deployment\b/.test(c))return 'Tek Pod yerine Pod template’ini yöneten ve replica üretebilen bir controller oluştur.';
  if(/^kubectl create job\b/.test(c))return 'Sürekli servis yerine tamamlanıp başarı durumuna geçebilen bir Job controller’ı oluştur.';
  if(/^kubectl create cronjob\b/.test(c))return 'Tek seferlik Job değil, Job üreten bir zamanlama nesnesi tanımla.';
  if(/^kubectl create rolebinding\b/.test(c))return 'İzin tanımını yeniden yazma; mevcut rolü doğru özneye bağlayan binding oluştur.';
  if(/^kubectl create role\b/.test(c))return 'Kimlik oluşturmak yerine namespace içindeki izin fiillerini ve kaynaklarını tarif eden rolü tanımla.';
  if(/^kubectl create serviceaccount\b/.test(c))return 'İnsan kullanıcısı değil, Pod’un kullanacağı namespaced iş yükü kimliğini oluştur.';
  if(/^kubectl run\b/.test(c))return 'Controller kurmadan tek Pod oluştur; image ve gerekiyorsa namespace seçimini görevden çıkar.';
  if(/^kubectl apply\b/.test(c))return 'Hazır manifestte istenen durum tarif edilmiş; dosyayı deklaratif olarak kümeye uygula.';
  if(/^kubectl diff\b/.test(c))return 'Değişikliği yazmadan önce manifest ile canlı durum arasındaki farkı önizle.';
  if(/^kubectl scale\b/.test(c))return 'Pod’ları tek tek yaratıp silme; controller’ın desired replica sayısını değiştir.';
  if(/^kubectl set image\b/.test(c))return 'Deployment’ı silmeden Pod template’indeki ilgili container image referansını güncelle.';
  if(/^kubectl set env\b/.test(c))return 'Image’ı değiştirmeden controller’ın Pod template’ine ortam değişkeni veya referansı ekle.';
  if(/^kubectl set resources\b/.test(c))return 'Gerçek kullanım ölçümü değil, scheduler’ın yerleşimde kullandığı request/limit sözleşmesini değiştir.';
  if(/^kubectl rollout status\b/.test(c))return 'Yazma komutundan sonra controller’ın yeni revision’a gerçekten yakınsadığını ayrıca doğrula.';
  if(/^kubectl rollout history\b/.test(c))return 'Yeni değişiklik yapmadan Deployment revision geçmişini incele.';
  if(/^kubectl rollout undo\b/.test(c))return 'Bozuk template’i elle yeniden yazmak yerine controller’ın önceki revision’ına dön.';
  if(/^kubectl rollout restart\b/.test(c))return 'Config değişmiş olsa bile mevcut süreç snapshot’ı aynı kalabilir; yeni Pod’lar üretecek kontrollü restart kullan.';
  if(/^kubectl expose\b/.test(c))return 'Pod IP’lerini tek tek kullanma; controller’ın etiketlediği Pod’ların önüne sabit bir Service koy.';
  if(/^kubectl port-forward\b/.test(c))return 'Kalıcı yayın tipi değiştirmeden yerel bir portu geçici olarak hedef Service/Pod portuna bağla.';
  if(/^kubectl label\b/.test(c))return 'İsim değiştirme; seçim ve gruplamada kullanılacak key=value metadata’sını hedef nesneye ekle.';
  if(/^kubectl annotate\b/.test(c))return 'Selector için label kullan; burada makine seçimi değil açıklayıcı metadata ekliyorsun.';
  if(/^kubectl taint\b/.test(c))return 'Pod seçmek yerine node’a varsayılan yerleşimi engelleyen bir taint kuralı ekle.';
  if(/^kubectl cordon\b/.test(c))return 'Mevcut Pod’ları tahliye etmeden node’u yalnızca yeni yerleşimlere kapat.';
  if(/^kubectl drain\b/.test(c))return 'Bakım için node’u boşaltırken controller’lı Pod’ların başka node’da yeniden oluşturulmasına izin ver.';
  if(/^kubectl wait\b/.test(c))return 'Sabit süre uyumak yerine API’deki condition değerinin gerçekleşmesini bekle.';
  if(/^kubectl logs\b/.test(c))return c.includes('--previous')?'Mevcut container yerine bir önceki restart örneğinin log akışını iste.':'Nesneyi değiştirmeden container’ın stdout/stderr kayıtlarını oku.';
  if(/^kubectl exec\b/.test(c))return 'Kümeye yeni kaynak eklemek yerine mevcut Pod içindeki tanılama komutunu çalıştır; -- sonrasının container komutu olduğunu unutma.';
  if(/^kubectl auth can-i\b/.test(c))return 'Yetkiyi tahmin etme; belirli kimlik + fiil + kaynak üçlüsünü API’ye sor.';
  if(/^kubectl patch\b/.test(c))return 'Tüm manifesti yeniden yazmak yerine yalnız arızalı alanı hedefleyen küçük bir patch uygula.';
  if(/^kubectl delete\b/.test(c))return 'Önce neyin controller tarafından yeniden üretileceğini düşün; sonra doğru tür/ad/kapsamdaki nesneyi kaldır.';
  if(/^kubectl autoscale\b/.test(c))return 'Sabit replica sayısı vermek yerine min/max aralığı ve CPU hedefiyle HPA oluştur.';
  if(/^helm install\b/.test(c))return 'Tek tek manifest uygulamak yerine chart’ı isimlendirilmiş bir release olarak kur.';
  if(/^helm list\b/.test(c))return 'Kubernetes nesnelerini değil, Helm’in yönettiği release envanterini sorgula.';
  if(/^helm upgrade\b/.test(c))return 'Yeni release adı açma; mevcut release’in values/chart durumunu yeni revision’a taşı.';
  if(/^helm history\b/.test(c))return 'Canlı Pod listesinden değil, Helm release revision geçmişinden önceki sürümleri gör.';
  if(/^helm rollback\b/.test(c))return 'Manifestleri elle geri çevirmek yerine release’i seçilen önceki revision’a döndür.';
  if(/^helm uninstall\b/.test(c))return 'Tek tek nesne silmek yerine release sahipliği üzerinden paketli kaynakları temizle.';
  if(/^lab request\b/.test(c))return 'Bu eğitim yardımcısı yalnız hizmet sonucunu doğrular; Service/endpoint/readiness zinciri doğruysa istek başarılı olur.';
  if(/^lab load\b/.test(c))return 'Gerçek CPU üretmiyorsun; HPA deneyinde kullanılacak simüle yük yüzdesini ayarla.';
  if(/^lab tick\b/.test(c))return 'Yeni kubectl kaynağı oluşturma; controller/HPA/Job modelinin bir mantıksal yakınsama adımı ilerlemesini sağla.';
  if(/^lab /.test(c))return 'Bu bir Kubernetes komutu değil, yalnız simülasyonun gözlenebilir sonucunu veya zaman adımını tetikleyen eğitim yardımcısıdır.';
  if(/^cat\b/.test(c))return 'Kümeye yazmadan önce laboratuvar dosyasının içeriğini okuyup kind/metadata/spec ayrımını bul.';
  if(/^curl\b/.test(c))return 'Kaynak tanımını değiştirme; daha önce açtığın yerel tünelin gerçekten HTTP yanıtı verdiğini sınayacaksın.';
  return 'Görevin fiiline karar ver: önce gözlem mi, sonra küçük bir değişiklik mi, yoksa sonucu doğrulama mı gerektiğini ayır.';
};
const contextualHint=(title,step,index)=>`${title} · ${index+1}. adım: ${commandClue(step.command)}${goalClue(step.goal)}`;

export const S=(text,command,goal,hint)=>({text,command,goal,hint:hint||''});
export const levels=[];
export function L(module,title,concept,mechanism,caution,steps,extra={}) {
  const id=levels.length+1;
  const contextualSteps=steps.map((step,index)=>step.hint?step:{...step,hint:contextualHint(title,step,index)});
  levels.push({id,module,title,concept,mechanism,caution,steps:contextualSteps,seed:[],files:{},xp:40+Math.floor(module/4)*10+(id%8===0?40:0),minutes:steps.length+3,difficulty:module<4?'Temel':module<12?'Uygulama':'Saha',source:modules[module].source,...extra});
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
