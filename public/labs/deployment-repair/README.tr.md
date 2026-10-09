# Deployment onarımı

[English](README.md)

Hatalı image referansını düzelt; ardından iki gerçek Pod'un Service üzerinden HTTP yanıtı verdiğini doğrula. Bu paket, bilgisayarındaki `kubectl` için seçili Kubernetes context'inde çalışır.

## Başlat

Hazır bir worker node'u bulunan, eğitim için ayırdığın bir küme kullan. Namespace oluşturma izni, `kubectl`, POSIX shell ve dersteki `nginx:1.27` ile `busybox:1.37` image'larını çekebilme erişimi gerekir. Ingress veya dış load balancer gerekmez.

```sh
kubectl config current-context
./start.sh
```

Script bu laboratuvarın etiketiyle `learn-k8s-deployment-repair` namespace'ini oluşturur. Aynı ad başka bir amaçla kullanılıyorsa durur. Script'i yeniden çalıştırmak laboratuvar kaynaklarını başlangıca döndürür ve önceki çözümünü siler. `cleanup.sh` tekrar çalıştırılabilir.

`namespace.yaml` namespace'i oluşturur. `starter.yaml` Deployment, Service ve istemci Pod'unu içerir. Web image etiketindeki `learner-typo` kasıtlıdır; istemci hazır olurken web Pod'ları image'ı çekemez.

## İncele ve düzelt

```sh
kubectl -n learn-k8s-deployment-repair get pods
kubectl -n learn-k8s-deployment-repair describe pods -l app=web
kubectl -n learn-k8s-deployment-repair get deployment web -o yaml
```

Pod event'lerinden hangi image'ın çekilemediğini bul. Deployment'ın container template'ini, yeni Pod'lar geçerli bir nginx image'ı kullanacak biçimde düzelt. Container adı `web`.

<details>
<summary>Örnek çözüm</summary>

```sh
kubectl -n learn-k8s-deployment-repair set image deployment/web web=nginx:1.27
kubectl -n learn-k8s-deployment-repair rollout status deployment/web --timeout=120s
```

</details>

## Doğrula ve temizle

```sh
./verify.sh
./cleanup.sh
```

Doğrulama; rollout'un ve istemcinin hazır olmasını bekler, hazır EndpointSlice hedeflerini kontrol eder, ardından istemciden `Service/web` üzerinden `wget` isteği gönderir. Sonuçtaki sistemi kontrol ettiği için Deployment YAML'ını düzenleyip uygulamak da geçerli bir çözümdür. Temizlik, sahiplik etiketini doğruladıktan sonra laboratuvara ayrılan namespace'in tamamını siler.

## Simülatörden gerçek kümeye

| Simülatör | Bu paket |
|---|---|
| Anında controller uzlaşması | Controller'lar eşzamansız çalışır; `rollout status` ile bekle. |
| `lab request web` | `kubectl -n learn-k8s-deployment-repair exec client -- wget -T 10 -qO- http://web:80/` |
| Sentetik `status.ready` / `status.reason` | Pod conditions, containerStatuses ve event'leri incele. |

Gerçek kümede `lab tick` komutu yoktur. Image çekme hatası registry erişiminden de kaynaklanabilir; her hatayı kasıtlı yazım hatasına bağlamadan event mesajını oku.

## Kaynaklar ve doğrulama kapsamı

- [Kubernetes: Deployment ve image güncellemeleri](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes: rolling update ve bulunamayan image teşhisi](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [Kubernetes: Service ve EndpointSlice hata ayıklama](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

Statik repo kontrolleri manifestleri ayrıştırır, shell sözdizimini kontrol eder, namespace sahiplik kontrolünü sahte `kubectl` ile sınar ve arşivlerin yeniden üretilebilirliğini doğrular. Ayrı [Real cluster labs CI iş akışı](https://github.com/Berkopan/learn-k8s/actions/workflows/real-cluster-labs.yml), bu ZIP'i yeni bir kind / Kubernetes v1.35.0 kümesinde açıp bozuk image'ın doğrulamayı geçemediğini kontrol edecek, belgelenen onarımı uygulayacak, HTTP trafiğini doğrulayacak ve temizlik yapacak şekilde yapılandırılmıştır. Kullandığın commit'in iş akışı sonucuna bak; statik kontroller tek başına canlı küme başarısı göstermez. Kendi eğitim kümendeki davranışı `verify.sh` ile doğrula.
