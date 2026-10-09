import {levelsByKey, LEGACY_ID_TO_KEY} from '../curriculum.js';
import {ALL, R, ENV, HTTP, REACH, deployment, service, pod, container, patch, res} from './core.js';

export const challengeKinds = Object.freeze([
  Object.freeze({kind: 'traffic', sourceKey: LEGACY_ID_TO_KEY[122], title: 'Erişim kesintisi'}),
  Object.freeze({kind: 'release', sourceKey: LEGACY_ID_TO_KEY[121], title: 'Yayın sonrası kesinti'}),
  Object.freeze({kind: 'configuration', sourceKey: LEGACY_ID_TO_KEY[123], title: 'Başlamayan uygulama'}),
]);

const scoped = (resource, namespace) => ({...resource, metadata: {...resource.metadata, namespace}});
const english = locale => locale === 'en';

/** Stable inputs produce a fresh, reproducible scenario; no random or shared state. */
export function createChallenge(kind, seed = 1, locale = 'tr') {
  const descriptor = challengeKinds.find(item => item.kind === kind);
  if (!descriptor) throw new RangeError(`Unknown challenge kind: ${kind}`);
  const normalizedSeed = Number.isSafeInteger(seed) && seed >= 0 && seed <= 2147483647 ? seed : 1;
  const suffix = normalizedSeed.toString(36);
  const app = `${['catalog', 'shop', 'portal'][normalizedSeed % 3]}-${suffix}`;
  const client = `client-${suffix}`;
  const settings = `${app}-settings`, credentials = `${app}-credentials`;
  const namespace = normalizedSeed % 2 ? 'staging' : 'default';
  const ns = ` -n ${namespace}`;
  const source = levelsByKey[descriptor.sourceKey];
  const readyContainer = container('nginx:1.27', {
    resources: res(), readinessProbe: {httpGet: {path: '/', port: 80}},
  });
  const clientPod = pod(client, {containers: [{name: 'client', image: 'busybox:1.37', command: ['sleep','3600']}]}, {app: client});
  let workload = deployment(app, 2, 'nginx:1.27', {containers: [readyContainer]});
  let endpoint = service(app);
  let title, guide, text, hint, syntaxHint, debrief, solutionCommands, completionGoal;

  if (kind === 'traffic') {
    workload.spec.template.spec.containers[0].readinessProbe.httpGet.path = '/broken';
    endpoint.spec.selector.app = `legacy-${suffix}`;
    title = english(locale) ? 'An application cannot be reached' : 'Uygulamaya erişilemiyor';
    guide = english(locale) ? {
      why: `Requests from ${client} to ${app}:80 are failing in namespace ${namespace}. The application Pods still exist. Restore the service without deleting and rebuilding the namespace.`,
      how: 'Use the terminal and resource view to gather evidence. You choose the investigation and repair order; no command sequence is required. Check the service result after making a change.',
      practice: `Finish with two ready application replicas and a successful request from ${client}. Keep an HTTP readiness check on the application. Hints and a worked solution remain optional.`,
    } : {
      why: `${namespace} namespace’inde ${client} istemcisinden ${app}:80 adresine istekler başarısız. Uygulama Pod’ları hâlâ mevcut. Namespace’i silip yeniden kurmadan hizmeti geri getir.`,
      how: 'Terminal ve kaynak görünümünden kanıt topla. İnceleme ve düzeltme sırasını sen seç; belirli bir komut dizisi gerekmiyor. Değişiklikten sonra hizmet sonucunu yeniden kontrol et.',
      practice: `İki uygulama replikası hazır olmalı ve ${client} içinden başarılı istek alınmalı. Uygulamanın HTTP readiness kontrolü tanımlı kalsın. İpucu ve örnek çözüm isteğe bağlıdır.`,
    };
    text = english(locale) ? `Restore two ready replicas and access from ${client} to ${app}:80.` : `İki hazır replikayı ve ${client} → ${app}:80 erişimini geri getir.`;
    hint = english(locale) ? 'Compare Pod readiness and Service selection separately. Empty endpoints can have more than one cause.' : 'Pod readiness durumuyla Service seçimini ayrı ayrı karşılaştır. Boş endpoint listesinin birden fazla nedeni olabilir.';
    syntaxHint = `kubectl get pods${ns} · kubectl describe service ${app}${ns} · kubectl get deployment ${app} -o yaml${ns}`;
    const repairedContainer = {...readyContainer, readinessProbe: {httpGet: {path: '/', port: 80}}};
    solutionCommands = [
      `kubectl get pods${ns}`,
      `kubectl describe service ${app}${ns}`,
      patch('service', app, {spec: {selector: {app}}}) + ns,
      patch('deployment', app, {spec: {template: {spec: {containers: [repairedContainer]}}}}) + ns,
      `kubectl exec ${client}${ns} -- wget -qO- http://${app}:80`,
    ];
    completionGoal = ALL(
      R('Deployment', app, {spec: {replicas: 2, template: {spec: {containers: [{name: 'web', readinessProbe: {httpGet: {port: 80}}}]}}}, status: {readyReplicas: 2}}, namespace),
      R('Service', app, {}, namespace), REACH(app, 80, client, namespace),
    );
    debrief = english(locale)
      ? 'Two faults were present: the Service selected the wrong labels and the readiness check used a failing path. Repairing only one left traffic unavailable. Your final client request checked the combined result.'
      : 'İki hata vardı: Service yanlış etiketleri seçiyordu ve readiness kontrolü başarısız bir yola bakıyordu. Yalnız birini düzeltmek erişimi getirmedi. Son istemci isteği, iki düzeltmenin birlikte sonucunu doğruladı.';
  } else if (kind === 'release') {
    workload.spec.template.spec.containers[0].image = 'nginx:bad-tag';
    title = english(locale) ? 'A service stopped after a release' : 'Yayın sonrası hizmet kesildi';
    guide = english(locale) ? {
      why: `A release of ${app} in namespace ${namespace} left requests from ${client} failing. The application should have two ready replicas. The approved working image for this exercise is nginx:1.27.`,
      how: 'Inspect what is failing before changing resources. The existing workload and Service should be repaired in place. Choose the commands that give you evidence about the current release.',
      practice: `Restore the approved image, two ready replicas and a successful request from ${client}. A successful configuration write alone does not complete the incident.`,
    } : {
      why: `${namespace} namespace’indeki ${app} yayınının ardından ${client} istekleri başarısız oldu. Uygulamanın iki hazır replikası olmalı. Bu alıştırmadaki onaylı çalışan image nginx:1.27.`,
      how: 'Kaynakları değiştirmeden hangi aşamanın başarısız olduğunu incele. Mevcut iş yükü ve Service yerinde onarılmalı. Geçerli yayın hakkında kanıt veren komutları sen seç.',
      practice: `Onaylı image’ı, iki hazır replikayı ve ${client} içinden başarılı isteği geri getir. Yalnız yapılandırma yazısının başarılı olması saha görevini bitirmez.`,
    };
    text = english(locale) ? `Restore ${app} with nginx:1.27 and verify access from ${client}.` : `${app} uygulamasını nginx:1.27 ile toparla ve ${client} erişimini doğrula.`;
    hint = english(locale) ? 'Start with Pod status and events. If every replacement has the same failure, inspect the controller’s Pod template.' : 'Pod durumları ve olaylarla başla. Her yeni örnekte aynı hata varsa controller’ın Pod template’ini incele.';
    syntaxHint = `kubectl get pods${ns} · kubectl get deployment ${app} -o yaml${ns} · kubectl rollout status deployment/${app}${ns}`;
    solutionCommands = [
      `kubectl get pods${ns}`,
      `kubectl set image deployment/${app} web=nginx:1.27${ns}`,
      `kubectl rollout status deployment/${app}${ns}`,
      `kubectl exec ${client}${ns} -- wget -qO- http://${app}:80`,
    ];
    completionGoal = ALL(
      R('Deployment', app, {spec: {replicas: 2, template: {spec: {containers: [{name: 'web', image: 'nginx:1.27'}]}}}, status: {readyReplicas: 2}}, namespace),
      REACH(app, 80, client, namespace),
    );
    debrief = english(locale)
      ? 'The rollout referenced an image tag that could not be pulled. Fixing the controller template repaired future Pods as well. Ready replicas and the client request confirmed that the release served traffic again.'
      : 'Yayındaki image tag’i çekilemiyordu. Controller template’ini düzeltmek sonraki Pod’ların da doğru tariften gelmesini sağladı. Hazır replikalar ve istemci isteği hizmetin geri geldiğini doğruladı.';
  } else {
    workload.spec.template.spec.containers[0].envFrom = [{configMapRef: {name: settings}}, {secretRef: {name: credentials}}];
    title = english(locale) ? 'New application instances will not start' : 'Yeni uygulama örnekleri başlamıyor';
    guide = english(locale) ? {
      why: `New ${app} instances in namespace ${namespace} are not becoming ready, and ${client} cannot reach the service. The exercise requires MODE=production and the dummy password PASSWORD=demo-only.`,
      how: 'Inspect the workload definition and events to find which names and dependencies it expects. Use the supplied dummy values only. You choose how to restore the required state.',
      practice: `Keep the workload’s configuration references and restore two ready replicas, then verify a request from ${client}. The application must still consume both required settings.`,
    } : {
      why: `${namespace} namespace’inde yeni ${app} örnekleri hazır olmuyor ve ${client} hizmete erişemiyor. Bu alıştırmada MODE=production ile yalnız sahte PASSWORD=demo-only değeri kullanılacak.`,
      how: 'İş yükü tanımı ve olaylardan beklenen isimleri ve bağımlılıkları bul. Yalnız verilen eğitim değerlerini kullan. İstenen durumu hangi komutlarla geri getireceğini sen seç.',
      practice: `İş yükünün yapılandırma referanslarını koruyarak iki hazır replikayı oluştur ve ${client} içinden isteği doğrula. Uygulama her iki gerekli ayarı da tüketmeye devam etmeli.`,
    };
    text = english(locale) ? `Restore ${app} with its required configuration and verify access from ${client}.` : `${app} uygulamasını gerekli ayarlarıyla başlat ve ${client} erişimini doğrula.`;
    hint = english(locale) ? 'Read the missing-reference names in the Pod template and events. A correct image cannot compensate for an unavailable ConfigMap or Secret.' : 'Pod template’i ve olaylarda eksik referansların adlarını oku. Doğru image, bulunmayan ConfigMap veya Secret’ın yerini tutmaz.';
    syntaxHint = `kubectl get deployment ${app} -o yaml${ns} · kubectl get events${ns} · kubectl create configmap NAME --from-literal=MODE=production${ns}`;
    solutionCommands = [
      `kubectl get deployment ${app} -o yaml${ns}`,
      `kubectl create configmap ${settings} --from-literal=MODE=production${ns}`,
      `kubectl create secret generic ${credentials} --from-literal=PASSWORD=demo-only${ns}`,
      `kubectl rollout status deployment/${app}${ns}`,
      `kubectl exec ${client}${ns} -- wget -qO- http://${app}:80`,
    ];
    completionGoal = ALL(
      R('ConfigMap', settings, {data: {MODE: 'production'}}, namespace),
      R('Secret', credentials, {data: {PASSWORD: 'ZGVtby1vbmx5'}}, namespace),
      R('Deployment', app, {spec: {replicas: 2, template: {spec: {containers: [{name: 'web', envFrom: [{configMapRef: {name: settings}}, {secretRef: {name: credentials}}]}]}}}, status: {readyReplicas: 2}}, namespace),
      ENV('Deployment', app, 'web', {MODE: 'production', PASSWORD: 'demo-only'}, namespace),
      REACH(app, 80, client, namespace),
    );
    debrief = english(locale)
      ? 'The Pod template referenced a ConfigMap and a Secret that were absent. Restoring both named dependencies let the containers start without removing their configuration requirements. The final request verified the service as well.'
      : 'Pod template’inin referans ettiği ConfigMap ve Secret yoktu. İki bağımlılığı doğru isimlerle oluşturmak, yapılandırma gereksinimlerini kaldırmadan container’ları başlattı. Son istek hizmeti de doğruladı.';
  }

  return {
    ...source,
    id: source.id, sourceId: source.id, sourceKey: source.key,
    key: `challenge.${kind}.${normalizedSeed}`, challenge: true, challengeKind: kind, challengeSeed: normalizedSeed,
    title, concept: guide.why, mechanism: guide.how, guide, debrief,
    caution: english(locale) ? 'This incident runs only in the browser model. The request is synthetic and uses no external service.' : 'Bu saha görevi yalnız tarayıcıdaki modelde çalışır. İstek sentetiktir ve dışarıdaki bir hizmete gönderilmez.',
    difficulty: english(locale) ? 'Independent' : 'Bağımsız', minutes: 8,
    seed: [workload, endpoint, clientPod].map(resource => scoped(resource, namespace)),
    state: {namespace}, files: {}, completionGoal,
    steps: [{text, hint, syntaxHint, command: solutionCommands[0], solutionCommands,
      goal: ALL(completionGoal, HTTP(app, 80, client, namespace))}],
  };
}
