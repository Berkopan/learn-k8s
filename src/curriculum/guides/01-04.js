// Teaching narratives, not solutions. IDs follow the stable curriculum/progress IDs.
// Keep the existing short concept summaries for search; these paragraphs teach the lab.
export default {
  // 01 · Container temelleri
  1: {
    why: 'Bir uygulamayı başka bilgisayarda çalıştırırken yalnızca kodu kopyalamak yetmeyebilir: gereken dosyalar ve bağımlılıklar da yanında olmalıdır. Bunları taşınabilir bir paket gibi düşün. Paketin elinde olması, uygulamanın şu anda çalıştığı anlamına gelmez; önce bu iki fikri ayıracağız.',
    how: 'Bu pakete image denir. Image, uygulama dosyalarını ve başlatma bilgisini taşıyan salt okunur bir şablondur. Registry ise bu şablonların deposudur. `nginx:1.27` içindeki nginx paket adını, 1.27 ise seçtiğin etiketi belirtir. `pull` paketi yerel image deposuna getirir; henüz çalışan bir container oluşturmaz.',
    practice: 'Önce nginx paketini yerel depoya al, sonra image envanterini incele. Sağdaki yerel depo dolarken container alanının boş kaldığına dikkat et. Bu seviyenin sonunda “uygulama paketi hazır” diyebilmelisin; “web sunucusu çalışıyor” demek için bir sonraki adıma ihtiyacın var.'
  },
  2: {
    why: 'Hazır bir yemek tarifi ile o tarife göre pişen yemek aynı şey değildir. Image da çalıştırılacak uygulamanın tarifini ve malzemelerini taşır; şimdi bu paketten yaşayan bir örnek oluşturacağız. Böylece saklanan dosyalar ile çalışan süreç arasındaki fark görünür olacak.',
    how: 'Container, image’dan başlatılan ve kendi yaşam döngüsü olan bir süreç grubudur. `run` yeni örneği oluşturup başlatır; image yerelde yoksa önce alınabilir. `--name` örneğe takip edilebilir bir ad verir, `-d` ise arka planda çalışmasını ister. Container’ın adı ile kullandığı image referansı farklı bilgilerdir.',
    practice: 'web adlı örneği nginx image’ından başlat. Sağdaki container alanında web kaydını ve Running durumunu görmelisin. Image deposu hâlâ paketi gösterir; yeni kutu o paketin çalışan örneğidir. Aynı paketi daha sonra tekrar kullanabileceğini aklında tut.'
  },
  3: {
    why: 'Bilgisayarında bir programın kurulu olması ile şu anda açık olması farklı sorulardır. Container dünyasında da “hangi paketler var?” ve “hangi örnekler çalışıyor?” için ayrı envanterler kullanılır. Doğru soruyu sormak, yanlış tabloya bakıp hatalı sonuca varmaktan korur.',
    how: '`docker images` image referanslarını, `docker ps` çalışan container’ları listeler. Liste bir özet verir; tek bir örneğin ayrıntısı için `inspect` kullanılır. Container adı, image bilgisi ve çalışma durumu birlikte okununca bir örneğin hangi paketten üretildiğini anlayabilirsin.',
    practice: 'Bu seviye çalışan web örneğiyle hazır başlar. Önce çalışanları listele, sonra web’in ayrıntısında kullandığı image’ı bul. Yeni bir örnek başlatmana gerek yok. Amacın sistemi değiştirmek değil, paket ile süreç arasındaki bağlantıyı mevcut durumdan okuyabilmek.'
  },
  4: {
    why: 'Bir uygulamanın açık olduğunu görmek, içeride neler yaptığını anlatmaz. Başlangıçta ne olduğu, bir isteğin gelip gelmediği veya hata oluşup oluşmadığı için uygulamanın bıraktığı izlere ihtiyaç duyarız. Log okumak, sorun giderirken değişiklik yapmadan kanıt toplamanın ilk yollarından biridir.',
    how: 'Uygulamalar standart çıktı ve hata akışlarına, yani stdout ve stderr’e, mesaj yazabilir. Container runtime bu akışları log olarak sunar. `logs` uygulamanın bu mesajlarını okur; container’ı yeniden başlatmaz veya image’ı değiştirmez. Loglarda yalnız hatalar değil normal çalışma kayıtları da bulunabilir.',
    practice: 'Hazır web container’ının loglarını aç. Çıktıda uygulamanın anlattığı olayları okumaya çalış; Running etiketi ile log içeriğinin farklı bilgiler sunduğunu gör. Buradaki kayıtlar sentetiktir. İleride aynı gözlem alışkanlığını Kubernetes Pod’larında da kullanacaksın.'
  },
  5: {
    why: 'Aynı uygulamanın iki bağımsız örneğine ihtiyaç duyabilirsin: biriyle deneme yaparken diğeri çalışmaya devam etsin veya işi birden çok örneğe dağıt. Bunun için uygulama paketini her seferinde yeniden hazırlamak gerekmez. Tek bir şablondan birden fazla örnek üretilebilir.',
    how: 'Image tekrar kullanılabilir; container ise kendine ait adı ve çalışma durumu olan örnektir. İki container aynı image referansını kullanabilir, fakat birini durdurmak diğerini otomatik durdurmaz. Paket sayısı ile çalışan örnek sayısı bu yüzden eşit olmak zorunda değildir.',
    practice: 'Hazır web örneğinin yanına web-copy adlı ikinci örneği ekle ve çalışanları listele. Container alanında iki kayıt, image deposunda tek nginx referansı görmelisin. Burada port yayımlamıyoruz; denemenin odağı ağ erişimi değil, aynı paketten bağımsız örnekler üretmek.'
  },
  6: {
    why: 'Bir dosyaya başka bir isimle işaret etmek, dosyanın içeriğini yeniden yazmak değildir. Image etiketlerini de bu ayrımla düşün: insanlar için okunabilir isimler sağlarlar. Etiket değiştirmekle uygulamayı derlemek veya yeni bir süreç başlatmak arasındaki farkı öğreneceğiz.',
    how: 'Tag, image’a verilen okunabilir bir referanstır. Mevcut nginx image’ına `local/web:v1` adını eklemek aynı içeriğe ikinci bir isim verir. `tag` yeni container oluşturmaz. Etiketler yeniden atanabildiği için bir etiketin aynı kalması içeriğin sonsuza kadar aynı kalacağını garanti etmez.',
    practice: 'Yerelde hazır olan nginx image’ına istenen yeni etiketi ver. Depoda iki image referansı görünürken container sayısının artmadığına dikkat et. Kazanımın yeni bir adın, yeni bir içerik veya çalışan uygulama anlamına gelmediğini ayırt edebilmek.'
  },
  7: {
    why: 'Bir uygulamayı kapatmak ile onu bilgisayardan kaldırmak farklı işlemlerdir. Container’ı durdurduğunda da çalışan süreç sona erer ama örneğin kaydı hemen kaybolmaz. Bu ayrım, kaynak temizlerken neyin hâlâ var olduğunu anlamanı sağlar.',
    how: '`stop`, çalışan container’ı durmuş duruma geçirir. Normal `ps` listesi yalnız çalışanları gösterdiği için web artık orada görünmez; `--all` durmuş kayıtları da kapsar. Image deposu ise bu yaşam döngüsünden ayrıdır. Container’ın durması paketin silindiği anlamına gelmez.',
    practice: 'Önce web’i durdur, sonra durmuş örnekleri de içeren listeyi aç. Beklenen durum Exited kaydını görebilmendir; container tamamen yok olmamalı. Sağdaki image ve container alanlarını karşılaştırarak “çalışmıyor”, “yok” ve “paketi yok” ifadelerinin farklılığını pekiştir.'
  },
  8: {
    why: 'Bir denemeyi bitirdiğinde yalnız uygulamayı kapatmak yeterli olmayabilir; artık gerekmeyen örneğin kaydını da temizlemek isteyebilirsin. Bunu paketi koruyarak yapmak, daha sonra yeniden başlama olanağı bırakır. İlk modülde öğrendiğin yaşam döngüsünü şimdi birlikte uygulayacaksın.',
    how: 'Çalışan container önce durdurulur, sonra container kaydı kaldırılır. `stop` ile `rm` bu yüzden aynı işlem değildir. Container silinse de onu oluşturmakta kullandığın image ayrı envanterde kalır. Yeniden çalıştırmak gerektiğinde bu image’dan yeni bir örnek oluşturabilirsin.',
    practice: 'web sürecini durdur, durmuş web kaydını sil ve image listesini kontrol et. Container alanı boşalmalı, nginx paketi yerelde kalmalıdır. İşlem sırasını sadece ezberleme: her adımda paketi mi, örneğin çalışmasını mı, yoksa örneğin varlığını mı değiştirdiğini söyleyebilmelisin.'
  },
  // 02 · Kümenin pusulası
  9: {
    why: 'Birden çok makineye iş dağıtırken her makineye tek tek bağlanmak zorlaşır. Kubernetes’te isteğini ortak bir yönetim kapısına iletirsin; sistem bu isteğin makinelere nasıl yansıyacağını koordine eder. Önce komutun hangi kapıya gittiğini tanıyacağız.',
    how: '`kubectl` senin kullandığın istemcidir, API server ise kümenin istek kabul eden bileşenidir. Control plane denen yönetim katmanında küme durumu saklanır ve bu durumu gerçekleştiren denetleyiciler çalışır. Bir kubectl komutu, doğrudan node üzerinde açılmış bir shell oturumu değildir.',
    practice: 'Küme bağlantı özetini aç, ardından istemci ve sunucu sürümlerini incele. Çıktıdaki iki tarafın farklı sorumluluklarını ayır. Bu seviyede iş yükü oluşturmayacaksın; amaç, sonraki komutların konuşacağı yönetim katmanını tanımak. Gösterilen adresler gerçek bağlantı kurmaz.'
  },
  10: {
    why: 'Yönetim katmanı plan yapar, fakat uygulamaların gerçekten çalışacağı makinelere de ihtiyaç vardır. Bir atölyedeki iş istasyonları gibi düşünebileceğin bu makinelerin kullanılabilir olması, iş yüklerini yerleştirmenin temel koşullarından biridir.',
    how: 'Pod çalıştıran fiziksel veya sanal makineye node denir. Node üzerindeki kubelet, kendisine atanmış Pod’ların yaşamını izler; container runtime süreçleri çalıştırır. Node’un Ready olması, makinenin küme açısından kullanılabilir olduğunu anlatır. Üzerindeki her uygulamanın sağlıklı olduğu anlamına gelmez.',
    practice: 'Bu laboratuvarın iki worker node’unu listele ve durum sütununu oku. Sağdaki node kutularıyla listedeki isimleri eşleştir. Henüz Pod oluşturmadan, uygulamaların nereye yerleşebileceğini görmüş olacaksın. Node sağlığı ile uygulama sağlığını ayrı sorular olarak tut.'
  },
  11: {
    why: 'Yeni bir işi bir makineye yerleştirmeden önce o makinenin ne kadar kapasitesi olduğunu bilmek gerekir. Bir otobüsün boş koltuklarını bilmeden yolcu dağıtamamak gibi, işlemci ve bellek talepleri de uygun makine seçiminde önemlidir.',
    how: 'Node ayrıntıları CPU, bellek, etiketler ve sağlık koşulları gibi bilgileri gösterir. Scheduler denen yerleştirme bileşeni, iş yüklerinin kaynak taleplerini uygun node’larla eşleştirir. Bu eğitimde her worker 2 CPU ve 2 GiB bellek taşır; bunlar uygulamanın anlık tüketimi değil kapasite bilgileridir.',
    practice: 'worker-1 için özet listenin ötesine geçip ayrıntıları aç. Kapasite, etiket ve Ready bilgisini bulmaya çalış. Şimdilik değerleri değiştirmiyorsun; ileride bir Pod yerleşemediğinde bakacağın makine özelliklerini tanıyorsun. Gerçek kümelerde kapasitenin tamamı uygulamalara ayrılmayabilir.'
  },
  12: {
    why: 'Doğru komutu yanlış ortama göndermek de hatadır. Deneme ortamında yaptığını sandığın bir silme işleminin başka kümeyi etkilemesini istemezsin. Bu yüzden herhangi bir değişiklikten önce “şu anda nereye, hangi kimlikle bakıyorum?” sorusunu sormayı alışkanlık yapacağız.',
    how: 'Context, küme bağlantısını, kullanılacak kimliği ve varsayılan namespace seçimini bir araya getiren bağlantı profilidir. `current-context` etkin profili, `get-contexts` tanımlı profilleri gösterir. Aynı kubectl komutu başka bir context seçildiğinde farklı kaynakları hedefleyebilir.',
    practice: 'Önce etkin context’i, ardından mevcut context listesini incele. Bu görev bir geçiş yapmanı değil mevcut seçimi doğrulamanı istiyor. Eğitimde learning ve staging aynı simüle kümeyi farklı varsayılan namespace’lerle kullanır; isimlerinden ayrı gerçek kümeler oldukları sonucunu çıkarma.'
  },
  13: {
    why: 'Aynı binada farklı ekiplerin ayrı çalışma odaları olması, eşyaların kime ait olduğunu düzenlemeyi kolaylaştırır. Kubernetes’te de kaynakları isim kapsamlarına ayırabiliriz. Bu düzenleme, her ekip için ayrı fiziksel makineler oluşturmak anlamına gelmez.',
    how: 'Namespace, birçok kaynak türünün isim alanını ayırır. Farklı namespace’lerde aynı isimli Pod bulunabilir. Buna karşılık node gibi küme kapsamlı nesneler bir namespace’in içine girmez. Namespace oluşturmak tek başına ağ trafiğini veya bütün erişim yetkilerini izole etmez.',
    practice: 'team-a adında yeni bir çalışma alanı oluştur ve namespace listesinde yerini doğrula. Sağdaki node’ların çoğalmadığını gör: bir makine değil, mantıksal ad kapsamı ekledin. Bu ayrım daha sonra farklı ekiplerin kaynaklarını doğru yerde aramanı sağlayacak.'
  },
  14: {
    why: 'Aynı isimli iki kişinin farklı ekiplerde çalışması gibi, aynı kaynak adı da farklı namespace’lerde bulunabilir. Yalnız adı bilmek doğru kaynağa baktığını garanti etmez. Oluşturma ve gözlem komutlarında kapsamı birlikte düşünmeyi öğreneceğiz.',
    how: '`-n` seçeneği o komutun namespace’ini belirler. staging içindeki web ile default içindeki web farklı nesnelerdir. Kaynağı staging içinde oluşturup default içinde ararsan boş sonuç alabilirsin; bu sonuç, oluşturma işleminin başarısız olduğunu tek başına göstermez.',
    practice: 'web Pod’unu staging içinde başlat, ardından yine staging kapsamındaki Pod’ları listele. Her iki adımda aynı namespace’i hedeflediğini kontrol et. Sonuçta öğrenmen gereken yalnız yeni Pod oluşturmak değil, bir kaynağın adresini “tür + ad + namespace” olarak düşünmek.'
  },
  15: {
    why: 'Bir aracı öğrenirken bütün kelimelerini baştan ezberlemek zorunda değilsin; aracın kendi sözlüğünü keşfedebilirsin. Kubernetes’te uygulama çalıştırmak, ağ erişimi vermek ve ayar saklamak farklı nesne türleriyle anlatılır. Önce hangi türlerin bulunduğunu görelim.',
    how: 'API kaynakları, kümenin tanıdığı nesne türleridir. Pod, Service ve Deployment bunlardan bazılarıdır. `api-resources` türleri ve bazı kısa adlarını listeler; örneğin `po` Pod, `svc` Service için kullanılabilir. Bu liste mevcut nesneleri değil, konuşabileceğin nesne türlerini gösterir.',
    practice: 'Desteklenen kaynak türlerini listele ve tanıdığın adları bul. `get pods` ile Pod örneklerini listelemekten farkını düşün: biri sözlük, diğeri envanterdir. Gerçek kümenin sözlüğü sürüme ve eklenen kaynak türlerine göre değişebilir; burada eğitim modelinin desteklediği alt kümeyi görüyorsun.'
  },
  16: {
    why: 'Bir formu doldururken alanın anlamını tahmin etmek yerine açıklamasını okumak daha güvenilirdir. Kubernetes manifestlerinde de çok sayıda alan bulunur. Hepsini ezberlemek yerine ihtiyaç duyduğun alanın anlamını kaynağından öğrenme alışkanlığı kazanacağız.',
    how: '`explain`, API şemasındaki bir alanı ve alt alanlarını açıklar. Noktalarla yazılan `pod.spec.containers` yolu, Pod’un istenen durumundaki container listesine iner. Bu bir canlı Pod’un mevcut değerlerini okumak değildir; alanın hangi bilgiyi taşımak için tasarlandığını öğrenmektir.',
    practice: 'Pod container alanlarının açıklamasını aç. Image, ortam değişkeni ve kaynak gibi daha sonra kullanacağın başlıkları tanımaya çalış. Şimdilik hiçbirini düzenlemene gerek yok. Alan tanımı için explain, mevcut nesnenin değeri için get veya describe kullanıldığını ayırt et.'
  },
  // 03 · Pod atölyesi
  17: {
    why: 'Container’ı bir makinede başlatmayı öğrendin; şimdi aynı isteği Kubernetes’e anlatacağız. Küme, çalıştırılacak örneği tanımalı ve uygun bir makineye yerleştirmeli. Bunun için image referansından daha fazlasını taşıyan bir çalışma birimine ihtiyaç vardır.',
    how: 'Pod, Kubernetes’in bir node’a yerleştirdiği en küçük çalışma birimidir. Bu örnekte içinde tek bir nginx container’ı bulunur. İstek API’ye kaydolur, scheduler bir node seçer, node üzerindeki bileşenler container’ı çalıştırır. Bir Pod gerektiğinde birlikte çalışan birden fazla container da barındırabilir.',
    practice: 'web adlı Pod’u nginx image’ıyla oluştur. Sağdaki akışta istekten yerleşime giden adımları ve node üzerinde oluşan Pod kutusunu izle. Bu doğrudan oluşturulmuş bir Pod’dur; henüz silinirse yerine yenisini üretecek bir Deployment tanımlamadın.'
  },
  18: {
    why: 'Bir uygulamanın adını bilmek, hangi makinede çalıştığını bilmek değildir. Sorun yalnız tek makinedeyse veya örneklerin dağılımını incelemek istiyorsan konum bilgisine ihtiyaç duyarsın. Bunun için liste çıktısını biraz genişleteceğiz.',
    how: '`get pods` kısa bir durum özeti verir; `-o wide` node adı ve Pod IP’si gibi ek sütunlar ekler. Pod adı, bulunduğu node ve ağ adresi farklı bilgilerdir. Yeni bir Pod oluşturulduğunda IP değişebilir, bu nedenle uygulamanın kalıcı erişim adresi olarak düşünülmemelidir.',
    practice: 'Hazır web ve api Pod’larını geniş çıktıda listele. Her satırdaki node bilgisini sağdaki küme görünümüyle eşleştir. Bu görev yerleşimi değiştirmiyor; mevcut dağılımı okuyorsun. Eğitimdeki yerleştirme modeli sadeleştirilmiştir, gerçek scheduler’ın bütün kararlarını temsil etmez.'
  },
  19: {
    why: 'Bir iş için istediğin sonuç ile şu anda gerçekleşmiş sonuç aynı olmayabilir. “İki örnek çalışsın” isteği verildiğinde sistemin bunu gerçekten sağlayıp sağlamadığını ayrıca görmelisin. Kubernetes nesneleri bu iki bakış açısını birlikte taşır.',
    how: '`spec`, nesne için istenen durumu; `status`, sistemin gözlediği durumu anlatır. Pod’un image seçimi spec içinde, IP ve hazır olma bilgileri status içinde bulunur. `-o yaml` tablo özetinin gizlediği alanları açarak bu ayrımı doğrudan incelemene yardım eder.',
    practice: 'Hazır web Pod’unu YAML biçiminde oku. Önce hangi image’ın istendiğini, sonra Pod hakkında hangi durum bilgisinin raporlandığını bul. Görev yalnız okumadır. İleride kendi manifestini hazırlarken sistemin yönettiği status alanlarını istenen yapılandırma gibi kopyalamaman gerektiğini hatırla.'
  },
  20: {
    why: 'Çok sayıda kaynağı yalnız isimlerinden yönetmek zorlaşır. Bir kütüphanede kitapları konu etiketleriyle gruplamak gibi, uygulama örneklerine de seçilebilir özellikler ekleyebiliriz. Böylece “hangi frontend kaynakları var?” sorusunu isimleri tek tek bilmeden sorabiliriz.',
    how: 'Label, metadata içindeki anahtar-değer etiketidir. `tier=frontend` örneğinde tier kategori, frontend değerdir. Bir label eklemek Pod’un adını veya image’ını değiştirmez. Etiketleri daha sonra sorgularda ve Service gibi kaynakların hedef seçiminde kullanabiliriz.',
    practice: 'Mevcut web Pod’una frontend etiketini ekle. Nesnenin aynı kaldığını, yalnız metadata bilgisinin değiştiğini gör. Etiketin açıklama metninden farkı seçime katılabilmesidir. Bir sonraki görevde bu seçilebilir bilgiyi kalabalık bir listeden ilgili grubu bulmak için kullanacaksın.'
  },
  21: {
    why: 'Uygulamanın örnek sayısı değiştiğinde her yeni Pod adını ayrı ayrı takip etmek istemezsin. Ortak bir etiketi paylaşan bütün örnekleri tek sorguyla bulmak, bu değişime dayanıklı bir gözlem yolu sağlar. Şimdi etiketin pratik faydasını göreceğiz.',
    how: 'Selector, etiketlere göre seçim yapan koşuldur. `-l app=web` yalnız app etiketi web olan Pod’ları listeler. Bu seçim nesnenin adına bakmaz; web ile başlayan her adı otomatik seçmez. Aynı fikir ileride Service’in trafik göndereceği Pod grubunu belirleyecek.',
    practice: 'Hazır web-a, web-b ve db örnekleri arasından web grubunu filtrele. Çıktıda iki web örneği görünmeli, db görünmemelidir. Bunun Pod silmek olmadığını unutma: bütün kaynaklar yerinde durur, yalnız baktığın liste daralır. Boş sonuç gördüğünde etiket yazımını da kontrol et.'
  },
  22: {
    why: 'Bir kaynağın nasıl seçileceği ile insanlar için hangi açıklamayı taşıyacağı farklı ihtiyaçlardır. Sorumlu ekip veya işletim notu eklemek isteyebilirsin, fakat bunun trafik hedeflerini etkilemesini istemezsin. Bu seviyede açıklayıcı metadata’yı tanıyacağız.',
    how: 'Annotation, nesneye eklenen anahtar-değer bilgisidir; label gibi selector ile gruplama amacı taşımaz. Bir sahiplik notu veya doküman referansı burada tutulabilir. Annotation eklemek uygulama image’ını değiştirmez ve bu alan hassas bilgiyi gizleyen bir mekanizma değildir.',
    practice: 'web Pod’una owner=platform annotation’ını ekle. Kaynağın ayrıntısında labels ile annotations bölümlerini ayrı düşün. İkisi benzer yazılsa da kullanım amaçları farklıdır: seçim için label, ek açıklama için annotation. Bu görev Pod’un çalışmasını veya konumunu değiştirmeyi istemiyor.'
  },
  23: {
    why: 'Kubernetes’in her kaybolan uygulamayı kendiliğinden geri getirdiğini düşünmek kolaydır. Oysa sistemin neyi sürekli korumasını istediğini ayrıca tanımlaman gerekir. Önce, böyle bir yönetici olmadan oluşturulmuş Pod’un sınırını göreceğiz.',
    how: 'Bağımsız Pod doğrudan oluşturulmuş bir nesnedir. Onun yerine yenisini üretmekle görevli bir controller yoksa silindikten sonra geri gelmez. Container’ın aynı Pod içinde yeniden başlatılması başka bir durumdur; burada bütün Pod nesnesinin yaşamını sonlandırıyoruz.',
    practice: 'Hazır bağımsız web Pod’unu sil, ardından Pod listesini kontrol et. Küme görünümünde kutusu kaybolmalı ve yenisi oluşmamalıdır. Sonraki Deployment derslerinde aynı silme işleminin neden farklı sonuç verdiğini bu deneyle karşılaştıracaksın. Fark Kubernetes’in varlığı değil, istenen durumu koruyan controller’dır.'
  },
  24: {
    why: 'Uygulama henüz indirilememişse onun kodunu veya HTTP ayarlarını araştırmak doğru başlangıç değildir. Sorunun hangi aşamada olduğunu anlamak, gereksiz müdahaleleri önler. Bu görevde çalışan uygulama hatası ile pakete ulaşma hatasını ayıracağız.',
    how: 'ImagePullBackOff, image çekme işleminin başarısız olduğunu ve yeniden denemeler arasında beklenildiğini anlatır. Yanlış etiket veya registry erişimi gibi nedenleri olabilir. `describe` belirtileri gösterir. Bu laboratuvardaki bilinen neden, web Pod’unun `nginx:missing` referansını kullanmasıdır.',
    practice: 'Önce web’in ayrıntısını açıp hatayı gör, sonra Pod’daki web container’ının image referansını verilen çalışan etikete düzelt. Hem image hem hazır olma durumunun değiştiğini izle. Gerçek bir olayda aynı belirtiye bakıp her seferinde tag değiştirme; bu senaryoda nedeni önceden belirlenmiş bir hata onarıyorsun.'
  },
  // 04 · YAML ile düşünmek
  25: {
    why: 'Bir ortamı yeniden kurarken uzun bir komut geçmişini hatırlamak yerine son durumda ne istediğini bir dosyada saklayabilirsin. Böyle bir dosyayı başkası okuyabilir, inceleyebilir ve değişikliklerini karşılaştırabilir. Önce bu tarifi okumayı öğreneceğiz.',
    how: 'Manifest, Kubernetes nesnesinin hedef tanımıdır. `apiVersion` ve `kind` hangi türü kullandığını, `metadata` kimliğini, `spec` nasıl davranmasını istediğini anlatır. YAML bu bilgileri girintili bir metin yapısıyla taşır. Dosyanın bulunması, içindeki nesnenin kümeye uygulanmış olduğu anlamına gelmez.',
    practice: 'Hazır pod.yaml dosyasını terminalden oku; Dosyalar sekmesinde de aynı tanımı bulabilirsin. web adını ve nginx image’ını tanımın içinde seçmeye çalış. `cat` yalnız dosyayı gösterir. Sağdaki kümede Pod oluşmaması bu seviyede beklenen davranıştır.'
  },
  26: {
    why: 'Yazılmış bir planın uygulanması için onu ilgili sisteme iletmek gerekir. Manifest de yalnız dosyada durduğu sürece bir tariftir. Şimdi dosyadaki hedefi kümenin canlı durumuna dönüştürüp gerçekten oluştuğunu ayrı bir gözlemle doğrulayacağız.',
    how: '`apply -f` dosyadaki nesne tanımını API’ye sunar. Kubernetes bu istenen durumu gerçekleştirmeye çalışır; ardından `get` ile canlı nesneye bakabilirsin. Dosyayı okumak, dosyayı uygulamak ve canlı sonucu okumak birbirinden farklı işlemlerdir.',
    practice: 'pod.yaml tanımını uygula, sonra web Pod’unu API’den sorgula. Sağdaki node üzerinde yeni Pod görmelisin. Komutun kabul mesajıyla yetinmeden nesnenin durumunu kontrol et. Bu küçük alışkanlık, daha karmaşık yayınlarda “dosyada doğru” ile “gerçekte hazır” ayrımını korumana yardım edecek.'
  },
  27: {
    why: 'Bir örneği elle oluşturmak yerine “bu uygulamadan iki tane sürekli bulunsun” demek isteyebilirsin. Bu istek, tek bir Pod tarifinden daha kapsamlıdır: örneklerin nasıl üretileceği ve kaç tane bulunacağı birlikte belirtilmelidir.',
    how: 'Deployment manifesti bir Pod template’i, yani yeni örneklerin tarifi ile replica sayısını taşır. Controller bu hedefi korumak için ReplicaSet ve Pod nesneleri oluşturur. Deployment üzerindeki etiket ile üretilen Pod’ların template etiketleri ayrı alanlardır; bağlantıları incelerken bu fark önemlidir.',
    practice: 'İki web örneği isteyen deployment.yaml dosyasını uygula. Küme görünümünde tek Deployment’a bağlı iki Pod oluşmasını izle; Kaynaklar sekmesinde aradaki ReplicaSet’i de inceleyebilirsin. Burada iki ayrı uygulama tarifi yazmadın, bir tarifin iki örneğini istedin.'
  },
  28: {
    why: 'Bir nesneyi oluşturmadan önce taslağını görmek, hem öğrenirken hem değişiklik hazırlarken yararlıdır. Bir formun önizlemesi gibi, komutun hangi nesneyi üretmek istediğini inceleyebilirsin. Böylece deneme yapmak için canlı kaynak oluşturmak zorunda kalmazsın.',
    how: '`--dry-run=client`, istemci tarafında nesne taslağı üretir ama onu sunucuya kaydetmez. `-o yaml` taslağı metin olarak gösterir. Bu çıktı kullanılabilecek bir başlangıç noktasıdır; gerçek sunucudaki bütün politika ve doğrulamaların geçtiğini kanıtlamaz.',
    practice: 'nginx için web adlı Deployment’ın YAML taslağını çıkar. Terminalde tanım görünmeli, fakat küme envanterine Deployment eklenmemelidir. Buradaki başarı ölçüsü özellikle bu ayrımdır: bir tanım ürettin ama henüz uygulamadın. Sonradan kaydetme ve apply işlemleri ayrı adımlar olur.'
  },
  29: {
    why: 'Bir yapılandırmayı uygulamadan önce nelerin değişeceğini görmek, beklenmedik sonuçları azaltır. Özellikle örnek sayısı, image veya erişim ayarları için “eski ve yeni” karşılaştırması yapmak yararlıdır. Bu seviyede değiştirmeden önce farkı okuyacağız.',
    how: '`diff`, dosyadaki istenen durum ile kümedeki mevcut nesneyi karşılaştırır. Bu örnekte canlı web tek replica iken manifest üç replica ister. Fark çıktısı bir değişiklik planıdır; kendi başına controller’ın hedefini değiştirmez veya yeni Pod üretmez.',
    practice: 'deployment.yaml ile mevcut web arasındaki farkı incele. Replica sayısının hangi değerden hangi değere geçeceğini bul. Henüz apply çalıştırma: bu görevde kümenin tek örnekli kalması beklenir. Önizlemeyi okuyup sonra uygulama alışkanlığı, bir sonraki seviyenin temelidir.'
  },
  30: {
    why: 'Canlı ortamı değiştirip tarif dosyasını eski bırakmak, daha sonra eski hedefin geri uygulanmasına yol açabilir. Aynı son durumu hem dosyada hem kümede takip etmek bu karışıklığı azaltır. Şimdi ölçekleme isteğini dosya üzerinden ileteceğiz.',
    how: 'Manifestteki `replicas` alanı kaç Pod istendiğini belirtir. Apply edildiğinde controller mevcut sayıyla hedefi karşılaştırır ve eksik örnekleri üretir. Bu, üç Pod’u ayrı ayrı elle tanımlamak değildir. Sürüm kontrollü dosya, hedefin ekip tarafından görülebilen kaydı olur.',
    practice: 'Üç replica isteyen deployment.yaml dosyasını uygula. Başlangıçta tek örneği olan web’in üç hazır örneğe ulaşmasını izle. Dosyadaki hedef ile canlı Deployment’ın hedefinin artık aynı olması gerekir. Ölçekleme talebinin image sürümünü değiştirmekten farklı olduğunu da koru.'
  },
  31: {
    why: 'Bir uygulamanın çalışması ve ona ulaşılabilmesi çoğu zaman birden fazla kaynak gerektirir. Bu ilişkili parçaları aynı dosyada görmek, aralarındaki bağlantıyı anlamayı kolaylaştırır. Ancak aynı dosyada bulunmaları tek bir nesne oldukları anlamına gelmez.',
    how: 'YAML içinde `---` ayırıcıları birden çok belgeyi ayırabilir. stack.yaml bir Deployment ve bir Service içerir. Deployment Pod’ları üretir, Service uygun hedeflere erişim sağlar; EndpointSlice ise bu hedeflerin adreslerini gösterir. Her kaynak ayrı bir sorumluluk taşır.',
    practice: 'stack.yaml dosyasını uygula, ardından endpoint dilimlerini listele. Uygulama ve Service’in yanında hazır hedeflerin de oluştuğunu gör. Gerçek Kubernetes’te çok belgeli apply atomik değildir; bir bölümün başarısı diğerlerini garanti etmez. Bu yüzden ilişkili parçaların sonucunu ayrı ayrı okumayı öğreniyoruz.'
  },
  32: {
    why: 'Otomasyonda aynı isteğin tekrar gönderilmesi olağandır. Her tekrarda yeni uygulamalar çoğalırsa güvenilir bir ortam kurmak zorlaşır. İstediğin son durumu tekrar tarif etmenin, kaynakları gereksizce çoğaltmaması fikrini deneyerek öğreneceğiz.',
    how: 'İdempotent davranış, aynı hedef tekrar uygulandığında aynı son duruma ulaşılmasıdır. İsim ve kapsam aynıysa aynı Deployment manifestini tekrar apply etmek ikinci bağımsız Deployment istemek değildir. Controller hâlâ belirtilen replica sayısını korumaya çalışır.',
    practice: 'İki replica isteyen deployment.yaml dosyasını iki kez uygula. İkinci adımdan sonra bir Deployment ve iki Pod bulunmalı; iki Deployment veya dört Pod oluşmamalıdır. Burada öğrendiğin fikir “komutu kaç kez yazdım?” yerine “son durumda ne istiyorum?” diye düşünmektir.'
  }
};
