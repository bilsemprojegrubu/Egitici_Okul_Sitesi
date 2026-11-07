/* Piksel altyapısı: sprite çizimi, ses, tuş girdisi, tam ekran, menü.
   Dış kütüphane yok; sesler tarayıcıda üretilir (internetsiz çalışır). */
(function (g) {
  "use strict";
  var Px = {};

  // ---- Güvenli localStorage ----
  function oku(a) { try { return g.localStorage.getItem(a); } catch (e) { return null; } }
  function yaz(a, d) { try { g.localStorage.setItem(a, d); } catch (e) { } }
  Px.oku = oku; Px.yaz = yaz;

  // ---- Sprite: satır dizisi + palet -> canvas ----
  Px.sprite = function (satirlar, pal, s) {
    s = s || 1;
    var h = satirlar.length, w = 0, i, j;
    for (i = 0; i < h; i++) w = Math.max(w, satirlar[i].length);
    var c = document.createElement("canvas"); c.width = w * s; c.height = h * s;
    var x = c.getContext("2d");
    for (i = 0; i < h; i++) for (j = 0; j < satirlar[i].length; j++) {
      var ch = satirlar[i].charAt(j);
      if (ch === "." || ch === " " || !pal[ch]) continue;
      x.fillStyle = pal[ch]; x.fillRect(j * s, i * s, s, s);
    }
    return c;
  };
  // Yatay ayna
  Px.cevir = function (c) {
    var n = document.createElement("canvas"); n.width = c.width; n.height = c.height;
    var x = n.getContext("2d"); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return n;
  };
  // Dikdörtgen + koyu kenarlık (piksel butonu/paneli çizmek için)
  Px.kutu = function (x, a, b, c, d, dolgu, kenar) {
    x.fillStyle = kenar || "#0d0e1a"; x.fillRect(a - 2, b - 2, c + 4, d + 4);
    x.fillStyle = dolgu; x.fillRect(a, b, c, d);
    x.fillStyle = "rgba(255,255,255,.3)"; x.fillRect(a, b, c, 2); x.fillRect(a, b, 2, d);
    x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(a, b + d - 2, c, 2); x.fillRect(a + c - 2, b, 2, d);
  };
  // Piksel yazı (kalın, gölgeli)
  Px.yazi = function (x, t, a, b, boy, renk, hiza) {
    x.font = "bold " + (boy || 12) + 'px "Courier New",monospace';
    x.textAlign = hiza || "left"; x.textBaseline = "top";
    x.fillStyle = "#0d0e1a"; x.fillText(t, a + 1, b + 1); x.fillText(t, a + 2, b + 2);
    x.fillStyle = renk || "#fff"; x.fillText(t, a, b);
  };

  // ---- Tuş girdisi (klavye + ekrandaki düğmeler aynı yerde) ----
  Px.k = {}; Px.p = {};
  function bas(kod) { if (!Px.k[kod]) Px.p[kod] = true; Px.k[kod] = true; }
  function birak(kod) { Px.k[kod] = false; }
  Px.son = function () { Px.p = {}; };       // her karenin sonunda çağrılır
  var ENGEL = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1 };
  g.addEventListener("keydown", function (e) {
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA") return;
    if (ENGEL[e.code]) e.preventDefault();
    bas(e.code);
  });
  g.addEventListener("keyup", function (e) { birak(e.code); });
  g.addEventListener("blur", function () { Px.k = {}; });
  // Ekran düğmeleri: dizi = [{t:"◀", k:"KeyA"}], taraf: "sol" | "sag" | ""
  Px.pad = function (kap, dizi, sinif) {
    var d = document.createElement("div"); d.className = "pad " + (sinif || "");
    dizi.forEach(function (o) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn pad-d";
      b.textContent = o.t; b.setAttribute("aria-label", o.a || o.t);
      var kodlar = [].concat(o.k);
      function ac(e) { e.preventDefault(); kodlar.forEach(bas); b.classList.add("bas"); try { b.setPointerCapture(e.pointerId); } catch (x) { } }
      function kapa(e) { e.preventDefault(); kodlar.forEach(birak); b.classList.remove("bas"); }
      b.addEventListener("pointerdown", ac); b.addEventListener("pointerup", kapa);
      b.addEventListener("pointercancel", kapa); b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      d.appendChild(b);
    });
    kap.appendChild(d); return d;
  };

  // ---- Ses ----
  var ac = null, sessiz = oku("px_ses") === "0";
  function baglam() {
    if (!ac) { try { ac = new (g.AudioContext || g.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === "suspended") { try { ac.resume(); } catch (e) { } }
    return ac;
  }
  // [frekans, süre, tür, ses, kayma-frekansı, gecikme]
  var SES = {
    tik: [[620, .05, "square", .07]],
    zipla: [[280, .14, "square", .08, 640]],
    puan: [[880, .07, "square", .08], [1175, .1, "square", .08, 0, .07]],
    para: [[1320, .06, "square", .06], [1760, .09, "square", .06, 0, .05]],
    vur: [[160, .12, "sawtooth", .1, 60]],
    patla: [[520, .1, "triangle", .12, 90]],
    bomba: [[110, .35, "sawtooth", .16, 30], [70, .35, "square", .12, 30, .02]],
    sut: [[200, .1, "square", .09, 420]],
    gol: [[523, .1, "square", .09], [659, .1, "square", .09, 0, .1], [784, .22, "square", .09, 0, .2]],
    kazan: [[523, .12, "square", .09], [659, .12, "square", .09, 0, .12], [784, .12, "square", .09, 0, .24], [1046, .3, "square", .09, 0, .36]],
    kaybet: [[392, .18, "triangle", .1], [330, .18, "triangle", .1, 0, .18], [262, .4, "triangle", .1, 0, .36]],
    yem: [[740, .06, "square", .07, 980]],
    birles: [[440, .06, "square", .06, 660]],
    don: [[500, .05, "triangle", .06]],
    kilic: [[900, .06, "sawtooth", .06, 300]],
    ok: [[1200, .08, "triangle", .05, 400]],
    patlama: [[90, .5, "sawtooth", .18, 30]],
    boss: [[98, .5, "sawtooth", .14, 70], [147, .5, "square", .1, 90, .3]],
    kaz: [[300, .05, "square", .06, 200]],
    al: [[500, .08, "square", .08, 900]],
    hata: [[150, .15, "square", .08]]
  };
  Px.ses = function (ad) {
    try {
      if (sessiz) return;
      var a = baglam(), d = SES[ad]; if (!a || !d) return;
      d.forEach(function (n) {
        var t0 = a.currentTime + (n[5] || 0), o = a.createOscillator(), v = a.createGain();
        o.type = n[2]; o.frequency.setValueAtTime(n[0], t0);
        if (n[4]) o.frequency.exponentialRampToValueAtTime(n[4], t0 + n[1]);
        v.gain.setValueAtTime(n[3], t0); v.gain.exponentialRampToValueAtTime(.0001, t0 + n[1]);
        o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0 + n[1] + .02);
      });
    } catch (e) { }
  };
  g.addEventListener("pointerdown", function () { baglam(); }, { once: true });
  g.addEventListener("keydown", function () { baglam(); }, { once: true });

  // ---- Araç çubuğu: ses + tam ekran (sağ üst) ----
  var IKON = {
    ses: ["..........", "....#.....", "...##..#..", "####.#..#.", "####..#.#.", "####.#..#.", "...##..#..", "....#.....", ".........."],
    sessiz: ["..........", "....#.....", "...##.#.#.", "####..#...", "####.#.#..", "####..#...", "...##.#.#.", "....#.....", ".........."],
    tam: ["#####..#####", "#........ ..#".replace(" ", ""), "#..........#", "#..........#", "............", "............", "#..........#", "#..........#", "#..........#", "#####..#####"],
    kucul: ["..#......#..", "..#......#..", "###......###", "............", "............", "###......###", "..#......#..", "..#......#.."]
  };
  IKON.tam = ["###....###", "#........#", "#........#", "..........", "..........", "#........#", "#........#", "###....###"];
  function ikonYap(ad) { return Px.sprite(IKON[ad], { "#": "#f4f4f4" }, 3).toDataURL(); }
  var tamBtn, sesBtn;
  function tamMi() { return !!(document.fullscreenElement || document.webkitFullscreenElement || document.body.classList.contains("tam")); }
  function tamGuncelle() {
    var a = tamMi();
    if (a) document.body.classList.add("tam"); else document.body.classList.remove("tam");
    if (tamBtn) tamBtn.style.backgroundImage = "url(" + ikonYap(a ? "kucul" : "tam") + ")";
    g.dispatchEvent(new Event("resize"));
  }
  Px.tamEkran = function () {
    try {
      var el = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
        var p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (p && p.catch) p.catch(function () { document.body.classList.toggle("tam"); tamGuncelle(); });
      } else { document.body.classList.toggle("tam"); tamGuncelle(); } // iPhone gibi yerlerde yedek
    } catch (e) { document.body.classList.toggle("tam"); tamGuncelle(); }
  };
  function sesGuncelle() { if (sesBtn) sesBtn.style.backgroundImage = "url(" + ikonYap(sessiz ? "sessiz" : "ses") + ")"; }
  function aracKur() {
    var d = document.createElement("div"); d.className = "arac";
    sesBtn = document.createElement("button"); sesBtn.type = "button"; sesBtn.className = "arac-d"; sesBtn.setAttribute("aria-label", "Sesi aç/kapat");
    tamBtn = document.createElement("button"); tamBtn.type = "button"; tamBtn.className = "arac-d"; tamBtn.setAttribute("aria-label", "Tam ekran");
    sesBtn.addEventListener("click", function () { sessiz = !sessiz; yaz("px_ses", sessiz ? "0" : "1"); sesGuncelle(); Px.ses("tik"); });
    tamBtn.addEventListener("click", Px.tamEkran);
    d.appendChild(sesBtn); d.appendChild(tamBtn); document.body.appendChild(d);
    sesGuncelle(); tamGuncelle();
    document.addEventListener("fullscreenchange", tamGuncelle);
    document.addEventListener("webkitfullscreenchange", tamGuncelle);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aracKur); else aracKur();

  // ---- Menü kaplaması: tek / iki kişilik seçimi ----
  // o: {baslik, not, secenekler:[{ad, alt, fn}]} ; döner {ac, kapat}
  Px.menu = function (o) {
    var sahne = document.querySelector(".sahne");
    var m = document.createElement("div"); m.className = "kaplama menu"; m.id = "menu";
    var h = document.createElement("h2"); h.textContent = o.baslik; m.appendChild(h);
    if (o.not) { var p = document.createElement("p"); p.className = "ipucu"; p.textContent = o.not; m.appendChild(p); }
    (o.secenekler || []).forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn buyuk";
      b.textContent = s.ad; if (s.alt) { var k = document.createElement("small"); k.textContent = s.alt; b.appendChild(k); }
      b.addEventListener("click", function () { Px.ses("tik"); m.hidden = true; s.fn(); });
      m.appendChild(b);
    });
    if (o.ek) o.ek(m);
    sahne.appendChild(m);
    return { ac: function () { m.hidden = false; var bt = document.getElementById("bitti"); if (bt) bt.hidden = true; }, kapat: function () { m.hidden = true; }, el: m };
  };
  // İki kişilik maç sonucu: sıralamaya GİTMEZ (sıralama sadece tek oyunculu)
  Px.sonuc2 = function (metin) {
    var b = document.getElementById("bitti"), s = document.getElementById("sonuc"), p = document.getElementById("siralama");
    if (s) s.textContent = metin; if (p) p.hidden = true; if (b) b.hidden = false;
    Px.ses("kazan");
  };
  // Küçük yardımcılar
  Px.rastgele = function (a, b) { return a + Math.random() * (b - a); };
  Px.tamsayi = function (a, b) { return Math.floor(Px.rastgele(a, b + 1)); };
  Px.sinir = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  // Sabit adımlı oyun döngüsü (60 fps mantık, ekran hızından bağımsız)
  Px.dongu = function (guncelle, ciz) {
    var onceki = 0, birik = 0, calisiyor = true;
    function kare(t) {
      if (!calisiyor) return;
      if (!onceki) onceki = t;
      birik += Math.min(100, t - onceki); onceki = t;
      var n = 0;
      while (birik >= 16.667 && n < 5) { guncelle(); birik -= 16.667; n++; }
      ciz(); Px.son();
      requestAnimationFrame(kare);
    }
    requestAnimationFrame(kare);
    return { dur: function () { calisiyor = false; } };
  };
  g.Px = Px;
})(window);
