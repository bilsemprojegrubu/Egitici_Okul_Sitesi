// Bilgi Kalesi: düşmanlar kaleye yürür; soruyu doğru bilirsen düşman yok olur.
// Yanlış cevap ya da süre dolması = kale 1 can kaybeder. Puan = ulaşılan dalga.
(function () {
  "use strict";
  var ANAHTAR = "bilgiKalesi_v1";
  var $ = function (id) { return document.getElementById(id); };

  // ---- Yerel kayıt (try/catch içinde) ----
  var KAYIT = { ad: "", enYuksek: 0, siralama: [] };
  try {
    var k = JSON.parse(localStorage.getItem(ANAHTAR) || "null");
    if (k && typeof k === "object") {
      KAYIT.ad = typeof k.ad === "string" ? k.ad : "";
      KAYIT.enYuksek = parseInt(k.enYuksek, 10) || 0;
      KAYIT.siralama = Array.isArray(k.siralama) ? k.siralama.filter(function (r) { return r && typeof r.ad === "string" && typeof r.dalga === "number"; }).slice(0, 10) : [];
    }
  } catch (e) { /* bozuk kayıt: varsayılanla devam */ }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(KAYIT)); } catch (e) { } }

  // Tüm oyunlarda ortak takma ad varsa onu kullan
  try { if (window.Skor && Skor.takmaAd()) KAYIT.ad = Skor.takmaAd(); } catch (e) { }

  // ---- Yerel sıralama (bu cihazda) ----
  var YerelSkor = {
    liste: function () { return KAYIT.siralama.slice(); },
    ekle: function (ad, dalga) {
      KAYIT.siralama.push({ ad: ad || "Oyuncu", dalga: dalga });
      KAYIT.siralama.sort(function (a, b) { return b.dalga - a.dalga; });
      KAYIT.siralama = KAYIT.siralama.slice(0, 10); kaydet();
    }
  };

  // ---- Menü sıralama kartı: önce Supabase, olmazsa yerel liste ----
  function menuListeCiz(kayitlar, not) {
    var kap = $("menuSiralama"); kap.textContent = "";
    var b = document.createElement("h2"); b.textContent = "🏆 Sıralama"; kap.appendChild(b);
    if (!kayitlar.length) { var p = document.createElement("p"); p.className = "ipucu"; p.textContent = "Henüz kayıt yok."; kap.appendChild(p); }
    else {
      var ol = document.createElement("ol");
      kayitlar.forEach(function (r) {
        var li = document.createElement("li"), s = document.createElement("span"), v = document.createElement("b");
        s.textContent = r.ad; v.textContent = "Dalga " + r.puan; li.appendChild(s); li.appendChild(v); ol.appendChild(li);
      });
      kap.appendChild(ol);
    }
    if (not) { var n = document.createElement("p"); n.className = "ipucu"; n.textContent = not; kap.appendChild(n); }
  }
  function menuSiralamaYukle() {
    var yerel = YerelSkor.liste().map(function (r) { return { ad: r.ad, puan: r.dalga }; });
    try {
      if (!window.Skor || !Skor.acik()) { menuListeCiz(yerel, "Bu cihazdaki sıralama"); return; }
      menuListeCiz([], "Yükleniyor...");
      Skor.liste("bilgi-kalesi", 10).then(function (d) {
        if (d) menuListeCiz(d.map(function (r) { return { ad: r.takma_ad, puan: r.puan }; }));
        else menuListeCiz(yerel, "Bu cihazdaki sıralama (ortak sıralama yüklenemedi)");
      });
    } catch (e) { menuListeCiz(yerel, "Bu cihazdaki sıralama"); }
  }

  // ---- Takma ad kutusu ----
  function adKutusunuGuncelle() { $("adKutu").value = KAYIT.ad || ""; }
  $("adKaydetBtn").addEventListener("click", function () {
    var s = window.Skor ? Skor.adKaydet($("adKutu").value) : { ok: true, ad: $("adKutu").value.trim() };
    if (!s.ok) { $("adHata").textContent = s.hata; return; }
    $("adHata").textContent = "Kaydedildi ✔"; KAYIT.ad = s.ad; kaydet();
  });
  window.addEventListener("skor-ad", function (e) { KAYIT.ad = e.detail; kaydet(); adKutusunuGuncelle(); });

  // ---- Oyun ----
  var dalga, can, kalan, soruSirasi, sorular, aktif, sure, toplamSure, zamanlayici, kilit;
  function karistir(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ekranGoster(ad) { ["menu", "oyun"].forEach(function (e) { $(e).hidden = e !== ad; }); }
  function basla() {
    dalga = 1; can = 5; soruSirasi = 0; aktif = true;
    sorular = karistir(window.SORULAR.slice());
    $("bitti").hidden = true; ekranGoster("oyun"); dalgaBaslat();
  }
  function dalgaBaslat() {
    kalan = 2 + dalga; // her dalgada bir düşman daha
    $("bildirim").textContent = "Dalga " + dalga + " başladı!";
    hudYaz(); soruSor();
  }
  function hudYaz() {
    $("hudCan").textContent = "❤️".repeat(can) + "🖤".repeat(5 - can);
    $("hudDalga").textContent = "Dalga " + dalga;
  }
  function soruSor() {
    if (soruSirasi >= sorular.length) { sorular = karistir(window.SORULAR.slice()); soruSirasi = 0; }
    var q = sorular[soruSirasi++];
    var sik = q.c.map(function (m, i) { return { m: m, d: i === q.d }; });
    karistir(sik);
    $("soru").textContent = q.s;
    var kap = $("siklar"); kap.textContent = "";
    sik.forEach(function (s, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "sik"; b.textContent = (i + 1) + ") " + s.m;
      b.addEventListener("click", function () { cevapla(b, s.d); }); kap.appendChild(b);
    });
    kilit = false; toplamSure = Math.max(8, 20 - dalga); sure = toplamSure;
    clearInterval(zamanlayici);
    zamanlayici = setInterval(function () {
      sure -= 0.1; ilerleme();
      if (sure <= 0) { clearInterval(zamanlayici); cevapla(null, false); }
    }, 100);
    ilerleme();
  }
  function ilerleme() {
    var oran = Math.max(0, sure / toplamSure);
    $("sureCubuk").style.width = (oran * 100) + "%";
    $("dusman").style.left = ((1 - oran) * 78) + "%"; // düşman kaleye yaklaşır
  }
  function cevapla(btn, dogru) {
    if (kilit || !aktif) return; kilit = true; clearInterval(zamanlayici);
    Array.prototype.forEach.call($("siklar").children, function (b) { b.disabled = true; });
    if (btn) btn.classList.add(dogru ? "dogru" : "yanlis");
    if (dogru) { $("bildirim").textContent = "✔ Doğru! Düşman yok edildi."; $("dusman").textContent = "💥"; kalan--; }
    else {
      can--; $("bildirim").textContent = btn ? "✘ Yanlış! Kale hasar aldı." : "⏰ Süre doldu! Kale hasar aldı.";
      kalan--; // düşman kaleye çarptı ve yok oldu
    }
    hudYaz();
    setTimeout(function () {
      $("dusman").textContent = "👹";
      if (can <= 0) { bitir(); return; }
      if (kalan <= 0) { dalga = Math.min(100, dalga + 1); dalgaBaslat(); } else soruSor();
    }, 900);
  }
  function bitir() {
    aktif = false; clearInterval(zamanlayici);
    var puan = dalga, yeni = puan > KAYIT.enYuksek;
    YerelSkor.ekle(KAYIT.ad, puan); // yerel liste her zaman güncellenir
    if (yeni) KAYIT.enYuksek = puan;
    kaydet();
    $("rekorBK").textContent = KAYIT.enYuksek;
    $("sonuc").textContent = "Ulaştığın dalga: " + puan + (yeni ? "  🎉 Yeni rekor!" : "");
    $("bitti").hidden = false;
    try {
      if (window.Skor) {
        Skor.paneliCiz($("siralama"), "bilgi-kalesi");
        // Sadece yerel rekoru geçen puan gönderilir
        if (yeni && Skor.acik()) {
          var yolla = function () { Skor.gonder("bilgi-kalesi", puan).then(function (ok) { if (ok) Skor.paneliCiz($("siralama"), "bilgi-kalesi"); }); };
          if (Skor.takmaAd()) yolla(); else Skor.adSor(yolla);
        }
      }
    } catch (e) { }
    menuSiralamaYukle();
  }
  function menuyeDon() { $("bitti").hidden = true; ekranGoster("menu"); menuSiralamaYukle(); }

  $("baslaBtn").addEventListener("click", basla);
  $("tekrar").addEventListener("click", basla);
  $("menuBtn").addEventListener("click", menuyeDon);
  document.addEventListener("keydown", function (e) {
    if (!aktif || kilit || $("oyun").hidden) return;
    var n = parseInt(e.key, 10);
    var b = $("siklar").children[n - 1];
    if (b) b.click();
  });

  $("rekorBK").textContent = KAYIT.enYuksek;
  adKutusunuGuncelle();
  ekranGoster("menu");
  menuSiralamaYukle();
})();
