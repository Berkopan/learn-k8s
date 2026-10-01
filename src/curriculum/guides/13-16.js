// Later labs connect earlier concepts to diagnosis, operational decisions and verification.
export default {
  // 13 · Arıza masası
  97: {
    why: 'Bazı uygulamaları kullanıcı yüküne göre değil, her makinenin ihtiyacına göre çalıştırırsın. Örneğin her node’dan log toplayan bir ajan, makine sayısıyla birlikte düşünülmelidir. Replica sayısını elle node sayısına eşitlemek yerine bu ilişkiyi controller’a anlatacağız.',
    how: 'DaemonSet, uygun node’larda birer Pod bulunmasını sağlar. Deployment’taki “toplam şu kadar örnek” hedefinden farklıdır. Gerçekte node etiketleri, toleration ve uyumluluk hangi makinelerin uygun olduğunu belirler. Bu eğitimde iki worker da uygun kabul edilir.',
    practice: 'agent.yaml dosyasını uygula ve geniş Pod listesinde ajanların node dağılımını incele. Toplam iki Pod görmekten fazlasını doğrula: her worker üzerinde bir örnek olmalı. Görev gerçek log toplama süreci çalıştırmaz; node’a bağlı iş yüküyle uygulama replica hedefinin farkını öğretir.'
  },
  98: {
    why: 'Bir arızada ilk gördüğün kısa durum etiketi bütün hikâyeyi anlatmaz. Hemen silip yeniden oluşturmak, sorunun izlerini kaybettirebilir. Bu seviyede değişiklik yapmadan önce olay ve nesne ayrıntılarından kanıt toplamaya odaklanacağız.',
    how: 'Pod STATUS bir özet belirtidir. Events, bileşenlerin kaydettiği olayları; describe ise nesne ayarlarını ve durum ayrıntılarını birlikte gösterir. Image çekme hatası, uygulama koduna henüz ulaşılamamış olabileceğini anlatır. Gerçek Events kalıcı ve eksiksiz denetim günlüğü değildir.',
    practice: 'Önce olayları listele, sonra web Pod’unun ayrıntısında image sorununu bul. Henüz düzeltme yapman istenmiyor. Hangi aşamanın başarısız olduğunu söyleyebilmelisin: yerleştirme mi, paket çekme mi, çalışan uygulama mı? Bu ayrım sonraki müdahaleyi seçmene yardım eder.'
  },
  99: {
    why: 'Yeniden başlayan uygulamanın yeni kaydı, önceki örneğin neden kapandığını göstermeyebilir. Olayın hemen öncesine bakmak gerekir. Bu görevde mevcut durumla önceki container örneğinin bıraktığı izi birlikte okuyacağız.',
    how: '`logs --previous`, önceki sonlandırılmış container örneğinin çıktısını ister. Bu bütün geçmişin arşivi değildir. Describe içindeki restart ve probe bilgileriyle birlikte okununca yeniden başlama nedeni hakkında daha güçlü kanıt sağlar. Burada bilinen problem yanlış liveness yoludur.',
    practice: 'web’in ayrıntılarında restart ve liveness ayarını incele, sonra önceki container logunu aç. İki kaynağın birbirini nasıl tamamladığını düşün. Site sentetik kayıtlar üretir; yalnız bir log satırından her gerçek arızanın nedenini kesinleştiremezsin. Bu görev onarımdan önce teşhis disiplinini çalıştırır.'
  },
  100: {
    why: 'Controller’ın ürettiği her örnekte aynı hata varsa tek tek Pod’ları düzeltmek kalıcı çözüm olmayabilir. Yeni örnekler aynı bozuk tariften gelmeye devam eder. Müdahaleyi tek örneğe mi yoksa onu üreten kaynağa mı yapacağını seçmeyi öğreneceğiz.',
    how: 'web Deployment’ının Pod template’i hatalı image tag’i taşıyor. Image çekilemediği için yeni örnekler hazır olamıyor. Template’teki image düzeltilince controller yeni tariften Pod üretir. Rollout durumu, yalnız alanın değiştiğini değil yeni sürümün hazır hale geldiğini kontrol eder.',
    practice: 'Önce Pod durumlarını gözlemle, ardından Deployment’taki web container’ının image’ını verilen çalışan etikete düzelt ve rollout sonucunu sorgula. Bu senaryoda neden yanlış tag olarak belirlenmiştir. Gerçek ImagePullBackOff durumlarında registry erişimi ve kimlik bilgileri gibi başka nedenleri de araştırmak gerekir.'
  },
  101: {
    why: 'Bir erişim sorunu için Service’in varlığını görmek yeterli değildir. Adres duruyor olabilir ama yönlendirme kuralı artık hiçbir Pod’u seçmiyordur. Bu görevde adresi baştan oluşturmadan bozuk bağlantıyı onaracağız.',
    how: 'web Service’i app=old arıyor, hazır Pod’lar app=web taşıyor. Bu nedenle kullanılabilir endpoint listesi boş. Selector düzeltildiğinde hedefler yeniden hesaplanır; Service’in kararlı adresini değiştirmek gerekmez. Boş hedef listesinin başka olası nedeni readiness olduğu için kanıtı ayarlarla ilişkilendir.',
    practice: 'EndpointSlice YAML’ını okuyarak hedef yokluğunu gör, selector alanını düzelt ve örnek istek gönder. Üç adım sırasıyla belirtiyi, müdahaleyi ve hizmet sonucunu kapsar. Pod’ların sağlıklı olmasıyla Service üzerinden ulaşılabilir olmalarının ayrı kontroller gerektirdiğini pekiştir.'
  },
  102: {
    why: 'Aradığın belgeyi yanlış klasörde bulamaman, belgenin silindiğini göstermez. Küme kaynaklarında da boş listeyi hemen kayıp veya arıza olarak yorumlamamak gerekir. Önce sorgunun doğru kapsamda olduğundan emin olacağız.',
    how: 'Namespace, kaynak adının kapsamını belirler. `-A`, liste sorgusunu bütün namespace’lere genişletir; `-n staging` belirli kapsamı açık seçer. web burada staging içinde bulunur. Aynı isim başka namespace’te farklı bir nesneye ait olabilir.',
    practice: 'Bütün namespace’lerde Pod’ları listeleyerek web’i bul, ardından staging kapsamındaki web’i ayrıntılı incele. Yeni kaynak oluşturmadan veya eskiyi silmeden problemi çözdün: yanlış yere bakıyordun. Geniş gözlem kapsamını, bütün namespace’lerde değişiklik yapma niyetiyle karıştırma.'
  },
  103: {
    why: 'Kümenin toplam kapasitesi yeterli göründüğü halde tek bir iş yerleşemeyebilir. Çünkü bir Pod’un ihtiyacı birden fazla küçük node’a bölünmez. Arızayı çözmek için toplam sayıdan önce tek Pod ile tek node arasındaki uygunluğu değerlendireceğiz.',
    how: 'Bu senaryoda her web örneği 3 CPU istiyor, her worker ise 2 CPU taşıyor. Scheduler hiçbir node’da bu talebi karşılayamıyor. Template düzeltmeden Pod silmek aynı sonucu tekrar üretir. Events, yetersiz kaynakla ilgili yerleştirme kanıtını gösterir.',
    practice: 'Zamanlama olaylarını incele, ardından senaryonun uygun kabul ettiği 500m CPU ve 64Mi bellek request’ine geç. Yeni örneklerin hazır olmasını izle. Bu değer gerçek bir performans ölçümünden elde edilmedi; eğitim varsayımıdır. Gerçek çözüm talebi ölçmek veya kapasite eklemek de olabilir.'
  },
  104: {
    why: 'Uygulama süreci açıkken trafik hâlâ başarısızsa birden fazla katmanı ayırarak düşünmelisin. Bu kontrol noktasında Pod aşaması, hazır hedefler ve HTTP sonucunu birlikte kullanacağız. “Running gördüm, sorun ağda olmalı” kestirmesine dayanmayacağız.',
    how: 'web’in readiness yolu /broken olduğu için Pod’lar çalışsa da normal Service hedefi olamıyor. healthy.yaml doğru / kontrolünü tanımlar. Template güncellendiğinde yeni örnekler hazır hale gelebilir; EndpointSlice ve örnek istek bu değişikliğin erişime yansımasını gösterir.',
    practice: 'Önce EndpointSlice durumunu oku, sonra doğru readiness manifestini uygula ve son olarak web’e örnek istek gönder. Onarımın liveness’ı kaldırmak veya Service’i silmek olmadığını gör. Her sağlık kontrolünün hangi soruya cevap verdiğini doğru seçmek müdahaleyi küçültür.'
  },
  // 14 · Yük ve dayanıklılık
  105: {
    why: 'Bir otele ayrılan oda sayısı ile o anda kullanılan oda sayısı farklıdır. Kaynak yönetiminde de uygulamanın istediği miktarla gerçekten tükettiği miktarı ayırmalısın. Bu görevde yapılandırma yerine kullanım gözlemlerini okuyacağız.',
    how: '`kubectl top`, Pod ve node kullanım ölçümlerini gösterir. Requests ise yerleştirme talebidir; top çıktısının aynısı olmak zorunda değildir. Gerçek kümelerde bu komutlar için Metrics API sağlayıcısı gerekir. Buradaki sağlayıcı kontrollü, sentetik değerler üretir.',
    practice: 'Önce Pod kullanımını, sonra node kullanımını incele. Birinin uygulama örneklerine, diğerinin makine düzeyine baktığını ayırt et. Bu sayılardan gerçek uygulamanın performansını çıkarmıyorsun. Sonraki HPA görevlerinde ölçüm ile otomatik replica hedefi arasındaki ilişkiyi bu modelle deneyimleyeceksin.'
  },
  106: {
    why: 'Kullanıcı yükü değiştikçe örnek sayısını her seferinde elle ayarlamak istemeyebilirsin. Bunun yerine belirli bir ölçümü izleyen ve sınırlar içinde sayı öneren bir denetleyici kullanabilirsin. Otomatik ölçeklemenin hedefini ve sınırlarını açıkça tanımlayacağız.',
    how: 'HorizontalPodAutoscaler, kısaca HPA, metriğe göre iş yükünün replica hedefini değiştirir. CPU utilization, kullanımın CPU request’e oranıdır; node’un toplam CPU yüzdesi değildir. Minimum ve maksimum replica değerleri sonucu sınırlar. HPA yeni node ekleyen bir mekanizma değildir.',
    practice: 'web için en az iki, en çok altı replica ve yüzde 60 CPU hedefi tanımla, sonra HPA YAML’ını incele. Hangi Deployment’a bağlı olduğunu ve sınırlarını bul. Uygulamanın hizmet kalitesini kendiliğinden öğrenen bir sistem değil, seçtiğin metriğe göre çalışan bir kural kuruyorsun.'
  },
  107: {
    why: 'Mevcut örnekler hedeflediğinden daha yüksek yük taşıyorsa işin daha fazla örneğe yayılmasını isteyebilirsin. Otomatik ölçeklemenin temel oranını küçük sayılarla incelemek, yüzdeleri yalnız ezberlemekten daha öğreticidir.',
    how: 'Basit modelde istenen sayı, mevcut replica × gözlenen kullanım / hedef kullanım sonucunun yukarı yuvarlanmasıdır. İki örnek, yüzde 90 kullanım ve yüzde 60 hedef için sonuç üçtür. Gerçek HPA ayrıca tolerans, eksik ölçüm ve zamanlama politikaları uygular; burada temel oran gösterilir.',
    practice: 'Sentetik yükü yüzde 90’a ayarla, ardından lab tick ile HPA döngüsünü ilerlet. Deployment hedefinin ikiden üçe çıkmasını izle. load yalnız ölçümü değiştirir, tick kararın uygulanmasını ilerletir. Bunlar gerçek kubectl komutları veya gerçek trafik yük testi değildir.'
  },
  108: {
    why: 'Düşük yükte örnek sayısını azaltmak kaynak kullanımını düşürebilir, fakat uygulamayı tamamen kapasitesiz bırakmak istemeyebilirsin. Ölçekleme hesabının yanında alt sınırın rolünü göreceğiz. Sınır, oranın önerdiği sayıdan farklı bir sonuç üretebilir.',
    how: 'Dört replica ve yüzde 10 kullanım için yüzde 60 hedefe göre basit hesap bir örnek önerir. Ancak HPA’nın minReplicas:2 değeri sonucu ikiye sınırlar. Gerçek sistemlerde küçülme kararını yavaşlatan stabilization politikaları da olabilir; eğitim modeli bu gecikmeleri çalıştırmaz.',
    practice: 'Hazır dört örnekli web’in sentetik yükünü yüzde 10’a indir ve lab tick ile kararı ilerlet. Son hedefin iki olduğunu gör. Matematiksel öneri ile izin verilen aralık arasındaki farkı anlatabilmelisin. İki örnek kalması, bütün hata senaryolarına dayanıklılığı tek başına sağlamaz.'
  },
  109: {
    why: 'Bir yüzdeyi hesaplamak için neye oranlandığını bilmek gerekir. “Kullanım yüzde kaç?” sorusunun paydası eksikse ölçüm bulunsa bile karar verilemez. Bu görevde otomatik ölçekleme için kaynak talebinin neden gerekli olduğunu göreceğiz.',
    how: 'CPU utilization, kullanımın request’e oranıdır. web container’larında CPU request yokken bu oran hesaplanamaz ve HPA metrik hatası bildirir. Bu, her tür metrik için geçerli aynı eksiklik değildir; doğrudan kullanım miktarını hedeflemek farklı bir metrik yaklaşımıdır.',
    practice: 'Önce lab tick ile eksik request durumunu görünür yap. Ardından container başına 100m CPU ve 64Mi bellek talebi ekle, tekrar tick ile hesaplamayı doğrula. HPA nesnesini silmek yerine eksik girdiyi tamamladın. Hata nedeni ile karar mekanizmasının hangi veriye ihtiyaç duyduğunu ilişkilendir.'
  },
  110: {
    why: 'Bir makineye bakım yapmadan önce oraya yeni işler gelmesini durdurmak isteyebilirsin. Fakat mevcut işleri aynı anda kaldırmak başka bir karardır. Bakımı küçük adımlara ayırmak etkiyi kontrol etmeyi kolaylaştırır.',
    how: '`cordon`, node’u yeni normal Pod yerleştirmelerine kapatır. Mevcut Pod’ları tahliye etmez, node’u kapatmaz ve ağı izole etmez. Node üzerindeki unschedulable alanı bu niyeti gösterir. Kaynakların orada çalışmaya devam etmesi bu komut için beklenen davranıştır.',
    practice: 'worker-1’i yeni yerleştirmelere kapat, sonra Pod’ları geniş listede incele. Node kartında SchedulingDisabled görürken mevcut örneklerin yerinde kaldığını karşılaştır. Bu görev yalnız yeni iş kabulünü durdurur; bir sonraki seviyede mevcut işleri boşaltmanın ayrı işlem olduğunu göreceksin.'
  },
  111: {
    why: 'Bakım için makinenin yalnız yeni iş almaması yetmeyebilir; üzerinde çalışan uygun işlerin de başka yere alınması gerekir. Bunu rastgele Pod silmek yerine kontrollü tahliye akışıyla yapacağız. Diğer makinelerde yeterli kapasite olması önemlidir.',
    how: '`drain`, node’u yeni yerleşime kapatıp uygun Pod’ları tahliye etmeye çalışır. Controller’lar hedef sayıyı korumak için başka uygun node’larda yeni örnekler oluşturabilir. `uncordon`, bakım sonrası yeni yerleşimlere yeniden izin verir; taşınmış Pod’ları otomatik eski yerine döndürmez.',
    practice: 'worker-1’i tahliye et ve iki web örneğinin worker-2 üzerinde hazır olmasını izle. Sonra worker-1’i tekrar aç. Gerçekte drain; kesinti bütçesi, yerel veri veya yönetilmeyen Pod nedeniyle durabilir. Burada kapasitesi yeterli, kontrollü bir eğitim senaryosu var; zorlayıcı silme seçenekleri kullanmıyoruz.'
  },
  112: {
    why: 'Planlı bakım yaparken uygulamanın bütün sağlıklı örneklerini aynı anda kaybetmek istemezsin. Kaç örneğin kullanılabilir kalması gerektiğini bir politika olarak belirtmek, tahliye kararına sınır koyar. Bu bir genel arıza önleme kalkanı değildir.',
    how: 'PodDisruptionBudget, kısaca PDB, gönüllü tahliyelerde kullanılabilirlik bütçesini denetler. minAvailable:1, seçilen grubun en az bir hazır örneğinin korunmasını ister. Doğrudan bütün Pod silmelerini veya beklenmedik node kaybını engellemez. Controller replica hedefini korumaya ayrıca devam eder.',
    practice: 'İki hazır web örneği için budget.yaml politikasını uygula, ardından worker-1’i bütçe içinde tahliye et. Bir örneğin hizmette kalmasıyla eksik örneğin yeniden üretilmesinin farklı sorumluluklar olduğunu düşün. Model sayısal bütçe ve drain ilişkisini öğretir; gerçek eviction sürecinin bütün ayrıntılarını çalıştırmaz.'
  },
  // 15 · Platform araçları
  113: {
    why: 'Birden fazla web uygulamasına alan adı veya URL yolu üzerinden ulaşmak isteyebilirsin. Bu, yalnız bir port açmaktan daha üst düzey yönlendirme kuralıdır. Önce HTTP isteğinin hangi Service’e gideceğini tarif edeceğiz.',
    how: 'Ingress, host ve path kurallarını Service arka uçlarına bağlayan API nesnesidir. Kuralı gerçekten uygulayan ayrı bir Ingress controller gerekir. Bir Ingress nesnesi oluşturmak tek başına proxy, DNS kaydı veya çalışan dış erişim sağlamaz. ingressClassName hangi controller sınıfının hedeflendiğini belirtir.',
    practice: 'demo.local host’unu web Service’inin 80 portuna bağlayan tanımı oluştur ve YAML içindeki kuralı oku. Burada gerçek DNS veya Ingress controller çalışmıyor. Kazanımın host → yol → Service ilişkisinin nerede tanımlandığını anlamak; çalışan internet yayını kurduğunu varsaymamak.'
  },
  114: {
    why: 'HTTPS erişimi için yönlendirme kuralı kadar sertifika bilgisine de ihtiyaç vardır. Ancak bir sertifikaya referans yazmakla geçerli sertifikayı edinmek ve yenilemek farklı işlerdir. Bu seviyede yapılandırma bağlantısını inceleyeceğiz.',
    how: 'Ingress’in TLS bölümü host adlarını sertifika ve özel anahtar içeren Secret referansıyla ilişkilendirir. `secretName` yalnız başvurudur; sertifikayı üretmez. Geçerli Secret, controller ve DNS gibi diğer parçalar olmadan tanım tek başına çalışan HTTPS kurmaz.',
    practice: 'tls-ingress.yaml içindeki hosts, secretName ve backend portunu oku, ardından tanımı uygula. Bu dosya web-tls adına referans verir; görev gerçek sertifika veya Secret oluşturmaz. Özel anahtarlarını bu siteye girme. Burada öğrendiğin şey şifreleme testi değil yapılandırmadaki parçaların ilişkisidir.'
  },
  115: {
    why: 'Uygulama çalışıyor olsa bile herkesin ona bağlanmasını istemeyebilirsin. Önce gelen bağlantıları sınırlandırıp sonra gereken dar yolları açmak anlaşılır bir yaklaşım olabilir. Ağ erişimi ile API yetkilerinin farklı katmanlar olduğunu koruyacağız.',
    how: 'NetworkPolicy, seçilen Pod’lar için izinli bağlantıları tanımlar. İlgili yön için seçici politika yoksa o yön varsayılan olarak izole değildir. web’i seçen ingress politikası ve boş izin listesi, gelen trafik için izolasyon oluşturur. Gerçekte bunu uygulayan uygun ağ eklentisi gerekir.',
    practice: 'deny.yaml politikasını uygula ve isolate-web YAML’ında Pod seçimi ile boş ingress listesini incele. Pod’ların silinmesi veya uygulamanın kapanması beklenmez; bağlantı izni değişir. Model yalnız belirli gelen TCP trafik kurallarını simüle eder, gerçek paket filtresi veya bütün ağ politikasını çalıştırmaz.'
  },
  116: {
    why: 'Her şeyi engellemek işlevi de durdurabilir. Ama çözüm bütün korumayı kaldırmak olmak zorunda değildir; yalnız ihtiyaç duyan istemciye gereken yolu açabilirsin. Bu görevde izolasyonu koruyarak dar bir izin ekleyeceğiz.',
    how: 'NetworkPolicy izinleri birleşir. Varsayılan gelen trafik izolasyonunun yanına app=client etiketli Pod’lardan TCP 80’e izin veren kural eklenebilir. Bu, bütün kaynaklara erişim açmak değildir. Seçicilerin aynı kural içinde veya ayrı öğelerde yazılması kapsamı farklılaştırır.',
    practice: 'allow-client.yaml dosyasını uygula, ardından client içinden web’e örnek istek gönder. İzolasyon politikasını silmeden izin verilen yolun çalıştığını gör. Başarılı tek istek diğer bütün kaynakların engellendiğini kanıtlamaz; gerçek politika testinde izinli ve yasaklı örnekler birlikte denenmelidir.'
  },
  117: {
    why: 'Bir uygulama birkaç Kubernetes nesnesinden oluştuğunda aynı kaynak grubunu farklı ayarlarla tekrar kurmak isteyebilirsin. Bu tanımları parametreli bir paket olarak düşünmek yönetimi kolaylaştırır. Helm’in paket ile kurulu örnek ayrımını tanıyacağız.',
    how: 'Helm chart, Kubernetes kaynak tariflerini ve ayarlanabilir değerleri paketler. Release ise o chart’ın belirli adla kurulmuş örneğidir. Tek release birden fazla kaynak oluşturabilir. Bu laboratuvardaki ./chart sabit eğitim modelidir; gerçek template motoru veya üçüncü taraf paket indirmesi çalışmaz.',
    practice: 'Örnek chart’ı shop release’i adıyla kur, ardından release listesini aç. Deployment ve Service’in birlikte oluşmasını gör. Chart, release ve Pod’un aynı nesne olmadığını ayırt et: biri paket, biri kurulum kaydı, diğeri çalıştırılan uygulama birimidir.'
  },
  118: {
    why: 'Kurulmuş bir paketin yalnız bir ayarını değiştirip geçmişini takip etmek isteyebilirsin. Kaynakları baştan elle yaratmak yerine release’i yeni değerle güncellemek bu niyeti daha açık gösterir. Şimdi replica sayısını paket değerinden değiştireceğiz.',
    how: '`helm upgrade`, release’i yeni chart veya values ile günceller. Bu eğitim chart’ında replicaCount, Deployment örnek sayısını belirler. Değişiklik yeni release revision’ına kaydedilir. Helm sürekli arka planda çalışan bir yakınsama controller’ı değildir; oluşan Deployment’ı kendi controller’ı yönetir.',
    practice: 'Bir replica ile hazır shop release’ini replicaCount=3 değeriyle yükselt ve Helm geçmişini incele. Replica sayısındaki değişimi release revision’ıyla ilişkilendir. Bu anahtar bütün chart’larda aynı olmak zorunda değildir; burada sabit eğitim paketinin sunduğu değeri kullanıyorsun.'
  },
  119: {
    why: 'Paket güncellemesinden sonra önceki yapılandırmaya dönmek gerekebilir. Geçmişteki hedefi tekrar uygulamak, bütün sistemin zamanını geri almak değildir. Geri dönüşün hangi kaynakları ve hangi yan etkileri kapsadığını bilmelisin.',
    how: '`helm rollback`, seçilen release revision’ının yapılandırmasını yeniden hedefler ve yeni bir geçmiş kaydı oluşturur. Deployment rollout undo yalnız Pod template geçmişine odaklanırken Helm release’i chart kapsamındadır. Dış veritabanı veya başka sistemlerdeki yan etkiler otomatik geri alınmaz.',
    practice: 'shop için bir replica isteyen ilk revision’a dön, sonra Helm geçmişini kontrol et. Mevcut üç örnekli hedefin bire dönmesini ve geri dönüşün de yeni revision olarak izlenmesini gör. Bu deney gerçek veri kurtarması değil, sürümlenmiş kurulum ayarının yönetimidir.'
  },
  120: {
    why: 'Bir deneme kurulumunu bitirdiğinde ona ait kaynakları düzenli kaldırmak isteyebilirsin. Fakat “paketi kaldır” demek gerçek ortamda bütün veri ve dış bağımlılıkların güvenle temizlendiği anlamına gelmez. Önce yönetilen kapsamı bilmek gerekir.',
    how: '`helm uninstall`, release’in yönettiği kaynakları kaldırır. Buradaki eğitim chart’ı yalnız Deployment ve Service içerir; Deployment kaldırılınca bağlı Pod’lar da kaybolur. Gerçek chart’larda kalıcı veri, dış kaynaklar veya saklama politikaları ayrıca değerlendirilmelidir.',
    practice: 'shop release’ini kaldır ve Helm listesinin boş olduğunu doğrula. Yönetilen Deployment, Service ve Pod’ların kaybolduğunu gözlemle. Bu seviye veri yedeği almıyor; gerçek disk de çalıştırmıyor. Üretim temizliğinde aynı işlemin öncesinde veri ve bağımlılık kapsamını kontrol etmek gerekir.'
  },
  // 16 · Saha görevleri
  121: {
    why: 'Başarısız bir yayında amaç yalnız hata mesajını kaldırmak değil, uygulamayı tekrar hizmet verebilir duruma getirmektir. Bunu yaparken en küçük anlamlı değişikliği seçmek ve etkisini farklı katmanlarda doğrulamak gerekir. İlk saha görevinde yayın onarımını uçtan uca birleştireceğiz.',
    how: 'web üç replica istiyor ama yanlış image tag’i nedeniyle hiçbir örnek hazır değil. Controller’ın template’indeki image düzeltilince yeni örnekler üretilebilir. Pod listesi kapsamı, rollout durumu yayın sonucunu, Service isteği ise bu modelde erişim yolunu doğrular.',
    practice: 'Pod durumlarını oku, verilen çalışan nginx etiketini Deployment’a geri getir, rollout’u doğrula ve Service’e örnek istek gönder. Her adımın başka bir kanıt sunduğunu düşün. configured cevabı tek başına kullanıcıya yanıt verildiğini göstermez; son kontrolü bu yüzden atlamıyoruz.'
  },
  122: {
    why: 'Bir sorun düzeldikten sonra hizmet hâlâ çalışmıyorsa ilk düzeltmenin yanlış olduğu sonucuna hemen varma. Aynı anda iki ayrı hata bulunabilir. Bu görevde trafik yolunun iki bağımsız koşulunu onararak tek neden arama alışkanlığını sorgulayacağız.',
    how: 'Service yanlış etiketi seçiyor, web Pod’larının readiness kontrolü de yanlış yola bakıyor. Selector doğru olsa bile hazır hedef yoksa normal trafik ilerleyemez. Probe doğru olsa bile Service yanlış grubu seçiyorsa uygulamaya ulaşılmaz. İki koşul birlikte sağlanmalıdır.',
    practice: 'Önce Service selector’ını app=web yap, sonra healthy.yaml ile readiness tanımını düzelt ve en son örnek isteği doğrula. İlk adımın tek başına neden yeterli olmadığını açıklayabilmelisin. Rastgele bütün kaynakları silmek yerine bağımsız arızaları küçük değişikliklerle onarıyorsun.'
  },
  123: {
    why: 'Bir uygulamanın paketi doğru olabilir ama başlangıç malzemeleri eksikse süreç yine hazır olamaz. Birden fazla yapılandırma bağımlılığı bulunduğunda yalnız birini sağlamak yeterli olmayabilir. Bu saha görevinde bağımlılık zincirini tamamlayacağız.',
    how: 'web template’i envFrom ile hem settings ConfigMap’ine hem credentials Secret’ına başvuruyor. Bunlar farklı nesne türleri ve farklı sorumluluklardır. İsim ve namespace referanslarla eşleşmelidir. Gerekli kaynaklar bulunduğunda container başlangıcı ilerleyebilir; rollout kontrolü hazır örnekleri doğrular.',
    practice: 'Önce MODE=production içeren settings kaynağını, sonra yalnız demo-only parolasını taşıyan credentials kaynağını oluştur. Son adımda iki örneğin hazır olduğu rollout sonucunu kontrol et. Gerçek kimlik bilgisi kullanma. Bu onarımda image değiştirmedin; eksik başlangıç bağımlılıklarını tamamladın.'
  },
  124: {
    why: 'Aynı Pending Pod’u tekrar tekrar silmek, onu üreten tarif aynı kaldıkça sorunu çözmeyebilir. Bir operatör olarak belirtinin tekrarını değil nedenini hedeflemelisin. Bu görevde kapasiteyle uyuşmayan kaynak talebini controller düzeyinde düzelteceğiz.',
    how: 'web her örnek için 5 CPU istiyor; eğitim node’ları bunu karşılayamıyor. Yeni Pod üretmek yine aynı büyük talebi getirir. Deployment template’indeki request değiştirilince yeni örnekler uygun koşullarla değerlendirilir. Geniş Pod çıktısı yerleşimin hangi node’larda gerçekleştiğini gösterir.',
    practice: 'Events ile yerleşememe nedenini oku, ardından senaryonun uygun kabul ettiği 250m CPU ve 64Mi bellek talebini tanımla. İki hazır örneğin dağılımını kontrol et. Bu değer eğitim varsayımıdır, gerçek ölçüm sonucu değildir; gerçek ortamda daha büyük node veya yük ölçümü gerekebilir.'
  },
  125: {
    why: 'Uygulama başlamıyor diye ilk olarak image’ı değiştirmek, sorun depolama talebindeyse işe yaramaz. Hazır olmayı engelleyen bağımlılığı bulmak gerekir. Bu görevde Pod ile bekleyen PVC arasındaki ilişkiyi takip edeceğiz.',
    how: 'writer Pod’u data PVC’sini bekliyor; talep var olmayan StorageClass yüzünden Pending. Bu eğitimde henüz bağlı veri yok. Yanlış talep kaldırılıp standard sınıfındaki claim.yaml uygulanınca depolama bağımlılığı çözülebilir. Gerçek kümelerde kullanılan talebin silinmesi koruma mekanizmalarıyla bekleyebilir; bu model o yaşam döngüsünün tamamını taklit etmez.',
    practice: 'Önce PVC ayrıntısında nedeni oku, sonra yalnız bu verisiz eğitim talebini kaldırıp doğru manifestle oluştur. Hem PVC’nin Bound hem writer’ın hazır olduğunu doğrula. Bu senaryodaki silme adımını üretime genelleme; veri taşıyan PVC için yedek, taşıma ve güvenli kullanım planı gerekir.'
  },
  126: {
    why: 'Bir uygulama izin hatası aldığında en geniş rolü vermek hızlı görünse de gereksiz risk oluşturur. Bazen gereken dar izin zaten vardır, yalnız kimliğe bağlanmamıştır. Bu görevde gücü artırmadan eksik ilişkiyi tamamlayacağız.',
    how: 'reader ServiceAccount’ı ve Pod okuma Role’ü hazırdır, fakat aralarında RoleBinding yoktur. Binding eklenince rolün izinleri doğru kimliğe atanır. Sağlıklı doğrulama hem gereken eylemin izinli hem gerekmeyen eylemin izinsiz olduğunu kontrol eder.',
    practice: 'Eksik reader-binding bağlantısını kur. Aynı kimlik için list pods sorusuna yes, delete pods sorusuna no geldiğini doğrula. Böylece yalnız işlevi çalıştırmadın, gereksiz silme yetkisinin verilmediğini de kontrol ettin. Çözüm cluster-admin değil doğru kapsamda dar atamadır.'
  },
  127: {
    why: 'Bağlantı başarısızken Pod ve Service doğru olabilir; kaynak istemci ağ politikasıyla engellenmiş olabilir. Bütün korumayı kaldırmak yerine gerekli yolu açmak daha kontrollü bir onarımdır. Bu saha görevinde işlevi geri getirirken sınırı koruyacağız.',
    how: 'web için gelen trafik izolasyonu vardır. allow-client.yaml, client etiketli Pod’lardan TCP 80’e dar izin ekler. Politikaların izinleri birleştiği için temel izolasyonu silmek gerekmez. API yetkisi ile ağdan uygulamaya bağlanma izni farklı katmanlardır.',
    practice: 'Dar izin politikasını uygula, client içinden örnek isteği gönder ve politika envanterinde isolate-web’in hâlâ bulunduğunu doğrula. Tek başarılı istek diğer kaynakların kesin engellendiğini kanıtlamaz; gerçek testte yasaklı trafik de denenmelidir. Burada onarımın korumayı kaldırmadan yapılmasını öğreniyorsun.'
  },
  128: {
    why: 'Bir platform, birbiriyle ilişkili ama farklı sorumluluklar taşıyan parçalardan oluşur. Ayar, çalışan uygulama, sağlık, erişim, kapasite ve bakım politikasını tek şey gibi düşünürsen hata nedenini bulmak zorlaşır. Finalde bu parçaları kurup aralarındaki bağı görünür sonuçlarla doğrulayacaksın.',
    how: 'ConfigMap ayarı taşır; Deployment üç uygulama örneğini ve readiness kontrolünü yönetir. Service hazır hedeflere erişim sağlar. CPU request, HPA’nın kullanım oranına temel olur; HPA yükten replica hedefi üretir. PDB ise planlı tahliyelerde kullanılabilirlik sınırı belirtir. Bunlar aynı denetleyicinin farklı isimleri değildir.',
    practice: 'Önce settings kaynağını oluştur, sonra platform.yaml dosyasını uygula. Endpoint’leri ve örnek HTTP yanıtını doğrula. Sentetik yükü yüzde 80’e çıkarıp lab tick ile HPA kararını ilerlet: üç örnek ve yüzde 60 hedef için yukarı yuvarlanan sonuç dört olmalı. Her gözlemin hangi parçayı doğruladığını söyle. Burada gerçek ağ, disk veya yük testi çalışmaz; öğrendiğin düşünme biçimini daha sonra izole bir gerçek kümeye taşıyacaksın.'
  }
};
