/* skor.js — Oyun Merkezi ortak sıralama kodu.
 * Kütüphane yok: Supabase'in REST adresine düz fetch ile istek atılır.
 * Hiçbir fonksiyon hata fırlatmaz; internet/Supabase yoksa oyun eskisi gibi çalışır,
 * sadece sıralama paneli gizlenir ya da "yüklenemedi" der.
 * Gerçek ad/e-posta toplanmaz: yalnızca takma ad (2-12 karakter). */
(function (global) {
  "use strict";

  // Geçerli oyun kodları (kurulum.sql içindeki liste ile aynı olmalı)
  var OYUN_ADLARI = {
    "bilgi-kalesi": "🏰 Bilgi Kalesi", "yilan": "🐍 Yılan", "2048": "🔢 2048",
    "hafiza": "🃏 Hafıza", "balon": "🎈 Balon", "kelime": "🔤 Kelime",
    "futbol": "⚽ Futbol", "platform": "🏃 Platform", "tetris": "🧱 Tetris",
    "kus": "🐦 Kuş", "basket": "🏀 Basket", "voleybol": "🏐 Voleybol"
  };
  var OYUNLAR = Object.keys(OYUN_ADLARI);

  var ANAHTAR_AD = "oyunMerkezi_ad";
  var ANAHTAR_KUYRUK = "oyunMerkezi_kuyruk";
  var MAKS_KUYRUK = 20;      // kuyrukta en fazla bu kadar kayıt tutulur
  var ZAMAN_ASIMI = 5000;    // ms

  // ---- Uygunsuz kelime filtresi (kolay genişletilebilir) ----
  // Listeye yeni kelime eklemek için sadece diziye yazın (küçük harf, Türkçe karakter olabilir).
  // PARCA: kelimenin içinde geçmesi yeter. TAM: yalnızca tek başına yazılırsa engellenir
  // (kısa kelimeler masum adları engellemesin diye).
  var YASAK_PARCA = ["orospu", "siktir", "yarrak", "amcik", "gotveren", "ibne", "pezevenk",
    "serefsiz", "gerizekali", "kahpe", "fuck", "shit", "bitch", "pussy", "porn", "nigger"];
  var YASAK_TAM = ["amk", "aq", "sik", "got", "pic", "mal", "salak", "aptal", "sex", "ass",
    "dick", "oc", "anan", "hitler"];

  // ---- localStorage yardımcıları (hepsi try/catch içinde) ----
  function depoOku(k) { try { return global.localStorage.getItem(k); } catch (e) { return null; } }
  function depoYaz(k, v) { try { global.localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  // ---- Ayar ----
  function acik() {
    try {
      var a = global.OYUN_AYAR || {};
      var u = String(a.SUPABASE_URL || ""), k = String(a.SUPABASE_ANON_KEY || "");
      return /^https:\/\/\S+$/.test(u) && u.indexOf("BURAYA") < 0 && k.length > 20 && k.indexOf("BURAYA") < 0;
    } catch (e) { return false; }
  }
  function adres() { return String(global.OYUN_AYAR.SUPABASE_URL).replace(/\/+$/, ""); }

  // ---- Takma ad ----
  function takmaAd() {
    var a = depoOku(ANAHTAR_AD);
    return typeof a === "string" ? a : "";
  }

  // Metni filtre için sadeleştirir: küçük harf, Türkçe karakterleri ASCII yap, leet çöz, tekrarları azalt
  function sadelestir(s) {
    var t = String(s).toLocaleLowerCase("tr");
    var harita = { "ı": "i", "ö": "o", "ü": "u", "ş": "s", "ç": "c", "ğ": "g", "â": "a", "î": "i", "û": "u",
      "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s" };
    t = t.replace(/[ıöüşçğâîû013458@$]/g, function (c) { return harita[c] || c; });
    t = t.replace(/[^a-z ]/g, "");
    return t.replace(/(.)\1+/g, "$1");
  }
  var YP = YASAK_PARCA.map(sadelestir), YT = YASAK_TAM.map(sadelestir);
  function uygunsuzMu(ad) {
    var s = sadelestir(ad);
    var bitisik = s.replace(/ /g, "");
    for (var i = 0; i < YP.length; i++) { if (bitisik.indexOf(YP[i]) >= 0) return true; }
    var kelimeler = s.split(" ");
    for (var j = 0; j < kelimeler.length; j++) { if (YT.indexOf(kelimeler[j]) >= 0) return true; }
    return YT.indexOf(bitisik) >= 0;
  }

  // Adı temizler, doğrular ve kaydeder. Dönen: {ok:true, ad} ya da {ok:false, hata}
  function adKaydet(ad) {
    try {
      var t = String(ad == null ? "" : ad).replace(/\s+/g, " ").trim();
      if (t.length < 2) return { ok: false, hata: "Takma ad en az 2 karakter olmalı." };
      if (t.length > 12) return { ok: false, hata: "Takma ad en fazla 12 karakter olabilir." };
      if (!/^[0-9A-Za-z_ çğıöşüÇĞİÖŞÜâîûÂÎÛ]+$/.test(t)) {
        return { ok: false, hata: "Sadece harf, rakam, boşluk ve alt çizgi kullanabilirsin." };
      }
      if (uygunsuzMu(t)) return { ok: false, hata: "Bu takma ad uygun değil, başka bir ad seç." };
      depoYaz(ANAHTAR_AD, t);
      try { global.dispatchEvent(new CustomEvent("skor-ad", { detail: t })); } catch (e) { /* eski tarayıcı */ }
      return { ok: true, ad: t };
    } catch (e) { return { ok: false, hata: "Takma ad kaydedilemedi." }; }
  }

  // ---- Ağ ----
  // Zaman aşımlı fetch (AbortController). Hata fırlatmaz, reddedilen söz döndürebilir; çağıranlar yakalar.
  function istek(yol, secenek) {
    var kontrol = typeof AbortController === "function" ? new AbortController() : null;
    var sayac = setTimeout(function () { try { if (kontrol) kontrol.abort(); } catch (e) { } }, ZAMAN_ASIMI);
    var a = global.OYUN_AYAR, s = secenek || {};
    // Eski tip anahtarlar (eyJ...) JWT'dir ve Bearer olarak da gönderilir.
    // Yeni tip "sb_publishable_..." anahtarlar JWT değildir: sadece apikey başlığı gönderilir.
    var baslik = { apikey: a.SUPABASE_ANON_KEY };
    if (String(a.SUPABASE_ANON_KEY).indexOf("eyJ") === 0) baslik.Authorization = "Bearer " + a.SUPABASE_ANON_KEY;
    s.headers = Object.assign(baslik, s.headers || {});
    if (kontrol) s.signal = kontrol.signal;
    return global.fetch(adres() + yol, s).then(function (r) { clearTimeout(sayac); return r; },
      function (e) { clearTimeout(sayac); throw e; });
  }

  // Tek kaydı gönderir. {tamam, kalici}: kalici=true ise sunucu reddetti, tekrar denemenin anlamı yok
  function gonderHam(kayit) {
    try {
      return istek("/rest/v1/skorlar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(kayit)
      }).then(function (r) {
        if (r.ok) return { tamam: true };
        var kalici = r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429;
        return { tamam: false, kalici: kalici };
      }, function () { return { tamam: false, kalici: false }; });
    } catch (e) { return Promise.resolve({ tamam: false, kalici: false }); }
  }

  // ---- Çevrimdışı kuyruk ----
  function kuyrukOku() {
    try {
      var l = JSON.parse(depoOku(ANAHTAR_KUYRUK) || "[]");
      return Array.isArray(l) ? l.filter(kayitGecerli).slice(-MAKS_KUYRUK) : [];
    } catch (e) { return []; }
  }
  function kuyrukYaz(l) { depoYaz(ANAHTAR_KUYRUK, JSON.stringify(l.slice(-MAKS_KUYRUK))); }
  function kayitGecerli(k) {
    return k && OYUNLAR.indexOf(k.oyun) >= 0 && typeof k.takma_ad === "string" &&
      typeof k.puan === "number" && k.puan >= 0 && k.puan <= 100000;
  }
  // Aynı oyun+ad için sadece en yüksek puan tutulur (spam ve hız sınırı için)
  function enYuksekleriSec(l) {
    var harita = {}, sira = [];
    l.forEach(function (k) {
      var a = k.oyun + "|" + k.takma_ad.toLowerCase();
      if (!harita[a]) { harita[a] = k; sira.push(a); } else if (k.puan > harita[a].puan) { harita[a] = k; }
    });
    return sira.map(function (a) { return harita[a]; });
  }
  function kuyrugaEkle(kayit) {
    try { kuyrukYaz(enYuksekleriSec(kuyrukOku().concat([kayit]))); } catch (e) { }
  }

  var bosaltiyor = false;
  // Kuyruktaki puanları göndermeyi dener (sayfa açılışında ve "online" olayında çağrılır)
  function kuyrukBosalt() {
    try {
      if (!acik() || bosaltiyor) return Promise.resolve();
      var ilk = kuyrukOku();
      if (!ilk.length) return Promise.resolve();
      bosaltiyor = true;
      var liste = enYuksekleriSec(ilk), kalan = [], dur = false;
      return liste.reduce(function (p, kayit) {
        return p.then(function () {
          if (dur) { kalan.push(kayit); return; }
          return gonderHam(kayit).then(function (s) {
            if (!s.tamam && !s.kalici) { kalan.push(kayit); dur = true; } // ağ yok: kalanları da sakla
          });
        });
      }, Promise.resolve()).then(function () {
        // Gönderim sürerken eklenmiş yeni kayıtları kaybetme
        var eskiler = ilk.map(function (k) { return JSON.stringify(k); });
        var yeniler = kuyrukOku().filter(function (k) { return eskiler.indexOf(JSON.stringify(k)) < 0; });
        kuyrukYaz(enYuksekleriSec(kalan.concat(yeniler)));
        bosaltiyor = false;
      }).catch(function () { bosaltiyor = false; });
    } catch (e) { bosaltiyor = false; return Promise.resolve(); }
  }

  // Puanı Supabase'e yollar; başarısızsa kuyruğa ekler. Dönen söz: true (gitti) / false
  function gonder(oyun, puan) {
    try {
      if (!acik()) return Promise.resolve(false);
      puan = Math.floor(Number(puan));
      var ad = takmaAd();
      if (!ad || OYUNLAR.indexOf(oyun) < 0 || !isFinite(puan) || puan < 0 || puan > 100000) return Promise.resolve(false);
      var kayit = { oyun: oyun, takma_ad: ad, puan: puan };
      return gonderHam(kayit).then(function (s) {
        if (s.tamam) return true;
        if (!s.kalici) kuyrugaEkle(kayit);
        return false;
      }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  // İlk n skoru getirir; başarısızsa null
  function liste(oyun, adet) {
    try {
      if (!acik() || OYUNLAR.indexOf(oyun) < 0) return Promise.resolve(null);
      adet = Math.max(1, Math.min(50, parseInt(adet === undefined ? 10 : adet, 10) || 10));
      var yol = "/rest/v1/skorlar?oyun=eq." + encodeURIComponent(oyun) +
        "&select=takma_ad,puan&order=puan.desc&limit=" + adet;
      return istek(yol, { method: "GET" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!Array.isArray(d)) return null;
          return d.filter(function (k) { return k && typeof k.takma_ad === "string" && typeof k.puan === "number"; }).slice(0, adet);
        }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  // ---- Arayüz: sıralama paneli ----
  var jetonSayaci = 0;
  function eleman(tag, metin, sinif) {
    var e = document.createElement(tag);
    if (metin != null) e.textContent = metin; // kullanıcı verisi ASLA innerHTML ile basılmaz
    if (sinif) e.className = sinif;
    return e;
  }
  function paneliCiz(kap, oyun) {
    try {
      if (!kap) return Promise.resolve();
      if (!acik()) { kap.hidden = true; kap.textContent = ""; return Promise.resolve(); }
      var jeton = ++jetonSayaci;
      kap._jeton = jeton;
      kap.hidden = false;
      kap.textContent = "";
      kap.appendChild(eleman("h3", "🏆 En İyi 10"));
      var durum = eleman("p", "Yükleniyor...", "sira-durum");
      kap.appendChild(durum);
      return liste(oyun, 10).then(function (d) {
        if (kap._jeton !== jeton) return; // daha yeni bir çizim başladı
        if (d === null) { durum.textContent = "Sıralama şu an yüklenemedi"; return; }
        if (!d.length) { durum.textContent = "Henüz kayıt yok, ilk sen ol!"; return; }
        var ol = eleman("ol");
        var ben = takmaAd().toLowerCase();
        d.forEach(function (k) {
          var li = eleman("li", null, k.takma_ad.toLowerCase() === ben ? "ben" : "");
          li.appendChild(eleman("span", k.takma_ad, "sira-ad"));
          li.appendChild(eleman("b", String(k.puan)));
          ol.appendChild(li);
        });
        kap.replaceChild(ol, durum);
      }).catch(function () { });
    } catch (e) { return Promise.resolve(); }
  }

  // ---- Yerel rekor (oyunMerkezi_<oyun>) ----
  function rekor(oyun) { return parseInt(depoOku("oyunMerkezi_" + oyun), 10) || 0; }

  // Oyun bitince çağrılır: yerel rekoru günceller, #bitti ekranını açar, sıralamayı çizer.
  // Sadece yerel rekoru geçen puan Supabase'e gönderilir (spam azalsın).
  function oyunBitti(oyun, puan) {
    var sonuc = { yeni: false, rekor: 0 };
    try {
      puan = Math.max(0, Math.floor(Number(puan)) || 0);
      var eski = rekor(oyun);
      sonuc.rekor = eski;
      if (puan > eski) { depoYaz("oyunMerkezi_" + oyun, String(puan)); sonuc.yeni = true; sonuc.rekor = puan; }
      var d = document;
      var bitti = d.getElementById("bitti"), s = d.getElementById("sonuc"),
        p = d.getElementById("siralama"), r = d.getElementById("rekor");
      if (s) s.textContent = "Puanın: " + puan + (sonuc.yeni ? "  🎉 Yeni rekor!" : "");
      if (r) r.textContent = String(sonuc.rekor);
      if (bitti) bitti.hidden = false;
      if (p) paneliCiz(p, oyun);
      if (sonuc.yeni && puan > 0 && acik()) {
        var yolla = function () {
          gonder(oyun, puan).then(function (ok) { if (ok && p) paneliCiz(p, oyun); });
        };
        if (takmaAd()) yolla(); else adSor(yolla);
      }
    } catch (e) { }
    return sonuc;
  }

  // ---- Takma ad penceresi ----
  var stilEklendi = false;
  function stilEkle() {
    if (stilEklendi) return; stilEklendi = true;
    var st = document.createElement("style");
    st.textContent =
      ".skor-ad-ort{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}" +
      ".skor-ad-kutu{background:#1e293b;color:#f1f5f9;border-radius:14px;padding:20px;max-width:340px;width:100%;font-family:system-ui,Arial,sans-serif;box-shadow:0 10px 40px #000a}" +
      ".skor-ad-kutu h2{font-size:1.15rem;margin-bottom:8px}" +
      ".skor-ad-kutu input{width:100%;padding:10px;border-radius:8px;border:2px solid #475569;background:#0f172a;color:#fff;font-size:1rem;margin:8px 0}" +
      ".skor-ad-uyari{font-size:.85rem;color:#fbbf24;margin-bottom:4px}" +
      ".skor-ad-hata{font-size:.85rem;color:#f87171;min-height:1.2em}" +
      ".skor-ad-dugmeler{display:flex;gap:8px;margin-top:8px}" +
      ".skor-ad-dugmeler button{flex:1;padding:10px;border:0;border-radius:8px;font-size:1rem;cursor:pointer;background:#334155;color:#fff}" +
      ".skor-ad-dugmeler button.ana{background:#38bdf8;color:#0f172a;font-weight:700}";
    document.head.appendChild(st);
  }
  // Takma ad penceresini açar. Kaydedilirse devam() çağrılır.
  function adSor(devam) {
    try {
      if (document.getElementById("skorAdPenceresi")) return;
      stilEkle();
      var ort = eleman("div", null, "skor-ad-ort"); ort.id = "skorAdPenceresi";
      var kutu = eleman("div", null, "skor-ad-kutu");
      kutu.appendChild(eleman("h2", "Takma adını yaz"));
      kutu.appendChild(eleman("p", "⚠️ Gerçek adını yazma, takma ad kullan (2-12 karakter).", "skor-ad-uyari"));
      var inp = eleman("input"); inp.type = "text"; inp.maxLength = 12; inp.placeholder = "Örn: SuperKedi";
      inp.setAttribute("autocomplete", "off"); inp.setAttribute("aria-label", "Takma ad");
      inp.value = takmaAd();
      var hata = eleman("div", "", "skor-ad-hata");
      var dug = eleman("div", null, "skor-ad-dugmeler");
      var tamam = eleman("button", "Kaydet", "ana");
      var atla = eleman("button", "Şimdi değil");
      dug.appendChild(atla); dug.appendChild(tamam);
      [inp, hata, dug].forEach(function (x) { kutu.appendChild(x); });
      ort.appendChild(kutu); document.body.appendChild(ort);
      function kapat() { if (ort.parentNode) ort.parentNode.removeChild(ort); }
      function kaydet() {
        var s = adKaydet(inp.value);
        if (!s.ok) { hata.textContent = s.hata; return; }
        kapat();
        if (typeof devam === "function") { try { devam(s.ad); } catch (e) { } }
      }
      tamam.addEventListener("click", kaydet);
      atla.addEventListener("click", function () {
        try { global.sessionStorage.setItem("oyunMerkezi_adAtla", "1"); } catch (e) { }
        kapat();
      });
      inp.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") kaydet(); });
      setTimeout(function () { try { inp.focus(); } catch (e) { } }, 50);
    } catch (e) { }
  }

  // ---- Sayfa açılışı ----
  function basla() {
    try {
      if (!acik()) return;
      var gov = document.body;
      var oyun = gov && gov.getAttribute("data-oyun");
      var r = document.getElementById("rekor");
      if (oyun && r) r.textContent = String(rekor(oyun));
      var atlandi = false;
      try { atlandi = global.sessionStorage.getItem("oyunMerkezi_adAtla") === "1"; } catch (e) { }
      // Oyun sayfasında takma ad yoksa bir kez sor
      if (oyun !== null && gov.hasAttribute("data-oyun") && !takmaAd() && !atlandi) adSor();
      kuyrukBosalt();
    } catch (e) { }
  }
  try {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla); else basla();
    global.addEventListener("online", function () { kuyrukBosalt(); });
  } catch (e) { }

  global.Skor = {
    OYUNLAR: OYUNLAR, OYUN_ADLARI: OYUN_ADLARI,
    acik: acik, takmaAd: takmaAd, adKaydet: adKaydet, adSor: adSor,
    gonder: gonder, liste: liste, paneliCiz: paneliCiz,
    oyunBitti: oyunBitti, rekor: rekor, kuyrukBosalt: kuyrukBosalt, kuyrukOku: kuyrukOku
  };
})(window);
