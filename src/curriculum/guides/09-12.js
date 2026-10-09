// Health, storage, identity and finite work: one distinct explanation for every lab.
export default {
  // 09 · Sağlık sinyalleri
  65: {
    why: 'Bir dükkânın ışıklarının açık olması müşteriye hizmet vermeye hazır olduğu anlamına gelmez. Uygulama süreci de çalışırken gerekli bağlantıları veya hazırlıkları tamamlamamış olabilir. “Çalışıyor mu?” ile “istek kabul edebilir mi?” sorularını ayıracağız.',
    how: 'Readiness probe, container’ın trafik almaya hazır olup olmadığını kontrol eder. HTTP probe belirli bir yol ve porttan yanıt bekler. Başarısız readiness normal Service trafiğinde hedef olmamaya yol açar; kendi başına container’ı yeniden başlatmaz. Bu örnekte nginx için / yolu kullanılır.',
    practice: 'ready.yaml içindeki Deployment tanımını uygula. İki örneğin hazır olmasını ve template içindeki readinessProbe alanını incele. Yalnız Running yazısını değil hazır replica sayısını okumayı öğreniyorsun. Bu model kontrol sonucunu hızlandırarak gösterir; gerçek probe zamanlayıcılarını çalıştırmaz.'
  },
  66: {
    why: 'Uygulama açık görünüyor ama kullanıcı isteği ulaşmıyorsa bunun her zaman bir ağ arızası olduğunu düşünme. Sistem, hazır olmadığı bildirilen örneği bilerek normal trafikten uzak tutuyor olabilir. Bu davranışı arıza belirtisiyle birlikte okuyacağız.',
    how: 'Pod’un Running aşaması ile Ready koşulu farklıdır. Burada readiness /broken yoluna bakıyor; örnek uygulama bu yola başarılı yanıt vermiyor. Container çalışsa bile Pod hazır hedef olarak kullanılmıyor. Eğitim modeli bu nedenle EndpointSlice içinde hazır adres göstermiyor.',
    practice: 'Önce Pod listesindeki çalışma ve hazır olma sütunlarını karşılaştır, sonra EndpointSlice YAML’ını aç. Bu seviyede düzeltme yapmıyorsun; çalışan süreçle boş hazır hedef listesinin nasıl birlikte bulunabildiğini gözlemliyorsun. Doğrudan Pod’a ulaşılabilmesi de Service’in hazır hedef seçimiyle aynı şey değildir.'
  },
  67: {
    why: 'Sağlık kontrolü yanlış kapıyı çalıyorsa sağlıklı uygulama bile hazır değil sanılabilir. Böyle bir durumda uygulamayı rastgele yeniden kurmak yerine kontrolün doğru yere baktığını doğrulamak gerekir. Bu görevde hatalı kontrol yolunu düzelteceğiz.',
    how: "Readiness probe uygulamanın sunduğu bir endpoint’i kontrol etmelidir. Hem canlı Deployment hem ready.yaml burada yanlış /broken yolunu kullanır. Kaynak dosyada readinessProbe.httpGet.path alanını düzeltmek gerekir. Yeni template ile oluşan hazır Pod’lar Service’in normal trafik hedeflerine katılabilir.",
    practice: "Dosyalar sekmesinde ready.yaml içindeki readiness yolunu / yapıp kaydet. Terminalden uygula ve web Service’ine örnek istek gönder. Dosya, hazır replica sayısı ve erişim sonucu birlikte doğrulanır. Burada / yalnız nginx örneği için uygundur; amaç kontrolü kaldırmak değil doğru adrese yöneltmektir.",
  },
  68: {
    why: 'Bazı uygulamalar çalışıyor görünse de kilitlenebilir; yeniden başlatmak onları toparlayabilir. Fakat yanlış sağlık kontrolü, sağlıklı süreci tekrar tekrar kapatarak yeni bir sorun da yaratabilir. Yeniden başlatma kararını trafik kabul etme kararından ayıracağız.',
    how: 'Liveness probe, başarısızlık eşiği aşıldığında container’ın yeniden başlatılmasını tetikleyebilir. Readiness’in amacı ise trafik uygunluğudur. Bu Pod’un liveness kontrolü /broken yoluna baktığı için yeniden başlama belirtileri oluşur. `logs --previous`, önceki sonlandırılmış container örneğinin kayıtlarına bakar.',
    practice: 'web Pod’unu describe ile incele, sonra önceki container logunu oku. Probe tanımı, restart bilgisi ve logu birlikte değerlendir. Bu seviye yalnız teşhis içindir. Her dış bağımlılık sorununu liveness başarısızlığına bağlamanın neden gereksiz yeniden başlamalara yol açabileceğini düşün.'
  },
  69: {
    why: 'Bir hata kontrol mekanizmasındaysa uygulama paketini değiştirmek sorunu çözmeyebilir. Yeniden başlama döngüsünün nedenini saptadıktan sonra yalnız yanlış ayarı düzeltmek daha anlaşılır bir müdahaledir. Şimdi liveness kaynaklı arızayı onaracağız.',
    how: 'web’in liveness yolu yanlış olduğu için container’lar yeniden başlama belirtileri gösteriyor. live.yaml doğru / yolunu ve kontrol eşiklerini taşıyan Pod template’ini tanımlar. Bu template’i uygulamak yeni örnekler oluşturur; rollout durumunu kontrol etmek hedefin hazır örneklerle gerçekleştiğini doğrular.',
    practice: 'Hazır live.yaml dosyasını uygula ve web rollout’unun tamamlandığını sorgula. İstenen değişiklik image değil liveness tanımıdır. Site gerçek bekleme ve backoff sürelerini çalıştırmaz; gözlediğin şey kontrol ayarı ile yeniden başlatma davranışı arasındaki sadeleştirilmiş ilişkidir.'
  },
  70: {
    why: 'Bazı uygulamalar açılırken veri yükler veya uzun hazırlık yapar. Onları hızlı başlayan uygulamalarla aynı anda sağlıksız saymak, daha açılmadan sürekli yeniden başlatılmalarına neden olabilir. Başlangıç için ayrı bir sabır bütçesi tanımlayacağız.',
    how: 'Startup probe, başarılı olana kadar liveness ve readiness kontrollerini bekletir. Böylece başlangıç süresi normal çalışma sağlığından ayrı ele alınır. Dosyada periodSeconds: 5 ve failureThreshold: 30, yaklaşık 150 saniyelik başarısız kontrol bütçesini anlatır. Bu, her koşulda kesin duvar saati garantisi değildir.',
    practice: 'startup.yaml dosyasını okuyup iki alanın birlikte ne anlattığını yorumla, sonra slow Pod’unu uygula. Görev gerçek 150 saniye bekletmez; tanımı incelersin. Startup’ın “açılış tamamlandı mı?”, readiness’in ise “şimdi trafik alabilir mi?” sorusunu yanıtladığını ayırt et.'
  },
  71: {
    why: 'Bir işi başlatmadan önce çalışma alanını hazırlamak gerekebilir. Uygulama da bazı başlangıç hazırlıkları bitmeden çalışmamalıdır. Bu bağımlılığı tek bir uzun başlangıç komutuna saklamak yerine ayrı bir hazırlık aşamasıyla ifade edebiliriz.',
    how: 'Normal init container’lar uygulama container’larından önce sırayla çalışıp başarıyla tamamlanır. Uygulama bu ön koşullar bitene kadar bekler. init.yaml basit bir hazırlık işi içerir. Gerçekte kubelet tamamlanmayı izler; bu eğitimde ilerlemeyi görünür kılmak için mantıksal zaman adımı kullanılır.',
    practice: 'Init container içeren manifesti uygula, başlangıçtaki Pending durumunu gör ve lab tick ile hazırlığı ilerlet. Ardından uygulama Pod’unun hazır olmasını izle. `lab tick` gerçek Kubernetes komutu değildir; amaç, hazırlık işi bitmeden ana uygulamanın başlamaması ilişkisini deneyimlemektir.'
  },
  72: {
    why: 'Bir siparişin kabul edilmesiyle hazırlanması farklı anlardır. Otomasyonda kaynak oluşturma komutunun başarılı dönmesi de kaynağın kullanıma hazır olduğunu her zaman göstermez. Sabit süre beklemek yerine belirli bir koşulu kontrol etmeyi öğreneceğiz.',
    how: '`wait`, kaynağın belirli koşuluna bakar. Pod için Ready, uygulamanın hazır olmasına ilişkin koşuldur. Timeout, koşul gerçekleşmezse beklemenin sınırını belirler. Gerçekte durum zaman içinde izlenebilir; bu site mevcut koşulu hemen kontrol edip simüle sonuç üretir.',
    practice: 'Önce sağlıklı web Pod’unu oluştur, sonra Ready koşulunu doğrula. Oluşturma ile koşul kontrolünün iki ayrı görev adımı olmasının nedenini düşün. Aynı alışkanlık daha sonra iş tamamlanması ve yayın doğrulamasında da kullanılacak: bir sonraki aşamaya yalnız talep kabul edildi diye geçme.'
  },
  // 10 · Verinin ömrü
  73: {
    why: 'Bir uygulamanın geçici çalışma dosyalarının ne kadar yaşaması gerektiğini seçmelisin. Süreç yeniden başlasa da aynı Pod içinde verinin kalması yararlı olabilir; Pod tamamen kaldırıldığında ise silinmesi kabul edilebilir. Depolama türünü bu yaşam süresi ihtiyacı belirler.',
    how: 'emptyDir, Pod’un yaşamına bağlı geçici volume’dür. Aynı Pod’daki container’lar paylaşabilir ve container yeniden başlarken veri korunabilir; Pod kaldırıldığında veri kaybolur. `volumes` alanı volume’ü tanımlar, `volumeMounts` container içinde hangi dizinde görüleceğini belirtir.',
    practice: 'scratch.yaml içinde cache adını hem volume tanımında hem /cache bağlantısında bul, ardından manifesti uygula. Bu site dosya yazıp kalıcılığını sınamaz; tanım ve ilişkiyi gösterir. emptyDir’ı Pod’dan bağımsız bir yedek veya kalıcı veri çözümü olarak düşünme.'
  },
  74: {
    why: 'Uygulama örneği yenilendiğinde verinin de kaybolmasını istemeyebilirsin. Uygulamanın depolama ihtiyacını, o ihtiyacı sağlayacak fiziksel altyapıdan ayırmak yararlıdır. Önce “şu özellikte alan istiyorum” diyen bir talep oluşturacağız.',
    how: 'PersistentVolumeClaim, yani PVC, kapasite ve erişim biçimi gibi depolama gereksinimlerini ifade eder. PersistentVolume, yani PV, sağlanan depolama kaynağını temsil eder. StorageClass depolamanın nasıl sağlanacağını tarif eder. Talep uygun kaynağa bağlandığında Bound durumuna geçer.',
    practice: '1Gi isteyen data talebini claim.yaml ile oluştur ve PVC durumunu kontrol et. Eğitimde standard sınıfı ve sahte sağlayıcı hazır olduğu için bağlanma gerçekleşir. Gerçek disk ayrılmıyor. Başka bir gerçek kümede aynı talebin sağlayıcı veya kapasite eksikliğiyle Pending kalabileceğini unutma.'
  },
  75: {
    why: 'Bir depolama isteği karşılandığında “hangi talebe hangi kaynak ayrıldı?” sorusunu okuyabilmelisin. Talep ile sağlanan alanın ayrı nesneler olması başta karmaşık görünebilir, fakat uygulama ihtiyacıyla altyapı sorumluluğunu ayırır.',
    how: 'Bound PVC uygun bir PV ile eşleşmiştir. Pod normalde PV’nin adını doğrudan seçmek yerine PVC’ye referans verir. PV üzerindeki claim bilgisi hangi namespace ve talebe bağlandığını gösterir. Erişim kipleri de bu sözleşmenin parçasıdır; örneğin ReadWriteOnce mutlaka tek Pod demek değildir.',
    practice: 'Hazır data PVC’sini ayrıntılı incele, ardından PV’leri YAML olarak listele. Talebin adı ve kapsamıyla kaynak üzerindeki claim bağlantısını eşleştir. Bu görev veri okumuyor veya taşımıyor; ayrılan depolamanın hangi uygulama talebine ait olduğunu nesneler üzerinden anlamanı sağlıyor.'
  },
  76: {
    why: 'Var olmayan bir hizmet türünden sipariş verirsen isteğin bekleyebilir. Depolama talebinin yanlış sınıf istemesi de benzer bir sorundur. Önce beklemenin nedenini okuyup sonra yalnız bu boş eğitim talebini doğru tanımla yeniden oluşturacağız.',
    how: '`storageClassName`, PVC’nin hangi depolama sınıfını istediğini belirtir. data, nonexistent sınıfını istediği için Pending kalıyor. Bu senaryodaki talep kullanılmıyor ve bağlı verisi yok. Depolama sınıfını gelişigüzel patch etmek yerine yanlış talep kaldırılıp doğru manifestle yeniden oluşturulur.',
    practice: 'data ayrıntısında sınıf sorununu incele, kullanılmayan yanlış talebi kaldır ve standard sınıfını kullanan claim.yaml dosyasını uygula. Bound sonucunu gör. Bu silme yaklaşımını veri taşıyan veya kullanılan PVC’lere genelleme; gerçek bir taşıma işlemi ayrıca veri koruma planı gerektirir.'
  },
  77: {
    why: 'Bir depolama alanı ayrılmış olması, uygulamanın onu hangi dizinde göreceğini söylemez. Talep ile container içindeki kullanım yeri arasında bağlantı kurulmalıdır. Şimdi hazır depolama talebini uygulama tanımına bağlayacağız.',
    how: 'Pod’un `volumes` alanı PVC’nin claimName değerine başvurur. Container’ın `volumeMounts` alanı aynı volume adını bir dizine bağlar. Burada data PVC’si container içinde /data olarak kullanılmak istenir. Volume adı ile PVC adı aynı yazılabilir, ama farklı alanların sorumluluklarıdır.',
    practice: 'Hazır data talebini kullanan storage-pod.yaml dosyasını uygula. writer Pod’unun hazır olmasını ve volume → claim → mount ilişkisini incele. Site gerçek mount veya dosya içeriği çalıştırmaz. Bound ve Ready görmek, gerçek verinin yedeklendiğini veya doğrulandığını tek başına kanıtlamaz.'
  },
  78: {
    why: 'Bazı uygulamalarda örneklerin birbirinin rastgele yerine geçmesi yeterli değildir; her örneğin kararlı bir kimliğe sahip olması gerekir. Örneğin belirli üyeleri tanıyan bir veri sistemi için isim ve sıra önem taşıyabilir. Bu ihtiyaç için StatefulSet’i tanıyacağız.',
    how: 'StatefulSet, db-0 ve db-1 gibi ordinal isimli Pod’ları yönetir. Headless Service, olağan tek ClusterIP yerine üyelerin keşfine yardımcı olan bir ağ tanımı sağlar. Kararlı kimlik, uygulamanın veri çoğaltmasını veya yedeklemesini kendiliğinden kurmaz; bunlar uygulama ve depolama tasarımıdır.',
    practice: 'stateful.yaml içindeki headless Service ve iki replica’lı StatefulSet’i uygula. Pod adlarını Deployment örneklerinin adlarıyla karşılaştır. Eğitim ordinal kimlikleri gösterir; tam sıralı başlangıç ve veri sistemi davranışını çalıştırmaz. Amaç, her örneğin kimliğinin önemli olduğu yönetim modelini ayırt etmektir.'
  },
  79: {
    why: 'Kimliği önemli bir uygulamaya yeni üye eklerken mevcut üyelerin isimlerini rastgele değiştirmek istemezsin. Yeni kapasiteyi, var olan üyelerin kimliğini koruyarak eklemek gerekir. StatefulSet’in sıra fikrini ölçekleme sırasında inceleyeceğiz.',
    how: 'StatefulSet replica sayısı artınca sıradaki ordinal isimle yeni Pod oluşturur. İki üyeli db için yeni örnek db-2 olur; db-0 ve db-1 kalır. Bu isim düzeni uygulamanın verisini otomatik paylaştırdığı anlamına gelmez. Veri üyeliği ve çoğaltma ayrı sorumluluklardır.',
    practice: 'Hazır db StatefulSet’ini üç replica’ya çıkar. Yeni db-2 kaydı oluşurken önceki iki kimliğin korunduğunu gözlemle. Bu görev depolama taşımıyor veya veritabanı kümesi kurmuyor. Ölçekleme kararının burada hem sayı hem kimlik düzeniyle ilişkili olduğunu öğreniyorsun.'
  },
  80: {
    why: 'Bir dükkân aynı adla yeniden açılabilir, ama bu önceki fiziksel dükkânın hiç değişmediği anlamına gelmez. StatefulSet Pod’unda da görünen adın aynı kalmasıyla nesnenin aynı olması farklıdır. Kaynakların yaşam sürelerini dikkatle ayıracağız.',
    how: 'Controller silinen db-0 yerine aynı ordinal adlı yeni Pod nesnesi üretir. Gerçek Kubernetes’te yeni nesnenin UID’si farklıdır. Bu seviyede ayrıca bulunan data PVC’si Pod’dan bağımsız bir nesnedir; varlığını koruması, db-0’ın o PVC’ye veri yazdığını kanıtlamaz.',
    practice: 'db-0 Pod’unu silip aynı adla yeniden oluşmasını izle, ardından data PVC’sinin hâlâ bağlı olduğunu sorgula. İki ayrı yaşam döngüsünü karşılaştırıyorsun. Görev gerçek disk verisi veya veritabanı kurtarması sınamaz; isim, nesne kimliği ve depolama varlığı arasındaki farkı öğretir.'
  },
  // 11 · En az yetki
  81: {
    why: 'Bir uygulamanın Kubernetes API’siyle konuşması gerekiyorsa önce kim olduğunu ifade etmesi gerekir. Kimliği olmakla her işlemi yapabilmek aynı şey değildir. Bu ayrım, uygulamalara gereğinden fazla yetki vermeden çalıştırmanın temelidir.',
    how: 'ServiceAccount, iş yüklerinin kullanabildiği namespace kapsamlı kimliktir. İnsan kullanıcı hesabıyla aynı nesne türü değildir. Kimlik doğrulama “kimsin?”, yetkilendirme “ne yapabilirsin?” sorusunu yanıtlar. ServiceAccount oluşturmak kendi başına bütün Pod’ları listeleme veya silme izni vermez.',
    practice: 'reader adlı ServiceAccount oluştur ve kaynak envanterinde kimliğini gör. Henüz rol veya izin ataması eklemiyorsun. Sonraki görevlerde kimlik, izin tanımı ve atama bağlantısını ayrı ayrı kuracaksın. Bu eğitim gerçek erişim token’ı üretmez; kimlik ilişkisini modeller.'
  },
  82: {
    why: 'Bir gözlemci uygulamanın liste okuması gerekebilir, fakat kaynak silmesine ihtiyaç yoktur. Yapılabilecek işleri açık ve dar bir listede tanımlamak, gereksiz gücü önler. Şimdi kimden bağımsız olarak izin tanımını hazırlayacağız.',
    how: 'Role, bir namespace içinde hangi kaynaklarda hangi eylemlere izin verildiğini tarif eder. `resources` hedef türleri, `verbs` eylemleri belirtir. Pod için get tek nesne okumayı, list ise listelemeyi ifade eder. Rolü oluşturmak bu yetkileri henüz bir kimliğe atamak değildir.',
    practice: 'reader rolünü yalnız pods üzerinde get ve list izinleriyle oluştur. Kurallarda silme veya değiştirme izni olmadığını gör. Buradaki kazanım, “okuyucu olsun” gibi genel bir niyeti somut kaynak ve eylem çiftlerine çevirmek. Sonraki adımda bu izin tanımını doğru kimliğe bağlayacaksın.'
  },
  83: {
    why: 'Bir iş tanımı hazırlamak ile o işi bir kişiye vermek ayrı adımlardır. Aynı şekilde Role ile ServiceAccount’ın ayrı ayrı bulunması aralarında ilişki kurmaz. İzinlerin kime verildiğini açıkça belirten bağlantıya ihtiyaç vardır.',
    how: 'RoleBinding, roleRef ile izin tanımına, subjects ile yetki alacak özneye başvurur. Burada reader rolü default namespace’indeki reader ServiceAccount’ına bağlanır. ServiceAccount adının yanında namespace’i de önemlidir; başka kapsamda aynı isimli kimlik farklıdır.',
    practice: 'Hazır rol ve kimlik arasında reader-binding bağlantısını oluştur. Ayrıntıda roleRef ve subject alanlarını ayırt et. Yeni izin listesi yazmıyor, var olan dar izinleri doğru kimliğe atıyorsun. Bu ilişkiyi sonraki seviyede etkili yetki sorgusuyla kontrol edeceksin.'
  },
  84: {
    why: 'Yapılandırmaya bakıp bir işlemin izinli olduğunu varsaymak yerine sisteme sorabilirsin. Bu, yanlış isim veya eksik bağlantı gibi sorunları erkenden fark etmeyi sağlar. İzin tanımından gerçek yetki sonucuna geçeceğiz.',
    how: '`auth can-i`, belirli kimliğin belirli kaynakta belirli eylemi yapıp yapamayacağını sorgular. `--as`, sorguyu belirtilen kimlik açısından yapmayı ister; gerçek kümede bunu kullanmak ayrıca impersonation yetkisi gerektirir. Eğitim bu kontrolü yönetici bakışıyla simüle eder.',
    practice: 'reader kimliği için list pods yetkisini sorgula. Hazır RoleBinding doğru olduğundan yes beklenir. Bu sorgu Pod listesini indirmek değildir; listeleme eylemine izin olup olmadığını sorar. Kimlik, eylem ve kaynak üçlüsünü açık yazmak, sonraki olumsuz yetki testinin de temelidir.'
  },
  85: {
    why: 'Güvenli bir yetki düzeninde yalnız gerekli işlerin başarılı olması yetmez; gerekmeyen işlerin de izin dışı kalması gerekir. Bir okuyucunun silememesi, sistemin bozuk olması değil beklenen sınırdır. Şimdi bu olumsuz sonucu doğrulayacağız.',
    how: 'reader rolünde get ve list var, delete yok. Aynı kimlik için başka bir eylem sorulduğunda sonuç farklı olabilir. RBAC izinleri birleşir; başka rol atamaları varsa etkili yetkiyi onlar da belirler. Bu nedenle yalnız tek rol dosyasına bakmak yerine sonucu sorgulamak yararlıdır.',
    practice: 'reader için delete pods yetkisini kontrol et ve no yanıtını doğrula. Komutun başarıyla çalışıp izin sonucunun no olabilmesi önemlidir: bir Pod silmeye çalışmıyor, yetki sınırını ölçüyorsun. Bu sınırı korumak, gerekli listeleme işlevi kadar tasarımın parçasıdır.'
  },
  86: {
    why: 'Bir uygulamaya başlangıçta fazla izin verilmiş olabilir. Çözüm bütün erişimi kesmek değil, gereken işlevleri koruyup gereksiz olanları çıkarmaktır. Bu görevde yetkiyi genişletmeden yapılandırmayı daraltacağız.',
    how: 'Mevcut reader rolünde get/list yanında delete de bulunuyor. reader-role.yaml yalnız okuma izinlerini taşır. Aynı rol güncellenince onu referans eden binding üzerinden etkili izinler değişir. Başka atamalar daha geniş izin veriyorsa sonuç farklı olabilir; bu yüzden sorguyla doğrulama yapılır.',
    practice: 'Daraltılmış rol manifestini uygula ve reader’ın Pod silme yetkisinin no olduğunu kontrol et. Kimliği veya binding’i silmeden yalnız izin tanımını değiştirdin. Gerçek ortamda daraltmadan önce bağımlı iş akışlarını değerlendir; burada silme yetkisinin gereksiz olduğu bilinen bir senaryo var.'
  },
  87: {
    why: 'Uygulamanın API’de yapabilecekleri ile işletim sistemi içinde sahip olduğu ayrıcalıklar farklıdır. Bir container’ın gereksiz yönetici yetkileriyle çalışmaması, olası bir hatanın etkisini sınırlamaya yardım eder. Bu seviyede çalışma ortamının izinlerini tarif edeceğiz.',
    how: 'SecurityContext, kullanıcı kimliği ve container ayrıcalıkları gibi koşulları belirler. runAsNonRoot kök kullanıcıyla çalışmama niyetini, allowPrivilegeEscalation:false ek ayrıcalık kazanmamayı, readOnlyRootFilesystem yazılamayan kök dosya sistemini ifade eder. drop:ALL gereksiz Linux capability’lerini kaldırır. Image bu koşullarda çalışmaya uygun olmalıdır.',
    practice: 'secure.yaml içindeki Pod ve container güvenlik alanlarını oku, ardından manifesti uygula. Bunlar RBAC rolünün yerine geçmez; başka bir katmanı sınırlar. Site gerçek kernel izolasyonu çalıştırmadığından başarılı uygulama mesajını işletim sistemi güvenlik testi olarak yorumlama.'
  },
  88: {
    why: 'Bir uygulama Kubernetes API’sini kullanmıyorsa ona API kimlik bilgisi vermek gereksiz olabilir. Kullanılmayan bir anahtarı çalışma alanına koymamak, gereksiz erişim yolunu azaltır. Bu kontrol noktasında otomatik token bağlantısını kapatacağız.',
    how: '`automountServiceAccountToken: false`, Pod için varsayılan ServiceAccount token mount’unu kapatır. Bu bir ağ kapatma kuralı değildir ve başka yollardan verilmiş kimlik bilgilerini geri almaz. Kimlik, API yetkisi, token bağlantısı ve ağ erişimi birbirinden ayrı kontrollerdir.',
    practice: 'API kullanmayan public-web örneğini no-token.yaml ile oluştur. Pod tanımında otomatik mount alanının false olduğunu kontrol et. Görevde uygulamaya daha geniş rol vermen veya Service oluşturman gerekmiyor. İhtiyaç duyulmayan bir erişim aracını hiç vermeme yaklaşımını öğreniyorsun.'
  },
  // 12 · Tamamlanan işler
  89: {
    why: 'Web sunucusu gibi sürekli açık kalması gereken uygulamalarla rapor hazırlayıp biten işler aynı yaşam döngüsüne sahip değildir. Bitmiş bir raporu sırf süreç sona erdi diye sürekli yeniden çalıştırmak istemezsin. Sonu olan işler için Job modelini tanıyacağız.',
    how: 'Job, başarıyla tamamlanması beklenen işi ve onun Pod’larını yönetir. Komut işi bitirince tamamlanma sonucu önem kazanır. Deployment ise sürekli hedef sayıda uygulama örneği tutmaya odaklanır. Job bazı koşullarda yeniden deneyebildiği için işin tekrar yürütülmesi güvenli tasarlanmalıdır.',
    practice: 'report adlı örnek rapor işini oluştur ve Job listesini aç. Bu seviyede aktif iş tanımını gözlemliyorsun; eğitim sonraki aşamada tamamlanmayı ilerletecek. Container’ın çalıştıracağı echo komutunun kubectl seçeneklerinden sonra geldiğini ayırt et. Gerçek rapor dosyası üretilmiyor.'
  },
  90: {
    why: 'Bir işin hazır beklemesiyle başarıyla bitmesi farklı sonuçlardır. Rapor hazırlayan işte kullanıcı için değer, sunucunun sürekli açık kalması değil raporun tamamlanmasıdır. Bu nedenle servis sağlık koşulu yerine iş tamamlanma koşuluna bakacağız.',
    how: 'Job başarıyla bittiğinde succeeded bilgisi ve Complete koşulu oluşur. İlgili Pod Succeeded olabilir; bu, web servisi gibi yeniden çalıştırılması gerektiği anlamına gelmez. `wait --for=condition=Complete`, Ready kontrolünden farklı bir yaşam döngüsü sonucunu doğrular.',
    practice: 'Hazır report işini lab tick ile simülasyonda ilerlet, sonra Complete koşulunu kontrol et. İlk adım eğitim zamanını ilerletir, ikinci adım sonucu sorgular. Gerçekte işin süresini ve çıkış kodunu uygulama belirler; kullanıcı lab tick komutuyla işi bitirmez.'
  },
  91: {
    why: 'Dört kutuyu taşımak için iki kişi çalıştırabilirsin. Toplam yapılacak iş miktarı ile aynı anda çalışan kişi sayısı aynı değildir. Toplu görevlerde de bu iki sayıyı ayrı tanımlamak kaynak kullanımını anlamanı sağlar.',
    how: "parallelism aynı anda etkin işçi sayısını, completions toplam başarı hedefini belirtir. Burada iki işçiyle dört tamamlanma istenir. Bir lab tick yalnız o anda çalışan grubu bitirir; controller sonraki grubu oluşturur. Böylece iki sayı arasındaki fark görünür kalır ve gerçek süreç çalıştırılmadan küçük bir iş sırası modellenir.",
    practice: "parallel.yaml içindeki iki alanı karşılaştırıp dosyayı uygula. İki aktif işçinin dört başarı hedefini aynı anda bitirmediğini gör. İstersen iki lab tick ile grupları sırayla tamamlat. Image veya bağımlılık yüzünden başlayamayan işçi başarı sayılmaz; önce arızalı tanımı düzeltmek gerekir.",
  },
  92: {
    why: 'Başarısız işi sonsuza kadar denemek kaynak ve zaman harcayabilir. Öte yandan belirli sayıda yeniden deneme ile toplam çalışma süresine sınır koymak farklı sorunları çözer. Bu iki güvenlik sınırını ayrı tanımlayacağız.',
    how: 'backoffLimit, başarısız denemeler için yeniden deneme sınırını belirtir. activeDeadlineSeconds ise Job’un toplam çalışma süresini sınırlar. bounded.yaml iki yeniden deneme sınırı ve 120 saniyelik süre bütçesi taşır. Bir sayının denemeleri, diğerinin süreyi anlattığını unutma.',
    practice: 'Sınırlı iş manifestini uygula ve bounded Job’unun ayrıntısını incele. Bu seviyede gerçekten 120 saniye beklemiyorsun veya tekrar tekrar hata üretmiyorsun. Model politika alanlarını saklayıp gösterir; gerçek backoff ve deadline zamanlayıcılarını uygulamaz. Amacın sınırları doğru okuyabilmek.'
  },
  93: {
    why: 'Bazı işler sürekli çalışmak yerine belirli aralıklarla başlamalıdır: örneğin düzenli yedekleme. Böyle bir işin takvimi ile tek bir çalışması farklı nesnelerdir. Önce takvimi tanımlayacağız; her zaman dilimi ayrı bir iş üretme niyeti taşır.',
    how: 'CronJob, zaman ifadesine göre Job oluşturur. `*/5 * * * *` ifadesi her beş dakikalık zamanları belirtir. Boşluklu ifade komuta tek değer olarak verilmelidir. CronJob, her çalışmanın kesin olarak yalnız bir kez gerçekleşeceği garantisi değildir; işin tekrar güvenliği önemini korur.',
    practice: 'backup CronJob’una verilen beş dakikalık takvimi tanımla. Bu site duvar saatiyle otomatik iş çalıştırmaz; zamanlama nesnesini öğretir. Sürekli yaşayan tek container yerine yeni Job çalışmaları üreten bir plan oluşturduğunu açıklayabilmelisin. Sonraki seviyelerde çakışma ve manuel denemeyi göreceksin.'
  },
  94: {
    why: 'Beş dakikada bir başlayan iş on dakika sürerse çalışmalar üst üste binebilir. Bazı işler için bu kabul edilebilir, bazıları için veri tutarsızlığı yaratabilir. Takvim sıklığının yanında eşzamanlı çalışma politikasını da seçmek gerekir.',
    how: '`concurrencyPolicy: Forbid`, aynı CronJob’un önceki işi sürerken yeni planlı çalışmanın başlamamasını ister. Allow eşzamanlı çalışmalara izin verir, Replace farklı bir değiştirme davranışıdır. Forbid bütün kümedeki işleri birbirinden kilitlemez; kapsamı aynı CronJob’un planlı işleridir.',
    practice: 'Hazır backup CronJob’unun politikasını Forbid olarak değiştir. Zaman ifadesinin değil çakışma davranışının değiştiğini gör. Simülatörde takvim akmadığı için burada gerçek bir zamanlama yarışı sınanmıyor. Amacın uzun süren işlerde hangi politika sorusunu sorman gerektiğini öğrenmek.'
  },
  95: {
    why: 'Bir takvim işini denemek için sonraki planlı saati beklemek istemeyebilirsin. Takvimi bozmak yerine aynı iş tarifinden tek bir deneme çalışması başlatmak daha açık bir yöntemdir. Plan ile o plandan üretilen çalışmayı ayıracağız.',
    how: 'CronJob’un Job template’i, elle oluşturulan bir Job için kaynak olabilir. `--from=cronjob/backup`, mevcut tariften backup-now adlı ayrı çalışma üretir. CronJob’un takvimi değişmez. Manuel çalışma gerçek ortamda yine dış sistemlerde yan etki yapabilir ve takvimle çakışma riski ayrıca değerlendirilir.',
    practice: 'backup tarifinden backup-now Job’unu oluştur, sonra lab tick ile eğitim işini tamamlat. CronJob nesnesinin yerinde kaldığını, yeni Job’un ayrı kimlik taşıdığını düşün. Bu deneme gerçek yedek almıyor; tariften çalışma üretme ve tamamlanma ilişkisini gösteriyor.'
  },
  96: {
    why: 'Bakım sırasında yeni işler başlamasın isteyebilir, fakat başlamış işlerin tamamlanmasına izin verebilirsin. Planı duraklatmakla çalışan işi iptal etmek aynı ihtiyaç değildir. Bu kontrol noktasında takvimi silmeden yeni planlamayı durduracağız.',
    how: 'CronJob içindeki `suspend: true`, yeni planlı Job oluşturulmasını duraklatır. Önceden başlamış Job’ları otomatik sonlandırmaz ve schedule ifadesini silmez. Gerçekte yeniden etkinleştirirken kaçırılan zamanlamalar ve son başlama süresi politikası ayrıca dikkate alınır.',
    practice: 'backup için suspend alanını true yap, sonra YAML tanımını okuyarak hem takvimin korunduğunu hem duraklatmanın açık olduğunu doğrula. Yeni çalışma niyetini durdurmakla geçmiş veya aktif işleri temizlemenin farklı işlemler olduğunu kavra. Site gerçek takvim yürütmediği için politika tanımını inceliyorsun.'
  }
};
