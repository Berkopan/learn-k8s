# learn-k8s

### Kubernetes’i deneyerek öğren.

Önce fikri anla. Komutunu yaz. Kümenin nasıl değiştiğini izle.

**128 interaktif laboratuvar**, ilk container’ından küçük bir platformun arızalarını çözmeye uzanan bir öğrenme yolu sunuyor. Tarayıcını açman yeterli; kurulum veya hesap gerekmiyor.

**[Öğrenmeye başla →](https://berkopan.github.io/learn-k8s/)** · [English](README.md) · [Katkı rehberi](CONTRIBUTING.md)

![Deployment ölçekleme ve gerçek kaynak değişikliklerini inceleme](docs/demo.gif)

## Biraz teori. Bolca pratik.

- **Önce neden, sonra nasıl.** Her seviyede anlaşılır bir anlatım, somut görevler, ipuçları ve komutlarını deneyebileceğin bir terminal var.
- **Komutun etkisini gör.** Pod, controller ve Service ilişkilerini etkileşimli küme görünümünden takip et. YAML düzenle, kaynakların önceki ve sonraki hallerini karşılaştır. Pending Pod’un yerleşim engellerini veya Service’in selector, readiness ve endpoint ilişkisini incele.
- **Kendi hızında ilerle.** Türkçe ve İngilizce dersler, açık/koyu tema, yerel ilerleme kaydı, yer işaretleri ve notlar. Sayfayı yenilediğinde son lab’ına terminal geçmişi ve tamamlanmamış YAML taslaklarıyla dön.

Container, Pod, Deployment, ağ, yapılandırma, depolama, güvenlik, Job, otomatik ölçekleme ve Helm konularını öğren; çok adımlı saha görevleriyle birleştir.

Komutta takıldığında `help`, `help docker` veya `docker run --help` kullan. Komut rehberi ve Tab tamamlama da yanında.

## Rehberli adımların ötesinde

Lab veya sefer haritasındaki **Alıştırmalar** panelinden tekrar önerilerine, üç bağımsız saha senaryosuna ve gerçek küme paketlerine ulaş. Aynı senaryo numarası aynı kaynak isimlerini ve namespace’i üretir; inceleme ve onarım sırasını sen seçersin. İpuçları ve örnek çözümler isteğe bağlıdır; tamamladıktan sonra çözüm değerlendirmesini görebilirsin.

**27, 30 ve 67. lab’larda** canlı durumu düzeltmenin yanında YAML’i düzenleyip kaydetmen gerekir. **37, 56 ve 66. lab’larda** komuttan önce isteğe bağlı tahmin soruları bulunur. Sonraki başarılı tekrarlar çalışma gününü ve yardımsız başarı kaydını günceller; XP yalnız ilk tamamlamada verilir.

Ayrı bir **kind veya minikube** kümesi için [Deployment onarımı](public/labs/deployment-repair.zip), [Service selector](public/labs/service-selector.zip) veya [ConfigMap yenileme](public/labs/configmap-refresh.zip) paketini indir. Her pakette Türkçe/İngilizce yönergeler, başlangıç manifestleri ve gerçek doğrulama/temizlik komutları var. [Paket ayrıntıları ve doğrulama kapsamı](public/labs/README.md).

## Yerelde çalıştır

Node.js **22.12+** kullan.

```sh
npm ci
npm run dev
```

Temel kontroller için `npm test` ve `npm run build` çalıştır. Tarayıcı testleri için [katkı rehberi](CONTRIBUTING.md), kod yapısı için [mimari notları](docs/ARCHITECTURE.md), yayın için [kurulum rehberi](docs/DEPLOYMENT.md) var.

## Birlikte iyileştirelim

Anlaşılmayan bir açıklama, eksik bir komut veya yeni bir laboratuvar fikri mi var? [Issue aç](https://github.com/Berkopan/learn-k8s/issues) ya da pull request gönder. Küçük bir düzeltme, sıradaki kişinin öğrenmesini kolaylaştırır.

[MIT lisanslıdır](LICENSE). Üçüncü taraf bileşenler kendi lisanslarına tabidir; [bildirimlere](THIRD-PARTY-NOTICES.md) bakabilirsin.

<sub>learn-k8s gerçek Kubernetes kümesi veya shell değil, belgelenen komutları modelleyen bir eğitim simülasyonudur. Gerçek image veya altyapı başlatılmaz; gerçek kimlik bilgilerini buraya yapıştırma. [Simülasyon ayrıntıları](docs/SIMULATOR.md).</sub>
