# ConfigMap ortam değişkeni yenileme

[English](README.md)

ConfigMap'i güncellemek ile onu ortam değişkeni olarak kullanan container'ları yenilemek arasındaki farkı gözlemle.

## Başlat

Kubeconfig'inde seçili, eğitim için ayırdığın bir küme kullan. `kubectl`, POSIX shell, namespace oluşturma izni ve `nginx:1.27` image'ını çekebilme erişimi gerekir.

```sh
kubectl config current-context
./start.sh
```

Script `learn-k8s-configmap-refresh` namespace'ini oluşturur, `settings` ConfigMap'ini `MODE=production` ile uygular ve iki web replica'sının hazır olmasını bekler. Namespace bu laboratuvarın sahiplik etiketini taşır; script'ler aynı adlı başka bir namespace'i değiştirmeyi reddeder. `start.sh` yeniden çalıştırıldığında deney ve Pod'ları başlangıca döner. Temizlik tekrar çalıştırılabilir.

Deployment YAML içindeki `envFrom` alanını kullanır. nginx, `MODE` değerini yorumlamaz; değişken burada container'ın başlangıç ortamını gözlemlemek için bulunur.

## Yapılandırmayı değiştir ve gözlemle

```sh
kubectl -n learn-k8s-configmap-refresh exec deployment/web -c web -- printenv MODE
kubectl apply -f settings-maintenance.yaml
kubectl -n learn-k8s-configmap-refresh get configmap settings -o yaml
kubectl -n learn-k8s-configmap-refresh exec deployment/web -c web -- printenv MODE
```

ConfigMap artık `maintenance` içerirken mevcut container hâlâ `production` yazdırır. Nesnenin değişmesi çalışan process'in ortamını yeniden yazmaz. Başka bir nedenle yeni container oluşursa yeni değeri okur.

## Container'ları yenile

```sh
kubectl -n learn-k8s-configmap-refresh rollout restart deployment/web
kubectl -n learn-k8s-configmap-refresh rollout status deployment/web --timeout=120s
./verify.sh
```

Doğrulama; ConfigMap'in `maintenance` içerdiğini kontrol eder, rollout'u bekler ve güncel web Pod'larının her birinden `MODE` değerini okur. Eski rollout'tan kapanmakta olan Pod'lar dışarıda bırakılır. ConfigMap değişmiş fakat güncel container'lar eski değeri taşıyorsa kontrol başarısız olur.

```sh
./cleanup.sh
```

Temizlik, sahiplik etiketini kontrol ederek laboratuvara ayrılan namespace'in tamamını siler.

## Simülatörden gerçek kümeye

| Simülatör | Bu paket |
|---|---|
| Model durumundaki ortam anlık görüntüsü | `kubectl exec … -- printenv MODE`, gerçek container ortamını okur. |
| Rollout sırasında anında yenilenme | `rollout status`, controller'ları ve readiness sonucunu bekler. |
| `lab tick` | Eşdeğer bir komut yoktur; gerçek süreçler ve controller'lar zamanla ilerler. |

`envFrom`, başlangıçta bütün anahtarları aktarır. Ayrı bir yöntem olan `kubectl set env --from=configmap/NAME` ise anahtarları tek tek `env[].valueFrom.configMapKeyRef` referanslarına dönüştürür; `envFrom` oluşturmaz. Bu laboratuvar, farkı doğrudan inceleyebilmen için YAML biçimini kullanır.

## Kaynaklar ve doğrulama kapsamı

- [Kubernetes: ConfigMap ve rollout ile ortam değişkeni güncelleme](https://kubernetes.io/docs/tutorials/configuration/updating-configuration-via-a-configmap/)
- [Kubernetes: ConfigMap tüketimi ve ortam anlık görüntüsü](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [kubectl uygulaması: set env tek tek anahtar referansları oluşturur](https://github.com/kubernetes/kubectl/blob/master/pkg/cmd/set/set_env.go)

Statik repo kontrolleri manifestleri ayrıştırır, shell sözdizimini inceler, sahte `kubectl` ile sahiplik kontrollerini sınar ve arşivlerin yeniden üretilebilirliğini doğrular. Ayrı [Real cluster labs CI iş akışı](https://github.com/Berkopan/learn-k8s/actions/workflows/real-cluster-labs.yml), bu ZIP'i yeni bir kind / Kubernetes v1.35.0 kümesinde açıp yaşam döngüsünün tamamını sınayacak şekilde yapılandırılmıştır. ConfigMap değiştikten sonra aynı Pod ve container kimliklerinin `MODE=production` değerini koruduğunu, rollout öncesi doğrulamanın hâlâ başarısız olduğunu ve yenilenen container'ların `maintenance` ile doğrulamayı geçtiğini kontrol eder. Kullandığın commit'in iş akışı sonucuna bak; statik kontroller tek başına canlı küme başarısı göstermez. Kendi eğitim kümendeki davranışı `verify.sh` doğrular.
