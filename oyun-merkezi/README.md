# Oyun Merkezi

**Sürüm: 1.6** (ana ekranın sağ alt köşesinde de küçük olarak görünür; numara `surum.js` dosyasındadır)

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
| 1.6 | Ana ekranda sürüm numarası; README'de sürüm geçmişi |
| 1.5 | Araba: "HAZIRLAN 3-2-1" geri sayımı tuşa basınca / dokununca atlanır (iki satırlı yazı) |
| 1.4 | Tam ekrandan çıkınca oyunun büyük kalması düzeltildi; sağ üstte UI boyutu düğmesi (%100 / %90 / %75 / %60); "herhangi bir tuşa bas ya da dokun" ile başlama |
| 1.3 | Menüsü olmayan oyunlara BAŞLA kapısı; Araba: ileri-geri hareket, araçlar iç içe geçmez, yavaş başlangıç; Zıpla kartı astronot |
| 1.2 | Zıpla: oyuncu astronot, canavar yeşil uzaylı |
| 1.1 | Kale Savaşı: 4 katlı 20 maden, güç/hız kuleleri, kapasite sekmesi, yola doğru eğik yol ve 6+6 kule dizilimi; Simon, Basket, Tetris, Platform, Futbol, Kelime, Hafıza, Yılan düzeltmeleri |
| 1.0 | İlk yayın: 20 oyun, Supabase sıralama, GitHub Pages |
