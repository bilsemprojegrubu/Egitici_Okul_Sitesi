// Çevrimdışı çalışma + uygulama olarak yükleme. Sürüm numarası değişince önbellek yenilenir.
// DİKKAT: sürüm değişince surum.js ile BİRLİKTE burayı da değiştir (tarayıcı güncellemeyi bu dosyadaki değişiklikten anlar).
var SURUM = "1.9.23";
var AD = "oyun-merkezi-" + SURUM;
var DOSYALAR = [
  "config.js",
  "ikon/ikon-192.png",
  "ikon/ikon-512.png",
  "ikon/ikon-maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "merkez.css",
  "oyunlar/2048/index.html",
  "oyunlar/araba/index.html",
  "oyunlar/balon/index.html",
  "oyunlar/basket/index.html",
  "oyunlar/basket/karakter/bacak0.png",
  "oyunlar/basket/karakter/bacak1.png",
  "oyunlar/basket/karakter/bacak2.png",
  "oyunlar/basket/karakter/govde0.png",
  "oyunlar/basket/karakter/govde1.png",
  "oyunlar/basket/karakter/kafa0.png",
  "oyunlar/basket/karakter/kafa1.png",
  "oyunlar/basket/karakter/kol0.png",
  "oyunlar/basket/karakter/kol1.png",
  "oyunlar/bilgi-kalesi/index.html",
  "oyunlar/futbol/index.html",
  "oyunlar/hafiza/index.html",
  "oyunlar/kelime/index.html",
  "oyunlar/kelime/kelimeler.js",
  "oyunlar/kelime/kelimeler2.js",
  "oyunlar/kelime/kelimeler3.js",
  "oyunlar/kelime/kelimeler4.js",
  "oyunlar/kelime/kelimeler5.js",
  "oyunlar/kostebek/index.html",
  "oyunlar/kus/index.html",
  "oyunlar/mayin/index.html",
  "oyunlar/ortak.css",
  "oyunlar/piksel.js",
  "oyunlar/platform/index.html",
  "oyunlar/pong/index.html",
  "oyunlar/simon/index.html",
  "oyunlar/tetris/index.html",
  "oyunlar/tugla/index.html",
  "oyunlar/uzay/index.html",
  "oyunlar/voleybol/index.html",
  "oyunlar/yilan/index.html",
  "oyunlar/zipla/index.html",
  "siralama.html",
  "skor.js",
  "surum.js",
  "./"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(AD).then(function (c) { return c.addAll(DOSYALAR.map(function (d) { return new Request(d, { cache: "reload" }); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (x) { return x !== AD; }).map(function (x) { return caches.delete(x); }));
  }).then(function () { return self.clients.claim(); }));
});
// Önce önbellek, arkada güncelle. Başka siteye giden istekler (Supabase) olduğu gibi geçer.
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(AD).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (h) {
      var ag = fetch(r, { cache: "no-cache" }).then(function (y) { if (y && y.ok) c.put(r, y.clone()); return y; }).catch(function () { return h; });
      return h || ag;
    });
  }));
});
