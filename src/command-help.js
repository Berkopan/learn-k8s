// This is the simulator's supported subset, not a claim to implement all Docker flags.
export const dockerCommands = Object.freeze([
  {name:'pull', usage:'docker pull IMAGE', example:'docker pull nginx:1.27',
    tr:'Image referansını yerel depoya ekler; container başlatmaz.', en:'Add an image reference to the local store; do not start a container.'},
  {name:'images', usage:'docker images', example:'docker images',
    tr:'Yereldeki image referanslarını listeler; çalışan süreç listesi değildir.', en:'List local image references, not running processes.'},
  {name:'run', usage:'docker run [-d] [--name NAME] IMAGE', example:'docker run -d --name web nginx:1.27',
    tr:'Bir image’dan yeni container başlatır. -d arka plan niyetini, --name örnek adını belirtir.', en:'Start a container from an image. -d requests detached execution; --name names the instance.'},
  {name:'ps', usage:'docker ps [-a | --all]', example:'docker ps --all',
    tr:'Çalışan container’ları listeler. -a veya --all durmuş kayıtları da gösterir.', en:'List running containers. -a or --all also includes stopped records.'},
  {name:'inspect', usage:'docker inspect CONTAINER', example:'docker inspect web',
    tr:'Tek container’ın image ve durum bilgisini JSON olarak gösterir.', en:'Show one container’s image and state as JSON.'},
  {name:'logs', usage:'docker logs CONTAINER', example:'docker logs web',
    tr:'Container’ın örnek uygulama loglarını okur; durumunu değiştirmez.', en:'Read the container’s sample application logs without changing its state.'},
  {name:'tag', usage:'docker tag SOURCE_IMAGE TARGET_IMAGE', example:'docker tag nginx:1.27 local/web:v1',
    tr:'Mevcut image’a yeni bir referans ekler; image oluşturmaz veya container başlatmaz.', en:'Add another reference to an existing image without building an image or starting a container.'},
  {name:'stop', usage:'docker stop CONTAINER', example:'docker stop web',
    tr:'Container’ı durdurur; kaydı ve image depoda kalır.', en:'Stop a container while retaining its record and image.'},
  {name:'rm', usage:'docker rm CONTAINER', example:'docker rm web',
    tr:'Durmuş container kaydını kaldırır. Önce stop kullan; image silinmez.', en:'Remove a stopped container record. Use stop first; the image remains.'},
]);
const byName = new Map(dockerCommands.map(item => [item.name, item]));
export function dockerHelp(topic = '', locale = 'tr') {
  const english = locale === 'en';
  const item = topic ? byName.get(topic) : null;
  if (topic && !item) throw new Error(english
    ? `Unsupported Docker help topic: ${topic}. Use help docker.`
    : `Desteklenmeyen Docker yardım konusu: ${topic}. help docker kullan.`);
  const intro = english ? 'DOCKER · SUPPORTED LAB COMMANDS' : 'DOCKER · LABORATUVAR KOMUTLARI';
  const rows = item ? [item] : dockerCommands;
  return [intro, '', ...rows.flatMap(command => [
    `  ${command.usage}`, `    ${command[english ? 'en' : 'tr']}`,
    `    ${english ? 'Example' : 'Örnek'}: ${command.example}`, '',
  ]), english ? 'More help: help docker run · docker run --help · docker help run'
    : 'Ayrıntı: help docker run · docker run --help · docker help run',
  english ? 'Only the options shown above are supported. build, compose, login, -p and real shells are not implemented.'
    : 'Yalnız yukarıdaki seçenekler desteklenir. build, compose, login, -p ve gerçek shell çalıştırılmaz.',
  english ? 'Simulation only: no images are downloaded, no daemon or real process is started.'
    : 'Simülasyon: image indirilmez, daemon veya gerçek süreç başlatılmaz.'
  ].join('\n');
}
export function dockerCheats(locale = 'tr') {
  return [locale === 'en' ? 'Docker · images and containers' : 'Docker · image ve container',
    ['help docker', ...dockerCommands.map(command => command.example)].join('\n')];
}
export function generalHelp(locale = 'tr') {
  const english = locale === 'en';
  return [
    english ? 'learn-k8s · COMMAND REFERENCE' : 'learn-k8s · KOMUT REHBERİ',
    english ? 'One command at a time. Examples below are separate commands, not shell pipelines.'
      : 'Komutları tek tek gir. Aşağıdaki örnekler ayrı komutlardır; shell zinciri değildir.',
    '', dockerHelp('', locale), '',
    'KUBECTL',
    '  kubectl get TYPE [NAME] [-n NS] [-l key=value] [-o yaml|json|wide]',
    '  kubectl describe TYPE NAME',
    '  kubectl explain pod.spec.containers',
    '  kubectl run NAME --image=IMAGE',
    '  kubectl create deployment NAME --image=IMAGE [--replicas=N]',
    '  kubectl create namespace NAME',
    '  kubectl create configmap NAME --from-literal=KEY=VALUE',
    '  kubectl create secret generic NAME --from-literal=KEY=VALUE',
    '  kubectl create serviceaccount NAME',
    '  kubectl create role NAME --verb=get,list --resource=pods',
    '  kubectl create rolebinding NAME --role=ROLE --serviceaccount=NS:SA',
    '  kubectl create job NAME --image=IMAGE -- COMMAND',
    '  kubectl create cronjob NAME --image=IMAGE --schedule="*/5 * * * *"',
    '  kubectl apply -f FILE',
    '  kubectl diff -f FILE',
    '  kubectl delete TYPE NAME',
    '  kubectl delete -f FILE',
    '  kubectl scale deployment/NAME --replicas=N',
    '  kubectl set image deployment/NAME CONTAINER=IMAGE',
    '  kubectl set env deployment/NAME KEY=VALUE',
    '  kubectl set env deployment/NAME --from=configmap/NAME',
    '  kubectl set resources deployment/NAME --requests=cpu=100m,memory=64Mi',
    '  kubectl expose deployment NAME --port=80 --target-port=80',
    '  kubectl rollout status deployment/NAME',
    '  kubectl rollout history deployment/NAME',
    '  kubectl rollout undo deployment/NAME',
    '  kubectl rollout restart deployment/NAME',
    '  kubectl logs POD [--previous]',
    '  kubectl exec POD -- printenv',
    '  kubectl exec POD -- wget -qO- http://SERVICE:PORT',
    '  kubectl label TYPE NAME KEY=VALUE [--overwrite]',
    '  kubectl annotate TYPE NAME KEY=VALUE',
    '  kubectl patch TYPE NAME --type=merge -p \'{"spec":{...}}\'',
    '  kubectl autoscale deployment NAME --min=2 --max=6 --cpu-percent=60',
    '  kubectl top pods',
    '  kubectl top nodes',
    '  kubectl auth can-i VERB RESOURCE --as=IDENTITY',
    '  kubectl cordon NODE',
    '  kubectl uncordon NODE',
    '  kubectl drain NODE --ignore-daemonsets',
    '  kubectl wait --for=condition=Ready pod/NAME --timeout=30s',
    '  kubectl config current-context',
    '  kubectl config get-contexts',
    '  kubectl config use-context NAME',
    '  kubectl config set-context --current --namespace=NS',
    '  kubectl cluster-info',
    '  kubectl version',
    '  kubectl api-resources',
    '  kubectl port-forward service/NAME LOCAL:REMOTE',
    '  curl http://localhost:LOCAL',
    '', 'HELM',
    '  helm list', '  helm install NAME ./chart',
    '  helm upgrade NAME ./chart --set replicaCount=3',
    '  helm history NAME', '  helm rollback NAME REVISION', '  helm uninstall NAME',
    '', english ? 'LAB HELPERS (not Kubernetes commands)' : 'LAB YARDIMCILARI (Kubernetes komutu değildir)',
    '  help', '  help docker', '  ls', '  cat FILE', '  clear', '  history',
    '  lab tick', '  lab load 90', '  lab request SERVICE[:PORT]',
    '', english ? 'Use the Files tab to edit YAML. lab tick advances the model; lab load sets synthetic CPU utilization.'
      : 'YAML için Dosyalar sekmesini kullan. lab tick modeli ilerletir; lab load sentetik CPU yüzdesini ayarlar.',
    english ? 'Unsupported commands report an error. There is no real shell, network, filesystem or Kubernetes cluster.'
      : 'Desteklenmeyen komutlar hata verir. Gerçek shell, ağ, dosya sistemi veya Kubernetes kümesi çalışmaz.'
  ].join('\n');
}
export const helpText = (topic = '', locale = 'tr') => topic === 'docker'
  ? dockerHelp('', locale) : topic.startsWith('docker ')
    ? dockerHelp(topic.slice(7), locale) : generalHelp(locale);

// Help is recognized before execution, but only before the container-command -- boundary.
export function helpTopic({binary, args, flags}) {
  if (binary === 'help') {
    if (!args.length) return '';
    if (args[0] === 'docker' && args.length <= 2) return ['docker', args[1]].filter(Boolean).join(' ');
    throw new Error('Desteklenen yardım konuları: help, help docker, help docker COMMAND.');
  }
  if (binary === 'docker' && (!args.length || args[0] === 'help' || flags.help)) {
    const topic = args[0] === 'help' ? args[1] : args[0];
    if (args.length > (args[0] === 'help' ? 2 : 1)) throw new Error('Docker yardımı için tek komut adı kullan.');
    if (topic && !byName.has(topic)) throw new Error(`Desteklenmeyen Docker yardım konusu: ${topic}. help docker kullan.`);
    return ['docker', topic].filter(Boolean).join(' ');
  }
  return flags.help ? '' : null;
}
export function validateDockerInvocation(args, flags, tail) {
  const [verb] = args, entry = byName.get(verb);
  if (!entry) throw new Error(`Desteklenmeyen Docker komutu: ${verb}. help docker kullan.`);
  const permitted = verb === 'run' ? ['d', 'name'] : verb === 'ps' ? ['a', 'all'] : [];
  for (const flag of Object.keys(flags)) {
    if (!permitted.includes(flag)) throw new Error(`docker ${verb}: --${flag} bu modelde desteklenmiyor. docker ${verb} --help kullan.`);
  }
  const required = {images:1, ps:1, tag:3}[verb] ?? 2;
  if (args.length !== required || tail.length) throw new Error(`Kullanım: ${entry.usage}`);
}
export const dockerSuggestions = Object.freeze([
  ...dockerCommands.map(command => command.example), 'docker ps -a', 'docker ps',
  'help docker', 'docker help', 'docker --help',
  ...dockerCommands.map(command => `docker ${command.name} --help`),
]);
export function contextDockerSuggestions(state) {
  return [
    ...state.docker.containers.flatMap(container => ['inspect','logs','stop','rm'].map(verb => `docker ${verb} ${container.name}`)),
    ...state.docker.images.map(image => `docker run -d --name web-copy ${image}`),
    ...state.docker.images.map(image => `docker tag ${image} local/web:v1`),
    ...dockerSuggestions,
  ];
}
