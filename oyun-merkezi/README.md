# Oyun Merkezi

**Sürüm: 2.0.3** (ana ekranın sağ alt köşesinde de küçük olarak görünür; numara `surum.js` dosyasındadır)

İnternet olmadan da çalışan, statik bir oyun sitesi. İstenirse **Supabase** ile ortak sıralama tablosu, **GitHub Pages** ile yayın eklenir. Kütüphane ya da CDN yoktur; Supabase'e düz `fetch` ile bağlanılır.

## Oyunlar

| Oyun | Puan nedir? |
|---|---|
| Kale Savaşı | Dalga×50 + öldürülen düşman (sonsuz dalga, 10'da bir boss) |
| Yılan | Yenen elma |
| 2048 | Birleştirme puanı |
| Hafıza | 1000 − hamle×20 − saniye×3 |
| Balon | 60 sn'de patlatılan balonların puanı |
| Kelime | En uzun doğru kelime serisi |
| Futbol | Kazanılan penaltı maçı |
| Platform | Mesafe + jeton |
| Tetris | Satır puanı |
| Kuş | Geçilen boru |
| Basket | 90 sn'lik maçta attığın sayı (2'ye 2) |
| Tuğla Kır | Kırdığın tuğlalardan toplanan puan |
| Köstebek Vur | 45 sn'de vurduğun köstebeklerin puanı |
| Uzay Savaşı | Vurduğun uzaylılardan toplanan puan |
| Simon | Hatasız tekrarladığın dizi uzunluğu |
| Pong | Bilgisayara karşı kazandığın puan (2 kişilik mod sıralamaya yazılmaz) |
| Mayın | Mayınları temizleme puanı |
| Zıpla | Çıktığın yükseklik + bonuslar |
| Araba Kaçış | Gittiğin mesafe + toplanan jetonlar |
| Voleybol (2'ye 2) | Rakip 5 sayı alana kadar aldığın sayı |

Tüm arayüz piksel sanatı tarzındadır (emoji yok, sprite'lar kodla çizilir); her oyunda ses açma/kapama ve sağ üstte tam ekran düğmesi vardır. **Sıralamaya yalnızca tek kişilik modlar yazılır**; 2 kişilik maçlar sıralamaya gitmez.

Yerel rekorlar `localStorage`'da tutulur (`oyunMerkezi_<oyun>`). Sıralama kapalıyken ya da internet yokken oyunlar eskisi gibi çalışır, sadece sıralama gizlenir.

## Gizlilik

- **Gerçek ad ya da e-posta toplanmaz.** Sadece takma ad (2-12 karakter) istenir; her yerde "Gerçek adını yazma, takma ad kullan" uyarısı vardır.
- Takma adlar basit bir uygunsuz kelime filtresinden geçer (`skor.js` içindeki `YASAK_PARCA` / `YASAK_TAM` listelerine kelime eklenebilir).
- Sadece Supabase'in **anon public** anahtarı kullanılır. `service_role` anahtarını **hiçbir dosyaya yazmayın**.

## Kurulum (Supabase ortak sıralama)

1. <https://supabase.com> adresinde ücretsiz hesap açın ve **New project** ile proje oluşturun.
2. Sol menüden **SQL Editor > New query** açın, `supabase/kurulum.sql` dosyasının tamamını yapıştırıp **Run** deyin. (Tablo, güvenlik kuralları, oyun bazlı puan sınırları ve spam koruması kurulur.)
3. **Project Settings > API** sayfasından iki değeri alın: **Project URL** ve **anon public** anahtarı.
4. `config.js` dosyasını açıp yer tutucuları değiştirin:
   ```js
   window.OYUN_AYAR = { SUPABASE_URL: "https://xxxx.supabase.co", SUPABASE_ANON_KEY: "eyJ..." };
   ```
5. Dosyayı kaydedip siteyi yenileyin. Ana sayfada **Sıralama** bağlantısı görünür.

`config.js` yer tutucu halindeyken sıralama sessizce kapalı kalır.

## Yayınlama (GitHub Pages)

Tüm bağlantılar göreli olduğu için site alt klasörde (`github.io/depo-adi/`) de çalışır.

1. GitHub'da depoyu açın (Public). `oyun-merkezi` klasörünün içeriğini deponun köküne (ya da bu depodaki gibi alt klasöre) yükleyin.
2. Depoda **Settings > Pages > Build and deployment > Source: Deploy from a branch** seçin, **Branch: main / (root)** yapıp **Save** deyin.
3. Bir iki dakika sonra adres hazır olur: `https://KULLANICIADI.github.io/DEPO-ADI/`  
   (Bu depoda site alt klasördedir: `https://KULLANICIADI.github.io/DEPO-ADI/oyun-merkezi/`; kökteki `index.html` oraya yönlendirir.)
4. `config.js` içindeki gerçek değerleri commit'lemeyi unutmayın (anon anahtar herkese açıktır, güvenlik veritabanı kurallarındadır).

## Supabase ücretsiz paketi hakkında

Ücretsiz paketteki projeler **1 hafta hiç kullanılmazsa duraklatılır**. Sıralama kaybolmuş gibi görünürse Supabase panelinde projeyi açıp **Restore / Resume project** ile tekrar başlatın. Duraklatılmışken oyunlar çalışmaya devam eder, sadece sıralama "yüklenemedi" der. Puanlar internet yokken yerelde bekler ve bağlantı gelince gönderilir (en fazla 20 kayıt).

## Klasör yapısı

```
index.html, merkez.css      ana sayfa
siralama.html               oyun sekmeli sıralama sayfası
config.js                   Supabase ayarı (yer tutucu)
skor.js                     ortak sıralama kodu (global "Skor")
supabase/kurulum.sql        veritabanı kurulumu
oyunlar/ortak.css           oyunların ortak stili
oyunlar/piksel.js           ortak piksel çizim, ses, tam ekran, menü kodu (global "Px")
oyunlar/<oyun>/index.html   her oyun tek dosya
```

## Sürüm geçmişi

Yeni bir değişiklik yayınlarken `surum.js` içindeki numarayı artır ve buraya bir satır ekle.

| Sürüm | Neler değişti |
|---|---|
| 1.9.3 | HAZIRLAN geri sayımı olan tüm oyunlarda (Basket, Futbol, Pong, Voleybol, Zıpla) herhangi bir tuşa basınca ya da dokununca geri sayım atlanır; iki satırlı ipucu |
| 1.9.4 | Uzay Savaşı: gemi artık araba gibi ileri-geri de gidiyor (▲ ▼ / W S tuşları ya da ▲ İLERİ / ▼ GERİ butonları) |
| 1.9.5 | Basketbol: sayı ve pota/tahta çarpmalarında belirgin ekran sallanması, daha güçlü file ve pota sallanması |
| 1.9.6 | Basketbol: top artık eskisi kadar çok sekmiyor |
| 1.9.7 | Basketbol: Basket Random gibi 1'e 1, karakterler küçüldü; kontrol seçeneği "TEK TUŞ" / "İLERİ-GERİ + ZIPLA" |
| 1.9.8 | Basketbol: karakter oranları düzeltildi (küçük kafa, uzun bacak); karakterler Basket Random gibi sallanıyor (gövde yaylanıyor, kollar savruluyor) |
| 1.9.9 | Basketbol: sallanma momentuma göre (koşarken öne yatar, sert inişte/çarpmada yere yatacak kadar savrulur); karakterler iç içe girmez |
| 1.9.10 | Basketbol: 2'ye 2 geri geldi; karakter piksel sprite olarak ayaktan dönüyor, sallanma yumuşatıldı; karakterler daha uzak durur |
| 1.9.11 | Basketbol: karakterler uzun ve ince, kafa küçük; sallanma yavaş ve daha belirgin |
| 1.9.12 | Futbol: pas her zaman takım arkadaşına gider |
| 1.9.13 | Basketbol: karakterler ayrı PNG dosyaları; ayaktan dönerken pikseller çapraz yumuşak döner |
| 1.9.14 | Basketbol: PNG karakterler net (bulanıklık giderildi) |
| 1.9.15 | Futbol: 5 dk maç, 1 dk uzatma, penaltı atışları (sol/orta/sağ + kaleci uçuşu), zayıflatılmış kaleciler; Basketbol: karakterler iç içe geçebilir |
| 1.9.16 | Futbol: önden görünümlü penaltı, korner / taç / kale vuruşu, K yerden-H havadan pas, I ile kafa golü, telefon düğmeleri |
| 1.9.17 | Kale Savaşı: Geri çek / Hücum anında etki eder (okçular da çekilir, hızlı ve takılmadan); Futbol: kornerde yerden pas da ulaşıyor |
| 1.9.18 | Futbol: topla çizgiye yaslanınca taç / korner veriliyor (daha sık görülür) |
| 1.9.19 | Futbol: yeni tuş düzeni (iki takım için ayrı şut/pas/korner/havadan/kafa/taç tuşları) |
| 1.9.20 | Futbol: saha çizgilerinin dışında yer (taç/korner atan dışarıdan atar), paslar bazen dışarı gider |
| 1.9.21 | Basketbol: karakterler iç içe geçmiyor (birbirini itiyor), daha dolgun gövde, küçük göz, botlar takılmıyor |
| 1.9.22 | Futbol: şut ve pas tuşları yer değiştirdi (Kırmızı E şut / Q pas, Mavi P şut / I pas) |
| 1.9.23 | Futbol: kaleci topu tutunca oyuncu yerden/havadan atar (otomatik kalecide de); röveşata (Kırmızı V, Mavi /). Basketbol: havada sallanma yok, siyah kenar çizgisi yok |
| 1.9.24 | Basketbol: havada sallanma yok, karakter gittiği yöne doğru yatar |
| 1.9.25 | Basketbol: yeni karakter PNG'leri (Basket Random tarzı: siyah kenarlı, ince gövde; kırmızı ve sarı-mor takım) |
| 1.9.26 | Basketbol: karakterler piksel değil, pürüzsüz (vektör) çiziliyor |
| 1.9.27 | Basketbol: karakterler köşeli, kare kafa ve kare göz |
| 1.9.28 | Basketbol: sağdaki oyuncuların ayakları doğru yöne bakıyor |
| 1.9.29 | Kale Savaşı: golemler nerflendi (can, hasar, zırh azaldı; oyuncu golemi 170 altın) |
| 1.9.30 | Kale Savaşı: düşmanlar güçlendirildi (can +%20, hasar +%15; taş/demir golem eski güçlerinin üstüne çıktı) |
| 1.9.31 | Kale Savaşı: askerler arkalarındaki yakın düşmana dönüp vurabiliyor |
| 1.9.32 | Basketbol: zıplarken basılan yöne yatık kalır, havada sallanmaz/değişmez |
| 1.9.33 | Basketbol: oyuncular artık iç içe girmiyor (daha geniş mesafe, havada da) |
| 1.9.34 | Basketbol: yerde de sallanma/yaylanma yok (çok tuşlu mod dahil) |
| 1.9.35 | Kale Savaşı: askerler 3 şeritte yan yana ilerler, sıra beklemez, 3 kişi aynı anda savaşır |
| 1.9.36 | Kale Savaşı: KULE sekmesinde sadece kule al/yükselt, kapasite dolunca alım kilitlenir + uyarı; KALE ONAR eklendi |
| 1.9.37 | Kale Savaşı: golemler Iron Golem tarzı (kol kaldırıp vurur, detaylı), golemler hızlandı; mancınık gibi uzun menzilliler kısa menzilli askerleri durdurmaz |
| 1.9.38 | Kale Savaşı: mancınığı iki adam omuzda taşır (asker ve ork mancınığı) |
| 1.9.39 | Kale Savaşı: HÜCUM modunda askerler birbirini beklemez, herkes kendi menziline gelene kadar ilerler |
| 1.9.40 | Kale Savaşı: kısa menzilli askerler ve golem, mancınık durunca durmaz; menzillerine gelene kadar ilerler |
| 1.9.41 | Basketbol: yakına girip zıplayarak top çalınır, nişan çizgisi yalnızca şut çekerken görünür, güç daha yavaş dolar |
| 1.9.42 | Basketbol: oyuncular birbirinin üstünden atlayabilir; top çalma düzeltildi (top eldeyken hiç çalışmıyordu) |
| 1.9.43 | Basketbol: SMAÇ (Q / P) ve TOP ÇAL (E / I) tuşları + ekran butonları, sayıdan sonra oyuncular yerinde kalır |
| 1.9.44 | Futbol: oyun biraz yavaşladı, golden sonra yavaş çekim GOL TEKRARI (bir tuşla atlanır, menüden açılıp kapanır) |
| 1.9.45 | Futbol: pas yürürken de verilir; JOYSTICK/gamepad desteği (çubuk/yön tuşu + düğmeler; Futbol, Basket, Voleybol, Pong 2 kolla; diğer oyunlar ok tuşları + A=Boşluk, Start=Boşluk) |
| 1.9.46 | Futbol: yavaşlatma yüzünden kaçan tek basışlı tuşlar (havadan pas, kafa, röveşata, pas) düzeltildi |
| 1.9.47 | Futbol: röveşata animasyonu (oyuncu havaya sıçrayıp takla atar) |
| 1.9.48 | Futbol: ekranda dokunmatik JOYSTICK (yön butonları yerine) |
| 1.9.49 | Basketbol: sayıdan sonra oyuncular yine başlangıç noktalarına dizilir (top el değiştirince yer değişmez) |
| 1.9.50 | Futbol: botlar arada sırada topu dışarı atar, böylece taç ve korner sık yaşanır |
| 1.9.51 | Basketbol: smaçta pota kadar yükselemezse oyuncu havada otomatik şut çeker |
| 1.9.52 | Futbol: havadaki topa kafa/röveşata tuşu: %25 röveşata, %25 kafa, %50 IŞKA |
| 1.9.53 | Basketbol: süre kalktı, ilk 5 sayıyı yapan kazanır; top kenarda sıkışmaz; topla geriye eğilme; şutta eller arkaya |
| 1.9.54 | Basketbol: başkasının üstünden atlayan oyuncu yan yatar |
| 1.9.55 | Kale Savaşı: arkadaki düşmana daha uzaktan dönülür; hücumda arkada düşman bırakılmaz |
| 1.9.56 | Futbol: gol olunca röveşata animasyonu biter |
| 1.9.57 | Yeni oyun: Kaktüs Dansı (ritim: oklar düşünce ok/WASD tuşuna bas; Supabase için supabase/dans-ekle.sql) |
| 1.9.58 | Dans oyunu: tema robot dansı oldu (neon ızgara, robot dansçı) |
| 1.9.59 | Dans oyunu: tema Kaktüs Dansı (çöl gün batımı, dikenli kaktüs dansçı) |
| 1.9.60 | Kaktüs Dansı: dansçı tam piksel Spike tarzı (kısa-geniş gövde, çiçek, dikenler, geniş gözler, gülümseme) |
| 1.9.61 | Kaktüs Dansı: Spike daha benzer (büyük pembe çiçek, tamamen siyah gözler, lacivert şort, ayakkabı) + kombo 10 katlarında ikonik dönme dansı |
| 1.9.62 | Kaktüs Dansı: dansçı artık piksel değil, referanstaki gibi vektör Spike (kırmızı çiçek, koyu gözler/ağız, mor yelek, yumruklar, şort) |
| 1.9.63 | Kaktüs Dansı: Spike daha benzer (geniş gövde, büyük koyu gözler/ağız, geniş kırmızı taç, kalın mor yelek) |
| 1.9.64 | Kaktüs Dansı: gecikme giderildi (Spike bir kez çizilip önbellekten basılıyor) |
| 1.9.65 | Kaktüs Dansı: tuş/dokunma gecikmesi giderildi (basışlar kuyruğa alınıyor, kare arasında kaybolmuyor) |
| 1.9.66 | Kale Savaşı: karşı-birim sistemi (süvari/uçan/menzilli/tank/kuşatma), yeni ÇEKİÇÇİ ve ARBALETÇİ, mancınık nerf, yan kuleleri onaran buton, yeni yükseltmeler (kule zırhı, kritik, yenilenme) ve daha yüksek seviyeler, kalabalık dalgalar + özel saldırı olayları |
| 1.9.67 | Ok tuşları ters T düzeninde (▲ üstte, ◀▼▶ altta); geniş ekranda tek ve iki kişilik oyunlarda kontroller oyunun sol ve sağ yanında (Yılan, Dans, Tetris, Araba, Uzay, Pong, Voleybol, Basket, Futbol) |
| 1.9.68 | Futbol: ekrandaki düğmeler küçültüldü |
| 1.9.69 | Futbol: joystick büyütüldü |
| 1.9.70 | Futbol: joystick ve düğme boyutları ekran boyutuna göre otomatik ayarlanır |
| 1.9.71 | Araba: sağ/sol düğmeleri solda, ileri/geri düğmeleri sağda |
| 1.9.72 | Uzay: sağ/sol düğmeleri solda, ileri/geri düğmeleri sağda |
| 1.9.73 | Basket: hareket düğmeleri solda, eylem düğmeleri sağda (tek tuş modunda hepsi sağda) |
| 1.9.74 | Voleybol: sol/sağ düğmeleri yan yana |
| 1.9.75 | Yılan: başlangıçta geri dönüp ölme düzeltildi; tüm oyunlarda yazı katmanı her karede düzen ölçmüyor (gecikme azaltıldı) |
| 1.9.76 | Futbol tam ekran düzeltildi (yan kontroller hesaba katıldı, yazı katmanı hizalandı) |
| 1.9.77 | Futbol 2 kişilik: joystick altta, düğmeler üstte (el hizası); Kale Savaşı mağara çizgileri taşmıyor |
| 1.9.78 | Futbol: joystick ve düğmeler alta hizalandı |
| 1.9.79 | Araba/Uzay/Basket: sağ-sol yan yana, tüm yan kontroller alta hizalı |
| 1.9.80 | Basket: tek tuş modunda (1 ve 2 oyuncu) topla sağa-sola sallanma ◀ ▶ eklendi |
| 1.9.81 | Basket smaç %50 olasılık; Tetris tuş tekrarı ve ses gecikmesi azaltıldı |
| 1.9.82 | Basket: tek tuşta yön oku kaldırıldı |
| 1.9.83 | Basket tek tuş: ◀ ▶ geri alındı; topla kısa bas = sallan, basılı tut = zıpla |
| 1.9.84 | Yan kontroller ekranın dibinden yukarı alındı |
| 1.9.85 | Her maç sonunda puan direkt sıralamaya gider; takma ad yoksa otomatik "Oyuncu1234" verilir |
| 1.9.86 | Basket tek tuş: sallanma otomatik (tuş sadece zıplatır) |
| 1.9.87 | Basket tek tuş: otomatik sallanma artık görünür (sürekli sağa-sola yürür) |
| 1.9.88 | Basket tek tuş: iki adam da yavaşça sallanır (gövde yatar) |
| 1.9.89 | Basket tek tuş: sallanırken hangi tarafa yatıksa zıplayınca o yöne atılır |
| 1.9.90 | Basket tek tuş: tuşu bırakınca (havada ya da yerde) topu tutan hemen şutlar |
| 1.9.91 | Basket tek tuş: topsuzken topa yakınsan top sana gelir (algoritma: sallanma yönünde zıpla, bırakınca şut) |
| 1.9.92 | Basket: top çekimi atıştan sonra ve hızlı toplarda devreye girmez (bot atışı geri dönmesin) |
| 1.9.93 | Kale Savaşı: çıkıp girince tam kaldığın yerden devam (askerler, düşmanlar, dalga sırası; 3 sn'de bir + çıkarken kayıt) |
| 1.9.94 | Tuşa uzun basınca çıkan kopyala/seç menüsü engellendi |
| 1.9.95 | Araba Kaçış ve Uzay Savaşı: BUTONLAR / JOYSTICK kontrol seçeneği (seçim hatırlanır) |
| 1.9.96 | Araba joystick: basılı tutunca sürekli sağa/sola şerit değiştirir |
| 1.9.97 | Yeni oyun: Piksel Balık (küçükleri ye, büyü; ekranı kaplayınca kamera uzaklaşır; Supabase için supabase/balik-ekle.sql) |
| 2.0.3 | Piksel Balık, Uzay, Araba: ◀ SOL / SAĞ ▶ solda yan yana, ▲ ▼ sağda (telefonda da) |
| 2.0.2 | Piksel Balık: "UZAKLAŞTI!" yazısı kaldırıldı |
| 2.0.1 | Ayarlar: "Başlangıç canı" ayarı kaldırıldı |
| 2.0.0 | Piksel Balık: dönüşte yumuşak çevirme animasyonu, ekranda büyük "UZAKLAŞTI!" yazısı |
| 1.9.99 | Yeni **Ayarlar** sayfası (ana menü): ses, hız, arayüz boyutu, takma ad, oyun başına hız/kontrol/can; Piksel Balık oklar tek artı (D-pad) |
| 1.9.98 | Piksel Balık: kademeli zoom (ekranı çok kaplayınca bir kez uzaklaşır) + detaylı deniz (resif, yosun, mercan, denizanası, uzak balık sürüleri, derinlik) + desenli/yüzgeçli balıklar |
| 1.9.2 | Menülü gerçek zamanlı oyunlarda (Araba, Basket, Futbol, Pong, Voleybol, Kale Savaşı) mod seçilince de BAŞLA kapısı (herhangi bir tuş ya da dokunma) |
| 1.9.1 | Uygulama güncellemesi düzeltildi: yeni sürüm hemen iner ve sayfa kendiliğinden yenilenir |
| 1.9 | Araba: Engelli (dubalı, çukurlu, sıralamalı) ve Engelsiz (sadece trafik) mod seçimi; tüm oyunlarda oyun bitince Boşluk (Space) ile tekrar oyna |
| 1.8 | Uygulama olarak yükleme (PWA): ana ekranda "Uygulama olarak yükle" düğmesi, çevrimdışı çalışma, uygulama simgesi |
| 1.7 | Arayüz boyutu artık ayar çubuğu: %50 - %150 arası (büyütme de var), %100'e sıfırla düğmesi |
| 1.6 | Ana ekranda sürüm numarası; README'de sürüm geçmişi |
| 1.5 | Araba: "HAZIRLAN 3-2-1" geri sayımı tuşa basınca / dokununca atlanır (iki satırlı yazı) |
| 1.4 | Tam ekrandan çıkınca oyunun büyük kalması düzeltildi; sağ üstte UI boyutu düğmesi (%100 / %90 / %75 / %60); "herhangi bir tuşa bas ya da dokun" ile başlama |
| 1.3 | Menüsü olmayan oyunlara BAŞLA kapısı; Araba: ileri-geri hareket, araçlar iç içe geçmez, yavaş başlangıç; Zıpla kartı astronot |
| 1.2 | Zıpla: oyuncu astronot, canavar yeşil uzaylı |
| 1.1 | Kale Savaşı: 4 katlı 20 maden, güç/hız kuleleri, kapasite sekmesi, yola doğru eğik yol ve 6+6 kule dizilimi; Simon, Basket, Tetris, Platform, Futbol, Kelime, Hafıza, Yılan düzeltmeleri |
| 1.0 | İlk yayın: 20 oyun, Supabase sıralama, GitHub Pages |

## Uygulama olarak yükleme

Ana ekrandaki **📲 Uygulama olarak yükle** düğmesi (Chrome/Edge/Android) siteyi telefona, tablete ya da bilgisayara uygulama gibi kurar; bir kez açıldıktan sonra internetsiz de çalışır. iPhone/iPad'de: Paylaş → "Ana Ekrana Ekle". Sürüm numarası (`surum.js`) değişince önbellek kendiliğinden yenilenir. Sürüm değişince `surum.js` ile `sw.js` içindeki `SURUM` değerini birlikte değiştir. Yeni dosya eklenirse `sw.js` içindeki `DOSYALAR` listesine de ekle.
