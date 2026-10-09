# Service selector onarımı

[English](README.md)

Web Pod'ları sağlıklı, fakat Service yanlış etiketleri seçiyor. Pod etiketlerinden EndpointSlice'a, oradan gerçek HTTP isteğine uzanan yolu incele.

## Başlat

Yerel kubeconfig'inde seçili, eğitim için ayırdığın bir küme kullan. `kubectl`, POSIX shell, namespace oluşturma izni ve `nginx:1.27` ile `busybox:1.37` image'larını çekebilme erişimi gerekir.

```sh
kubectl config current-context
./start.sh
```

Script `learn-k8s-service-selector` namespace'ini oluşturur; `starter.yaml` içindeki Deployment, Service ve istemci Pod'unu uygular. Web rollout'u ile istemcinin hazır olmasını bekler. Namespace bu laboratuvara ait sahiplik etiketini taşımıyorsa onu kullanmayı reddeder. Tekrar çalıştırmak alıştırmayı başa döndürür; temizlik de tekrar çalıştırılabilir.

## İncele

```sh
kubectl -n learn-k8s-service-selector get pods --show-labels
kubectl -n learn-k8s-service-selector get service web -o yaml
kubectl -n learn-k8s-service-selector get endpointslices -l kubernetes.io/service-name=web -o yaml
kubectl -n learn-k8s-service-selector exec client -- wget -T 5 -qO- http://web:80/
```

Son komut düzeltmeden önce başarısız olmalıdır. Kümenin ağ uygulamasına göre bağlantı reddedilebilir veya zaman aşımına uğrayabilir. Service selector'ını sağlıklı Pod'ların etiketleriyle karşılaştır. Bir Pod'un Ready olması, bu Service'in ona eriştiği anlamına gelmez.

## Düzelt ve doğrula

Selector'ı düzelt, ardından EndpointSlice'ları yeniden incele.

<details>
<summary>Örnek çözüm</summary>

```sh
kubectl -n learn-k8s-service-selector patch service web --type=merge -p '{"spec":{"selector":{"app":"web"}}}'
```

Alternatif olarak `starter.yaml` içindeki `spec.selector.app` değerini değiştirip dosyayı uygulayabilirsin. Düzenlemeni koruyarak uygulamak için `start.sh` yerine `kubectl apply -f starter.yaml` çalıştır.

</details>

```sh
./verify.sh
./cleanup.sh
```

`verify.sh` rollout'u, Service'in hazır hedeflerini ve küme içinden gelen gerçek HTTP yanıtını kontrol eder. Temizlik, namespace etiketini kontrol ettikten sonra laboratuvara ayrılan namespace'in tamamını siler.

## Simülatörden gerçek kümeye

| Simülatör | Bu paket |
|---|---|
| `lab request web` | `kubectl -n learn-k8s-service-selector exec client -- wget -T 10 -qO- http://web:80/` |
| Anında endpoint güncellemesi | EndpointSlice controller'ı eşzamansız çalışır; henüz güncellenmediyse tekrar incele. |
| Hedef yokken modellenen `503` | Gerçek belirti, Service ağına ve istemciye bağlıdır. |

Dış DNS, Ingress veya load balancer kullanılmaz. İstemci, aynı namespace içindeki `web` adını çözer; Service isteği seçtiği container'ların `http` adlı portuna iletir.

## Kaynaklar ve doğrulama kapsamı

- [Kubernetes: Service, selector ve portlar](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes: EndpointSlice üzerinden Service hata ayıklama](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

Repo kontrolleri manifest yapısını, shell sözdizimini, sahte `kubectl` ile namespace sahiplik kontrollerini ve arşivlerin yeniden üretilebilirliğini kapsar. Bu kontroller paketi canlı bir kümede çalıştırmış değildir. Kümedeki gerçek sonucu `verify.sh` ile doğrula.
