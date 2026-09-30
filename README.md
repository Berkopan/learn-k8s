# learn-k8s · Küme Seferleri

**Kubernetes’i okuyarak değil, okuyup deneyerek öğren.**

128 interaktif laboratuvar; kısa saha notları, görev odaklı bir terminal ve komutlarla değişen küme görselleştirmesi. Image ile container farkından çok adımlı operasyon senaryolarına kadar, kurulum yapmadan bir öğrenme yolu.

**Bu uygulama gerçek Kubernetes çalıştırmaz.** Tamamen statik bir React uygulamasıdır. Kubernetes, Docker ve Helm komutlarının desteklenen alt kümesi tarayıcı belleğindeki bir modeli değiştirir. Hesap, cloud kredisi, Docker daemon veya backend gerekmez.

## Sefer haritası ve laboratuvar

Ana sayfa dört aşamaya ayrılan bir öğrenme atlasıdır. On altı bölüm, sekiz duraklı devam rotası ve seyir defteri; sıradaki konuyu, tamamlanan seviyeleri, XP’yi ve kazanılan rozetleri gösterir. Laboratuvarda saha notları ve görev günlüğü, küme şeması ve terminalin yanında yer alır.

**Karanlık, aydınlık ve sistem temaları** üst çubuktan seçilir. Gece lacivert/pirinç, gündüz parşömen/bakır paleti kullanılır. Terminal, YAML editörü, kaynak şemaları ve bütün diyaloglar temaya uyum sağlar. Tercih sonraki ziyaret için saklanır; sistem modu işletim sistemindeki değişiklikleri izler.

Tema değiştirirken veya sefer haritasına gidip aynı laboratuvara dönerken komut taslağı, kaynaklar ve kaydedilmemiş YAML korunur. Mobil görünümde **Terminale geç** bağlantısı komut alanına doğrudan götürür. Tasarım kararları ve doğrulama planı: [docs/DESIGN.md](docs/DESIGN.md).

## Neler var?

- **16 modül × 8 seviye = 128 laboratuvar.** Her seviyede özgün kavram anlatımı, deneyin mekanizması, gerçek küme uyarısı, görevler, ipuçları, çözüm ve resmî kaynak bağlantısı.
- **Durum temelli görevler.** Sadece beklenen komut metnine bakılmaz: kaynak, replica, readiness, endpoint, yetki veya gereken gözlem sonucuna bakılır.
- **Etkileşimli küme.** Control plane, node’lar, Pod’lar, Service hedefleri ve ilişkili kaynaklar. Nesneye tıkla, YAML ayrıntısını incele; API → controller → scheduler akışını adım adım izle.
- **Terminal araçları.** Komut geçmişi, yukarı/aşağı ok, Tab tamamlama, `Ctrl+L`, hata mesajları, kaynak alias’ları, namespace seçimi, tırnaklı parametreler ve JSON merge patch.
- **Manifest atölyesi.** Çok belgeli YAML, doğrulama, düzenleme, yeni dosya, manifest indirme. Kaydetme ile `apply` ayrı eylemlerdir.
- **Öğrenme kaydı.** Tek seferlik XP, 16 modül rozeti, günlük seri, 16 isteğe bağlı kavram kontrolü, yer işaretleri ve seviyeye özel notlar.
- **Başvuru araçları.** 48 kavramlık sözlük, komut cep rehberi, aranabilir ders kataloğu, rehberli ilerleme ve serbest keşif.
- **Cihazlar arası aktarım.** Yerel ilerlemeyi JSON olarak dışa/içe aktar. Varsayılan sessiz; azaltılmış hareket desteği; masaüstü ve mobil düzen.

Arayüz Türkçedir; gerçek araç adları ve komut sözdizimi korunur. Tasarım, [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) etkileşim bileşenleri üzerine özel CSS ile kurulmuştur. Harici font, analiz takibi veya uzaktan çalışan terminal yoktur.

## Öğrenme yolu

| Modül | Seviyeler | Odak |
|---|---:|---|
| Container temelleri | 001–008 | Image, registry, container yaşam döngüsü |
| Kümenin pusulası | 009–016 | Control plane, node, context, namespace, API |
| Pod atölyesi | 017–024 | Pod, etiketler, metadata, ilk hata düzeltmesi |
| YAML ile düşünmek | 025–032 | Bildirimsel durum, apply, diff, idempotency |
| Deployment döngüsü | 033–040 | Replica, controller, rollout ve undo |
| Trafiğin yolu | 041–048 | Service, EndpointSlice, DNS, port-forward |
| Ayarlar ve sırlar | 049–056 | ConfigMap, Secret, environment, yeniden başlatma |
| Yer ve kaynak | 057–064 | Request, limit, nodeSelector, taint, quota |
| Sağlık sinyalleri | 065–072 | Readiness, liveness, startup, init, wait |
| Verinin ömrü | 073–080 | emptyDir, PVC/PV, StorageClass, StatefulSet |
| En az yetki | 081–088 | ServiceAccount, Role/Binding, security context |
| Tamamlanan işler | 089–096 | Job, paralellik, CronJob, askıya alma |
| Arıza masası | 097–104 | DaemonSet, Events, loglar, çok katmanlı teşhis |
| Yük ve dayanıklılık | 105–112 | HPA, kapasite, cordon, drain, PDB |
| Platform araçları | 113–120 | Ingress/TLS tanımları, NetworkPolicy, Helm |
| Saha görevleri | 121–128 | Çok adımlı onarım ve platform finali |

## Yerel geliştirme

Node.js **22.12 veya üzeri** kullanılır.

```sh
npm install
npm run dev
```

```sh
npm test          # Motor + 128 senaryo + ilerleme + tema regresyonları
npm run build    # GitHub Pages dahil statik sunucuya uygun dist/
npm run preview
npx playwright install chromium
npm run test:e2e  # Görevler, iki tema, YAML, klavye ve responsive kontrolleri
```

Tarayıcı testleri üretim derlemesini kullanır; önce `npm run build` çalıştır. `Test and inspect` GitHub Actions akışı derlemeyi ve tarayıcı kontrollerini birlikte çalıştırır. Testler tüm 128 seviyenin tamamlanmasını, iki palette erişilebilirlik/kontrast kontrollerini, tema kalıcılığını, sistem tercihini ve taslakların korunmasını kapsar. Ekran görüntüleri, izler, JSON özeti ve derleme `browser-evidence` artefaktında saklanır. Yayın ayrıntıları: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Dürüst sınırlar

Bu bir kubectl uyumluluk katmanı veya Kubernetes sertifikasyon ortamı değildir. Görsel sınır **12 replica**, iki node ve 25 düzenlenebilir lab dosyasıdır; bunlar Kubernetes sınırları değildir. Controller’lar çoğunlukla komut sonunda yakınsar. `lab tick` Job/init/HPA deneyleri için mantıksal bir adımdır, gerçek zaman değildir.

Rollout surge politikaları, disk içeriği, gerçek probe zamanlaması, CPU throttling, OOM, CRI/CNI/CSI, TLS el sıkışması, gerçek Helm template motoru ve harici ağ çalışmaz. NetworkPolicy ve RBAC’nin yalnız belgelenen alt kümesi modellenir. Bilinmeyen komutlar başarılıymış gibi gösterilmez. Ayrıntılı sözleşme: [docs/SIMULATOR.md](docs/SIMULATOR.md).

**Gerçek parola, Secret, kubeconfig veya şirket manifestlerini buraya yapıştırma.** İlerleme tarayıcı `localStorage` alanında saklanır; buluta senkronize edilmez. Terminal oturumları yenilemede sıfırlanır; kazanılmış XP, rozet, not ve yer işaretleri korunur.

## Kaynaklar ve katkı

Müfredatın her seviyesinde birincil kaynak bağlantısı bulunur: [Kubernetes dokümantasyonu](https://kubernetes.io/docs/), [Docker kavramları](https://docs.docker.com/get-started/docker-concepts/) ve [Helm rehberi](https://helm.sh/docs/intro/using_helm/). Metinler bu proje için hazırlanmış öğretici özetlerdir; resmî sertifika içeriği değildir.

Yeni senaryo eklemek veya bir model davranışını düzeltmek için [CONTRIBUTING.md](CONTRIBUTING.md) ve [mimari notları](docs/ARCHITECTURE.md) incele.

---

**English:** A browser-only Kubernetes learning workbench with 128 guided labs, a maritime learning atlas, persistent light/dark/system themes, a stateful simulated terminal, animated cluster topology, editable YAML, and local learning progress. The interface and course are in Turkish. No real Kubernetes cluster or shell is started.
