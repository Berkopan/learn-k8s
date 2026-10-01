// Concept → mechanism → observable practice. These are hand-authored, level-specific guides.
export default {
  // 05 · Deployment döngüsü
  33: {
    why: 'Bir uygulamadan iki örnek istediğinde bunları tek tek açıp sürekli kontrol etmek istemezsin. Bir örnek kaybolursa yerine yenisini hazırlayacak bir yöneticiye ihtiyacın vardır. Kubernetes’e yalnız “başlat” değil, “bu sayıyı koru” demeyi öğreneceğiz.',
    how: 'Deployment, Pod’ların üretim tarifini ve istenen replica sayısını saklar. Replica, aynı tariften oluşturulan örnektir. Controller denen denetleyici, mevcut durumla hedefi karşılaştırıp eksikleri tamamlar; scheduler da yeni Pod’lar için uygun node seçer. Hedefi belirtmekle bu hedefin hazır olduğunu görmek farklı aşamalardır.',
    practice: 'web Deployment’ını iki replica isteyecek şekilde oluştur. Bir Deployment’ın altında iki hazır Pod oluşmasını izle. Tek Pod oluşturduğun seviyeden farkını düşün: artık iki nesneyi elle yönetmiyor, iki örnekli durumu koruyacak bir tanım veriyorsun. Bu sayı tek başına bütün arızalara dayanıklılık garantisi değildir.'
  },
  34: {
    why: 'Daha fazla kullanıcıya hizmet vermek için bazen uygulamayı değiştirmek değil, aynı uygulamadan daha fazla örnek çalıştırmak gerekir. Buna yatay ölçekleme denir. Yeni bir sürüm yayımlamakla örnek sayısını artırmayı birbirinden ayıracağız.',
    how: 'Deployment’ın replica sayısını değiştirmek, aynı Pod template’inden kaç örnek istendiğini değiştirir. Image ve uygulama tarifi aynı kalır. Controller eksik örneği oluşturur; zaten çalışan Pod’ları sırf sayı arttı diye yeniden üretmesi gerekmez. Uygulamanın çok örnekle çalışmaya uygunluğu ise ayrı bir konudur.',
    practice: 'İki hazır örneği olan web’i üç replica’ya çıkar. Haritaya üçüncü Pod eklenirken mevcut örneklerin kimliklerini koruduğunu gör. Sonuçta bir Deployment ve üç örnek beklenir. Bu görevde değiştirdiğin şeyin uygulama sürümü değil kapasite hedefi olduğunu açıklayabilmelisin.'
  },
  35: {
    why: 'Bir uygulamayı geçici olarak çalıştırmamak ama kurulum tarifini saklamak isteyebilirsin. Dükkânı kapatıp yerleşim planını korumak gibi, çalışan örneklerle onları yöneten tanımın yaşamını ayırmak faydalıdır. Sıfır örnek de açıkça belirtilmiş bir hedeftir.',
    how: '`replicas: 0`, Deployment’ı silmeden yönettiği Pod sayısını sıfıra indirir. Controller bu kez örnek üretmek yerine fazlalıkları kaldırır. Image seçimi ve Pod template’i Deployment üzerinde kalır; daha sonra sayı artırılabilir. Ancak çalışan örnek kalmadığı için uygulama hizmet veremez.',
    practice: 'web’in replica hedefini sıfır yap. Pod alanı boşalırken Deployment kaydının kaldığını Kaynaklar sekmesinden görebilirsin. “Uygulama tanımını sildim” ile “şimdilik çalışmasını istemiyorum” arasındaki farkı gözlemle. Bu işlemi gerçek ortamda hizmet kesintisi etkisini düşünmeden uygulama.'
  },
  36: {
    why: 'Bir uygulamanın kaç örneği bulunduğu ile bu örneklerin hangi tariften üretildiği iki ayrı sorudur. Sürüm değiştirirken eski ve yeni tarifin örneklerini ayırt etmek gerekir. Deployment’ın bu işi nasıl düzenlediğini anlamak için aradaki yönetim katmanına bakacağız.',
    how: 'ReplicaSet, belirli bir Pod tarifinin örnek sayısını korur. Deployment, farklı template sürümlerini ReplicaSet’lerle yönetir. Sahiplik zinciri Deployment → ReplicaSet → Pod şeklindedir. Böylece yeni sürüm gelirken eski ve yeni örnek grupları ayrı takip edilebilir.',
    practice: 'Hazır web’in ReplicaSet envanterini listele, ardından Deployment ayrıntısını incele. Bunları birbirinden bağımsız uygulamalar sanma; aynı yönetim zincirinin parçalarıdır. Bu seviyede hiçbir sayıyı değiştirmiyorsun. Sonraki güncelleme görevlerinde yeni bir ReplicaSet gördüğünde bunun nedenini açıklayabileceksin.'
  },
  37: {
    why: 'Bir ekipten biri ayrıldığında ekip büyüklüğü hedefi değişmemişse yerine yeni biri alınır. Controller da silinen Pod ile hâlâ geçerli olan örnek sayısı hedefini ayrı değerlendirir. Bu yüzden aynı silme işlemi, bağımsız Pod deneyinden farklı sonuç verecek.',
    how: 'Deployment iki replica istemeye devam ederken Pod’lar silinirse denetleyici eksikliği görüp yeni Pod nesneleri üretir. Bu sürekli karşılaştırma ve düzeltme sürecine reconciliation denir. Silinen nesne geri dirilmez; yeni kimlikli örnekler hedef sayıyı yeniden sağlar.',
    practice: 'Bu izole seviyedeki kontrollü Pod’ları sil ve ardından geniş listeyi aç. Yeni kimliklerle yeniden iki örnek oluşmasını bekle. Deployment hedefini değiştirmediğin için Pod silmek kalıcı bir durdurma yöntemi olmadı. Buradaki --all işlemi gerçek kümelerde geniş etkilidir; eğitim kapsamının dışına düşünmeden taşıma.'
  },
  38: {
    why: 'Yeni uygulama sürümü yayımlarken yalnız örnek sayısını artırmak yetmez; yeni örneklerin farklı bir paketten üretilmesini istersin. Bu değişikliğin hedefe yazılması ile bütün yeni örneklerin hazır olması aynı anlama gelmez. Yayını hem başlatıp hem doğrulayacağız.',
    how: 'Deployment’ın Pod template’indeki image değişirse yeni bir rollout, yani kontrollü güncelleme süreci başlar. Yeni tarif için ReplicaSet ve Pod’lar üretilir. `rollout status` bu geçişin sonucunu sorgular. Sadece replicas alanını değiştirmek ise yeni bir Pod template sürümü oluşturmaz.',
    practice: 'web container’ının image’ını görevdeki yeni etikete geçir, ardından rollout durumunu kontrol et. Eski ve yeni örneklerin ilişkisini haritada izle. Bu model geçişi hızlandırarak gösterir; gerçek yayının sürelerini ve bütün kapasite adımlarını çalıştırmaz. Başarı ölçün yalnız güncelleme mesajı değil hazır yeni örneklerdir.'
  },
  39: {
    why: 'Bir sorun yeni yayından sonra başladıysa önce hangi değişikliklerin yapıldığını bilmek istersin. Sürüm geçmişi, mevcut durumu önceki tariflerle karşılaştırmana yardım eder. Bu görevde değişiklik yapmak kadar onun izini okumaya da odaklanacağız.',
    how: 'Deployment, Pod template değişikliklerini revision denen sürüm kayıtlarıyla takip eder. Image güncellemesi bu tarifi değiştirdiği için geçmişe yansır. Replica sayısını değiştirmek aynı türden bir template değişikliği değildir. Geçmiş sonsuz bir günlük değildir; eski kayıtlar saklama sınırına göre temizlenebilir.',
    practice: 'Önce web image’ını yeni etikete güncelle, sonra rollout geçmişini aç. Önceki ve yeni tarifin farklı revision’larla izlenebildiğini gör. Henüz geri dönüş yapmıyorsun; bir sonraki görevde kullanacağın geçmiş bilgisini okuyorsun. Geçmişi görmek, mevcut yayının sağlığını tek başına doğrulamaz.'
  },
  40: {
    why: 'Yeni bir sürüm çalışmadığında bütün uygulamayı silip baştan kurmak gereksiz risk yaratabilir. Önceki çalışan tarife geri dönmek daha dar bir müdahale olabilir. Bu kontrol noktasında arızayı oluşturacak, etkisini gözleyecek ve geri dönüşü doğrulayacaksın.',
    how: 'Çekilemeyen bir image yeni Pod’ların hazır olmasını engeller. Deployment geçmişindeki önceki template, `rollout undo` ile tekrar hedeflenebilir. Bu yalnız Pod üretim tarifini geri alır; veritabanı değişikliklerini veya dış sistemlerdeki yan etkileri geri sarmaz. Geri dönüş de sonucu kontrol edilmesi gereken bir yayındır.',
    practice: 'Görevdeki bozuk etiketi hedefle, Pod durumlarını incele ve önceki çalışan template’e dön. Son adımda rollout durumunu doğrula. Bilerek oluşturulan arızada hemen toplu temizlik yapmak yerine önce belirtiyi okumayı dene. Amaç komut dizisini ezberlemek değil, küçük bir değişiklikle hizmeti geri getirmeyi öğrenmek.'
  },
  // 06 · Trafiğin yolu
  41: {
    why: 'Uygulamanın örnekleri silinip yeniden oluşabilir. İstemcilerin her yeni Pod IP’sini takip etmesini istemezsin; değişen çalışanların arkasında sabit bir iletişim adresi olmalıdır. Service bu ihtiyacı karşılayan erişim katmanıdır.',
    how: 'Service, label selector ile uygun Pod grubunu seçer ve istemciler için kararlı bir adres sunar. EndpointSlice nesneleri gerçek arka uçları izler. Varsayılan ClusterIP türü küme içi erişim içindir; Service oluşturmak uygulamayı kendiliğinden internete açmaz.',
    practice: 'Hazır web Deployment’ının önüne 80 portunda bir Service oluştur. Service selector’ının web Pod etiketleriyle eşleştiğini ve hazır hedeflerin oluştuğunu gör. Pod isimlerini tek tek Service’e yazmadın; bir etiket grubunu seçtin. Sonraki görevlerde bu bağlantının port ve hedef ayrıntılarını inceleyeceksin.'
  },
  42: {
    why: 'Bir binanın dış kapı numarası ile içeride ulaşmak istediğin oda numarası aynı olmak zorunda değildir. Service üzerinden erişimde de istemcinin kullandığı port ile uygulamanın dinlediği port ayrı olabilir. Bu iki sayıyı karıştırmak erişim hatalarına yol açar.',
    how: 'Service içindeki `port`, istemcinin Service’e bağlandığı porttur. `targetPort`, trafiğin Pod tarafında gönderileceği portu belirtir. Bu örnekte eşleme 8080 → 80 şeklindedir. Manifestte port yazmak, uygulamayı o portta dinlemeye başlatmaz; uygulamanın çalışma ayarı da buna uygun olmalıdır.',
    practice: 'Önce hazır web Service’inin ayrıntısında port eşlemesini oku, sonra Service’in 8080 portuna örnek istek gönder. İsteğin neden doğrudan targetPort’a değil Service portuna gittiğini düşün. `lab request` yalnız bu tarayıcıdaki simüle erişimi sınar; gerçek bir ağ bağlantısı açmaz.'
  },
  43: {
    why: 'Bir çağrı merkezinin telefon numarasının bulunması, cevap verecek çalışan olduğu anlamına gelmez. Service için de adresin varlığı ile arkasında kullanılabilir hedeflerin bulunması farklıdır. Bağlantıyı değerlendirirken bu ikinci katmanı okuyacağız.',
    how: 'EndpointSlice, Service’in arka uç adreslerini ve bunların hazır olma gibi koşullarını taşır. Service selector’ı ilgili Pod’ları seçer; normal trafik yönlendirmesinde hazır olma bilgisi dikkate alınır. Bu eğitim modeli listede hazır hedefleri gösterir; gerçek EndpointSlice nesneleri hazır olmayan uçların koşullarını da taşıyabilir.',
    practice: 'web için endpoint dilimlerini önce listele, sonra YAML ayrıntısını aç. Adresleri hazır Pod sayısıyla karşılaştır. Service var ama kullanılabilir hedef yoksa hangi ek soruları sorman gerektiğini düşün. Görev bir değişiklik yapmıyor; trafik yolunun somut hedeflerini okuyorsun.'
  },
  44: {
    why: 'Bir yönlendirme kuralında yanlış grubu seçersen uygulama sağlıklı olsa bile ona trafik ulaşmaz. Uygulama ve Service’in aynı adı taşıması bu bağlantıyı otomatik kurmaz. Bu görevde hatalı grup seçimini düzelteceğiz.',
    how: 'Service selector’ı, aynı namespace içindeki Pod etiketleriyle eşleşir. Burada Service app=wrong arıyor, Pod’lar ise app=web taşıyor. Selector düzeltilince uygun hedefler yeniden hesaplanır. Service’i silip başka adresle kurmak yerine yalnız yanlış alanı değiştirmek yeterlidir.',
    practice: 'web Service’inin selector’ını doğru Pod etiketine getir, ardından örnek bir istekle sonucu kontrol et. Endpoint sayısının ve yanıtın birlikte düzelmesini gözlemle. Bu senaryoda sorun image veya uygulama kodu değil, mevcut sağlıklı örneklere giden seçim kuralıdır.'
  },
  45: {
    why: 'Küme içinden çalışan bir adrese küme dışından nasıl ulaşılacağı ayrı bir tasarım kararıdır. Service türü, erişim biçiminin bir bölümünü tarif eder. Şimdi ClusterIP’nin yanına node adresi üzerinden erişim modelini ekleyen NodePort’u tanıyacağız.',
    how: 'NodePort Service, Service portuna ek olarak node adreslerindeki ayrılmış bir port üzerinden erişim sağlar. Bu bir HTTP host veya path yönlendirme kuralı değildir; Ingress’ten farklı bir katmandır. Gerçek erişim node ağına, güvenlik duvarına ve kümenin ağ uygulamasına da bağlıdır.',
    practice: 'Hazır web için NodePort türünde Service oluştur ve envanterde türünü doğrula. Bu site tür bilgisini modeller; bilgisayarında veya internette gerçek port açmaz. Kazanımın “Service oluşturmak” ile “hangi yoldan erişim istiyorum?” sorularını birlikte düşünmek olmalıdır.'
  },
  46: {
    why: 'İnsanlar sürekli değişebilen numaralar yerine isimlerle iletişim kurmayı tercih eder. Uygulamalar da Service IP’lerini yapılandırmaya gömmek yerine isim kullanabilir. Ancak bir ismin çözülebilmesi, uygulamanın başarılı yanıt verdiğini tek başına kanıtlamaz.',
    how: 'Kubernetes DNS, Service adını erişim adresine bağlar. Aynı namespace içinde web, namespace belirtilerek web.default gibi adlar kullanılabilir. `exec`, mevcut Pod içinde bir komut çalıştırmayı ifade eder; `--` sonrasında container içindeki komut başlar. DNS sorgusu ile HTTP isteği farklı katmanları sınar.',
    practice: 'client içinden önce web.default adını çöz, ardından web Service’ine HTTP isteği gönder. İlk çıktı isim-adres ilişkisini, ikinci çıktı uygulamaya erişimi gösterir. Model yalnız desteklenen teşhis komutlarını simüle eder; gerçek bir container shell’i veya tam DNS sunucusu çalıştırmaz.'
  },
  47: {
    why: 'Bir uygulamayı kısa süreli incelemek için onu herkesin erişimine açmak istemeyebilirsin. Geliştirme ve teşhis sırasında geçici bir yerel bağlantı yolu işini görebilir. Bu yol kalıcı yayın düzeninden ayrı düşünülmelidir.',
    how: '`port-forward`, yerel bir portu seçilen Pod’un portuna bağlayan geçici tüneldir. Service üzerinden istendiğinde arka uç Pod’lardan biri seçilir. 8080:80 eşlemesinde soldaki yerel, sağdaki hedef porttur. Gerçekte komutu çalıştıran süreç açık kaldığı sürece bağlantı sürer.',
    practice: 'web Service’i için yerel 8080 portundan hedef 80 portuna eşleme oluştur, sonra localhost adresini örnek curl isteğiyle kontrol et. Burada tünel de istek de simüledir; cihazında port dinlenmez. Geçici teşhis erişimi ile üretimde kalıcı trafik yayımlamanın neden ayrı ihtiyaçlar olduğunu düşün.'
  },
  48: {
    why: 'Uygulamanın çalışması, erişim adresinin bulunması ve o adresin gerçekten yanıt vermesi ayrı kanıtlardır. Bu kontrol noktasında onları tek bir akışta birleştireceğiz. Böylece “Pod yeşil, demek ki her şey tamam” varsayımından uzaklaşacağız.',
    how: 'Deployment hazır örnekleri yönetir. Service selector ile bu örnekleri seçer, port eşlemesi isteği doğru hedefe gönderir, EndpointSlice kullanılabilir arka uçları gösterir. Son bir istek ise bu modelde bağlantının birlikte çalıştığını doğrular. Hiçbir tek liste bütün yolu tek başına anlatmaz.',
    practice: 'İki hazır web örneğini 8080 → 80 eşlemesiyle Service arkasına al. Endpoint’leri incele ve web:8080 üzerinden başarılı örnek yanıt al. Bu görev ClusterIP ile küme içi yolu doğrular; dış DNS, TLS veya internet erişimini kurmuş olmuyorsun.'
  },
  // 07 · Ayarlar ve sırlar
  49: {
    why: 'Aynı uygulama paketi deneme ve üretim ortamında farklı ayarlar kullanabilir. Her küçük ayar değişikliğinde image’ı yeniden hazırlamak yerine ayarı paketten ayırmak daha esnek olur. Önce uygulama dışında bir yapılandırma nesnesi oluşturacağız.',
    how: 'ConfigMap, gizli olmayan anahtar-değer ayarlarını saklar. Uygulama bu nesneyi ortam değişkeni veya dosya gibi yollarla tüketebilir. ConfigMap’in var olması tek başına hiçbir çalışan sürecin ayarını değiştirmez; uygulama ile kaynak arasında ayrıca bir referans kurulmalıdır.',
    practice: 'settings adında MODE=production bilgisini taşıyan ConfigMap oluştur. Yeni kaynağın oluştuğunu gör, fakat bunun bir Pod başlatmadığını fark et. Bu görev ayarı saklamakla sınırlı; sonraki seviyelerde içeriğini okuyup uygulamaya bağlayacaksın. Gizli değerler için ConfigMap kullanma.'
  },
  50: {
    why: 'Bir kutunun üzerinde “hızlı mod” yazması, kutuyu okuyan programın bunu nasıl yorumlayacağını söylemez. Yapılandırmadaki anahtarların anlamını uygulama belirler. Kubernetes’in ayarı taşıması ile uygulamanın bu ayara göre davranması arasındaki farkı öğreneceğiz.',
    how: 'ConfigMap’in `data` bölümü metin değerleri taşır. MODE anahtarı Kubernetes için yalnız bir anahtardır; production değerinin davranışını uygulama kodu tanımlar. YAML çıktısı, nesnenin kimliği ile taşıdığı veriyi birlikte görmeyi sağlar. Bu çıktı uygulamanın ayarı tükettiğini kanıtlamaz.',
    practice: 'Hazır settings nesnesini YAML olarak incele ve data bölümünü bul. Nesnenin adı ile uygulama ayarının adını ayır. Şimdilik yalnız okuyorsun. İleride bu değer değiştiğinde tüketim biçiminin neden önemli olduğunu, saklanan veri ile çalışan süreç arasındaki bu ayrımla anlayacaksın.'
  },
  51: {
    why: 'Ayarı ayrı bir yerde sakladın; şimdi uygulamanın onu nereden okuyacağını belirtmen gerekiyor. Bir adres defterindeki kaydı kullanacak kişiye o kaydı göstermek gibi, veri ile tüketici arasında bağlantı kurulmalıdır.',
    how: '`envFrom`, ConfigMap anahtarlarını container ortam değişkenlerine aktarabilen bir referanstır. Deployment’ın Pod template’ine bu bağlantıyı eklemek yeni Pod’lar üreten bir rollout başlatır. Yeni süreçler ayarları başlangıçta alır. Var olan sürecin ortamı ConfigMap değişince kendiliğinden güncellenmez.',
    practice: 'Hazır settings ConfigMap’ini web Deployment’ının ortamına bağla. Template içindeki referansı ve yeni örneklerin oluşmasını gözlemle. Image değişmeden uygulamaya başka bir bilgi kaynağı ekledin. Burada asıl fikir, paketi değiştirmek ile sürecin başlangıç ayarlarını değiştirmeyi ayırmaktır.'
  },
  52: {
    why: 'Bazen tek bir küçük ayarı değiştirmek için ayrı yapılandırma nesnesi oluşturmak gerekmeyebilir. Örneğin teşhis sırasında log ayrıntısını artırmak isteyebilirsin. Bu ayarın uygulama paketinden ayrı tutulduğunu ve yeni süreçlere nasıl geçtiğini göreceğiz.',
    how: 'Container’ın `env` alanı doğrudan ortam değişkenleri tanımlar. Deployment üzerinde bu alanı değiştirmek Pod template’ini değiştirir ve rollout doğurur. Image aynı kalabilir. Uygulamanın LOG_LEVEL değerini gerçekten yorumlayıp yorumlamadığı kendi koduna bağlıdır; Kubernetes bu davranışı uygulama yerine üretmez.',
    practice: 'web için LOG_LEVEL=debug değerini tanımla ve template’in env alanını incele. Yeni örneklerin eski image’ı kullanırken yeni başlangıç ayarına sahip olduğunu ayırt et. Gerçek ortamda debug çıktısının hacim ve gizlilik etkisini düşün; burada yalnız yapılandırma ilişkisinin simülasyonunu yapıyorsun.'
  },
  53: {
    why: 'Her ayarın aynı şekilde ele alınması doğru değildir. Bir görünüm tercihi ile parola farklı erişim ve saklama sorumlulukları taşır. Kubernetes’te hassas yapılandırmayı ayrı bir nesne türüyle ifade ederiz; fakat bu ayrım güvenliğin tamamını otomatik sağlamaz.',
    how: 'Secret, hassas değerler için kullanılan API nesnesidir. Kimlerin okuyabildiği, depolamanın korunması ve değerlerin yenilenmesi ayrıca yönetilir. Secret oluşturmak her ortamda otomatik güçlü şifreleme garantisi değildir. Komut satırına yazılan gerçek değerler shell geçmişi gibi başka yerlere de sızabilir.',
    practice: 'credentials adlı Secret’ı yalnız görevde verilen demo-only değeriyle oluştur. Bu değer gerçek bir parola değildir. Nesne türünün ConfigMap’ten farklı olduğunu gör; henüz uygulamaya bağlantı kurmuyorsun. Bu siteye gerçek parola, token veya şirket kimlik bilgisi girme.'
  },
  54: {
    why: 'Bir metnin ilk bakışta okunamaması, gizli tutulduğu anlamına gelmez. Harfleri başka bir gösterime çevirmek ile anahtar gerektiren şifreleme farklı şeylerdir. Secret çıktısını okurken bu temel ayrımı görmeyi öğreneceğiz.',
    how: 'Secret’ın `data` alanındaki değerler base64 ile kodlanır. Base64, veriyi farklı karakterlerle temsil eder; çözülebilmesi için gizli anahtar gerektirmez. Dolayısıyla Secret YAML’ını okuma yetkisi olan biri içeriği elde edebilir. Güvenlik, yalnız çıktının görünüşünden değil erişim ve saklama kontrollerinden gelir.',
    practice: 'Hazır demo credentials nesnesini YAML olarak aç. data değerinin düz paroladan farklı görünmesini gözlemle, ama bunu şifreleme kanıtı sayma. Görev yalnız eğitim verisi kullanır. Gerçek Secret çıktılarının issue, sohbet veya ekran görüntüsüne paylaşılmaması gerektiğini bu deneyle ilişkilendir.'
  },
  55: {
    why: 'Doğru uygulama paketi elinde olsa bile başlangıçta gereken bir ayar eksikse uygulama açılamayabilir. Bu yüzden her başlamama sorununu image’a bağlamak doğru değildir. Bu görevde eksik bir yapılandırma bağımlılığını yerine koyacağız.',
    how: 'web’in Pod template’i envFrom üzerinden credentials Secret’ına başvuruyor. Nesne bulunamadığında container yapılandırması tamamlanamaz. Referansın adı ve namespace’i önemlidir; başka isimle veya başka kapsamda Secret oluşturmak aynı ihtiyacı karşılamaz. Gerekli kaynak hazır olduğunda başlangıç tekrar ilerleyebilir.',
    practice: 'Önce Pod durumlarını inceleyip yapılandırma sorununu gör. Sonra beklenen credentials Secret’ını sahte eğitim değeriyle oluştur. Image’ı değiştirmeden iki örneğin hazır olmasını izle. Öğrenmen gereken, çalışan sistemin yalnız pakete değil doğru bağlanmış bağımlılıklara da ihtiyaç duyduğudur.'
  },
  56: {
    why: 'Bir çalışan işe başlarken aldığı talimatın kopyasını kullanıyorsa panodaki talimatı değiştirmen onun elindeki kopyayı değiştirmez. Ortam değişkenleri de sürecin başlangıç bilgisi gibi düşünülebilir. Ayarın saklandığı yer ile süreçteki kopyasının yaşamını ayıracağız.',
    how: 'ConfigMap’ten env olarak alınan değer container oluşturulurken okunur. ConfigMap güncellemesi Deployment template’ini kendiliğinden değiştirmez ve mevcut env değerini canlı düzenlemez. Kontrollü rollout restart, yeni süreçlerin güncel ayarı almasını sağlar. Dosya olarak bağlanan ayarların yenilenme davranışı farklıdır.',
    practice: 'settings.yaml ile MODE=maintenance değerini uygula, sonra web için kontrollü yeniden başlatma yap ve rollout sonucunu doğrula. İlk adım veri kaynağını, ikinci adım bu veriyi alacak süreçleri yeniler. Bu iki sorumluluğu tek işlem sanmamak, ayar değişikliklerini güvenilir biçimde yayımlamanı sağlar.'
  },
  // 08 · Yer ve kaynak
  57: {
    why: 'Bir mekânda yer ayırırken kaç kişilik alan gerektiğini söylersin; o anda herkesin gelmiş olması gerekmez. Uygulamanın kaynak talebi de yerleştirme planı için benzer bir bilgi sağlar. Talep edilen kaynakla anlık tüketimi ayıracağız.',
    how: 'CPU ve bellek request değerleri scheduler’ın uygun node ararken kullandığı taleplerdir. 100m CPU, bir CPU’nun onda biridir; 64Mi bellek miktarıdır. Bu değerler uygulamanın her an tam bu kadar kullandığını söylemez ve CPU request tek başına üst tüketim sınırı değildir.',
    practice: 'web için container başına 100m CPU ve 64Mi bellek request tanımla. Template’teki kaynak alanlarını ve node kartındaki ayrılan CPU göstergesini incele. İki replica bulunduğunda her örneğin ayrı talep taşıdığını düşün. Kaynak miktarının hangi birime ait olduğunu okumak, sayı kadar önemlidir.'
  },
  58: {
    why: 'Ortak bir makinede bir uygulamanın bütün kaynakları tüketmesi diğerlerini etkileyebilir. Kaynak talebinin yanında kullanım için bir üst sınır tanımlamak da isteyebilirsin. Ancak sınır aşıldığında CPU ile belleğin aynı şekilde davranacağını varsaymamalısın.',
    how: 'Limit, container’ın kullanımı için tanımlanan üst sınırdır. Request yerleştirme hesabına, limit çalışma sırasındaki sınırlamaya hizmet eder. CPU limitiyle kullanım kısıtlanabilir; bellek sınırı aşıldığında süreç OOM nedeniyle sonlandırılabilir. Bu model kernel seviyesindeki gerçek sınırlamayı çalıştırmaz.',
    practice: 'Hazır web için 1 CPU ve 256Mi bellek limiti belirle. Kaynak ayrıntısında requests ile limits alanlarını yan yana oku. Aynı nesnede bulunmaları aynı soruyu yanıtladıkları anlamına gelmez. Bu görevde uygulamanın performansını ölçmüyor, çalışma sözleşmesinin üst sınırını tanımlıyorsun.'
  },
  59: {
    why: 'Büyük bir eşya iki küçük odaya bölünemiyorsa toplam boş alan yeterli görünse bile onu yerleştiremezsin. Pod da tek bir node’a yerleşir. Uygun makine bulunamadığında image doğru olsa bile uygulama başlamadan bekleyebilir.',
    how: 'Scheduler, Pod’un kaynak taleplerini her uygun node üzerinde değerlendirir. Bu senaryoda her örnek 5 CPU istiyor; eğitim node’larının her biri 2 CPU taşıyor. Hiçbir node tek başına talebi karşılayamadığı için Pod’lar Pending kalır. Events, yerleşememe nedenini görmeye yardım eder.',
    practice: 'Önce zamanlama olaylarını oku, ardından bu senaryo için verilen 500m CPU ve 64Mi bellek talebine düzelt. İki örneğin yerleşip hazır olmasını izle. Gerçek sistemde sırf Pod başlasın diye request küçültme; burada büyük talebin bilinçli bir giriş hatası olduğu varsayılıyor.'
  },
  60: {
    why: 'Bütün makineler aynı özelliklere sahip olmayabilir. Bazıları hızlı disk, bazıları belirli donanım veya konum sunar. İş yükünü uygun makineyle eşleştirebilmek için önce bu özellikleri seçilebilir bir bilgi olarak tanımlamak gerekir.',
    how: 'Node label’ları makinenin özelliklerini anahtar-değer biçiminde ifade eder. disk=ssd etiketi bir seçim kuralında kullanılabilir. Ancak etiketi eklemek donanım kurmaz ve çalışan Pod’ları kendiliğinden taşımaz. Scheduler bu bilgiyi, ilgili bir yerleştirme kısıtı verildiğinde kullanır.',
    practice: 'worker-2 üzerine disk=ssd etiketi ekle ve node metadata’sında yerini gör. Bu görevde yeni Pod oluşturmuyorsun. Bir sonraki seviyede aynı özellik, belirli bir makine grubunu seçmenin koşulu olacak. Etiketin bir beyan olduğunu, gerçek donanımı kendi başına doğrulamadığını unutma.'
  },
  61: {
    why: 'Bir işin belirli donanıma ihtiyacı varsa “herhangi bir makine” yeterli olmayabilir. Gereksinimi açıkça söylemek yanlış yere yerleşmeyi önler; ama uygun makine yoksa beklemek zorunda kalırsın. Şimdi bir node özelliğini zorunlu seçim koşuluna çevireceğiz.',
    how: '`nodeSelector`, Pod’un yalnız eşleşen node etiketlerine sahip makinelerde çalışmasını ister. Bu yumuşak bir tercih değil, yerleştirme koşuludur. ssd.yaml disk=ssd arar. Etiket eşleşse bile kapasite ve diğer kısıtlar da uygun olmalıdır.',
    practice: 'Önce worker-2’ye SSD etiketini ver, sonra hazır ssd.yaml dosyasını uygula. fast Pod’unun worker-2’ye atandığını kontrol et. İki adımın neden ayrı olduğunu düşün: biri makineyi tanımlar, diğeri işin gereksinimini. Manifest diski oluşturmaz, uygun makineyi seçer.'
  },
  62: {
    why: 'Özel bir makineyi sıradan işlerin doldurmasını istemeyebilirsin. Kapısına “yalnız uygun işler” kuralı koymak, Pod’un belirli makineyi seçmesinden farklı bir mekanizmadır. Taint bu itme tarafını, toleration ise istisna tarafını anlatır.',
    how: 'Node üzerindeki taint, eşleşen toleration’ı olmayan Pod’ları belirli şekilde etkiler. `NoSchedule`, yeni yerleştirmeleri engeller; mevcut çalışan Pod’ları tahliye etmez. dedicated=gpu ifadesi burada bir seçim işaretidir, node’a GPU donanımı eklemez. Başka taint etkileri farklı davranır.',
    practice: 'worker-1 için dedicated=gpu:NoSchedule kuralını tanımla. Node ayrıntısında taint’in görünmesini doğrula. Bu seviyede yeni iş başlatman veya mevcut Pod silmen gerekmiyor. Sonraki görevde bir Pod’un bu engelden nasıl muaf tutulduğunu, yer seçimiyle karıştırmadan inceleyeceksin.'
  },
  63: {
    why: 'Bir odaya giriş iznin olması mutlaka o odaya gitmen gerektiği anlamına gelmez. Yerleştirmede toleration ile node seçimi arasındaki fark da budur. Bir engeli aşabilmek ve hedef makineyi belirlemek ayrı koşullardır.',
    how: 'Toleration, eşleşen taint’in Pod’u elemesini önler; tek başına o node’u seçmez. gpu.yaml hem dedicated=gpu toleration’ı hem worker-1 hostname selector’ı içerir. Böylece Pod özel kurala tolerans gösterirken hedef node da açıkça seçilmiş olur. Kapasite koşulları yine geçerlidir.',
    practice: 'Önce worker-1 üzerinde özel yerleştirme kuralını oluştur, ardından gpu.yaml dosyasını uygula. gpu-task Pod’unun worker-1’de hazır olmasını izle. Dosyadaki toleration ve nodeSelector alanlarının farklı sorumluluklarını ayırt et; yalnız birinin bulunması aynı sonucu garanti etmez.'
  },
  64: {
    why: 'Ortak bir kümede bir ekibin sınırsız kaynak oluşturmasını istemeyebilirsin. Makinenin fiziksel kapasitesi ile bir ekibe tanınan bütçe aynı şey değildir. Bu kontrol noktasında belirli çalışma alanı için nesne sayısı sınırı koyacağız.',
    how: 'ResourceQuota, namespace içindeki kaynak miktarı veya nesne sayısı için sınırlar tanımlar. Buradaki `hard.pods: 4`, o kapsamda en fazla dört Pod nesnesine izin veren bütçedir. Bu yeni node kapasitesi oluşturmaz ve mevcut Pod’ların CPU taleplerini yeniden boyutlandırmaz.',
    practice: 'quota.yaml dosyasını uygula ve team-budget ayrıntısında dört Pod sınırını incele. Görev sınırı tanımlayıp okumaya odaklanır; bilerek beşinci Pod oluşturmuyorsun. Kaynak kotasının namespace politikasını, request’in ise yerleştirme talebini ifade ettiğini birlikte düşün.'
  }
};
