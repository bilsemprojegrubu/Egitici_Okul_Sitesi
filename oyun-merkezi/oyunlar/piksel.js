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
  // Yazı: oyun tuvali düşük çözünürlüklü olduğu için yazı, tuvalin üstündeki yüksek çözünürlüklü
  // saydam katmana normal (pürüzsüz) yazı tipiyle çizilir. Katman her karede temizlenir (Px.temizle).
  var katmanlar = [];
  function katman(cv) {
    var o = cv._ov;
    if (!o) {
      o = document.createElement("canvas"); o.style.cssText = "position:absolute;pointer-events:none;z-index:2;background:transparent;border:0;outline:0;max-width:none;image-rendering:auto";
      cv.parentNode.insertBefore(o, cv.nextSibling); cv._ov = o; katmanlar.push([cv, o]);
    }
    if (o._kare === kareNo && o._ok) { o._kul = true; return o; } // aynı karede yeniden ölçme (düzen hesabı yavaş)
    var dpr = Math.min(2, g.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return null;
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (o.width !== pw || o.height !== ph) { o.width = pw; o.height = ph; }
    o.style.left = (cv.offsetLeft + cv.clientLeft) + "px"; o.style.top = (cv.offsetTop + cv.clientTop) + "px"; o.style.width = w + "px"; o.style.height = h + "px";
    o._kare = kareNo; o._ok = true; o._kul = true;
    return o;
  }
  var kareNo = 0; g.addEventListener("resize", function () { kareNo++; });
  Px.temizle = function () {
    kareNo++;
    katmanlar.forEach(function (k) { var o = k[1]; if (o._kul) { o.getContext("2d").clearRect(0, 0, o.width, o.height); o._kul = false; } });
  };
  Px.yazi = function (x, t, a, b, boy, renk, hiza) {
    var cv = x.canvas, o = katman(cv); boy = boy || 12;
    if (!o) return;
    var c = o.getContext("2d"), sc = o.width / cv.width;
    c.setTransform(sc, 0, 0, sc, 0, 0);
    c.font = "bold " + boy + 'px "Trebuchet MS","Segoe UI",Arial,sans-serif';
    c.textAlign = hiza || "left"; c.textBaseline = "top"; c.lineJoin = "round";
    c.lineWidth = Math.max(1.5, boy * .26); c.strokeStyle = "#0d0e1a"; c.strokeText(t, a, b);
    c.fillStyle = renk || "#fff"; c.fillText(t, a, b);
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
      var b = document.createElement("button"); b.type = "button"; b.className = "btn pad-d" + (o.c ? " " + o.c : "");
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

  // ---- Ekranda dokunmatik joystick: sürükleyince yön tuşları basılı sayılır ----
  Px.joystick = function (kap, m) {
    var d = document.createElement("div"), top = document.createElement("div"), R = Math.round(Math.max(44, Math.min(84, Math.min(window.innerWidth, window.innerHeight) * .14))), bas_ = {};
    d.className = "joy"; d.style.cssText = "position:relative;width:" + R * 2 + "px;height:" + R * 2 + "px;border-radius:50%;background:rgba(255,255,255,.12);border:4px solid #0d0e1a;box-shadow:inset 0 0 0 3px rgba(255,255,255,.25);touch-action:none;user-select:none;-webkit-user-select:none;flex:none";
    top.style.cssText = "position:absolute;left:" + (R - Math.round(R * .65 / 2) - 4) + "px;top:" + (R - Math.round(R * .65 / 2) - 4) + "px;width:" + Math.round(R * .65) + "px;height:" + Math.round(R * .65) + "px;border-radius:50%;background:#41a6f6;border:4px solid #0d0e1a;box-shadow:inset -3px -3px 0 rgba(0,0,0,.3),inset 3px 3px 0 rgba(255,255,255,.4);pointer-events:none";
    d.appendChild(top); d.setAttribute("aria-label", "Joystick");
    function ayarla(t) {
      ["u", "d", "l", "r"].forEach(function (y) { if (!m[y]) return; if (t[y] && !bas_[y]) bas(m[y]); if (!t[y] && bas_[y]) birak(m[y]); bas_[y] = !!t[y]; });
    }
    function tasi(e) {
      var r = d.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), n = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, n / R);
      var ox = dx / n * Math.min(n, R - 8), oy = dy / n * Math.min(n, R - 8);
      top.style.transform = "translate(" + ox + "px," + oy + "px)";
      ayarla({ l: dx < -R * .3, r: dx > R * .3, u: dy < -R * .3, d: dy > R * .3 });
    }
    function birak_(e) { e.preventDefault(); top.style.transform = ""; ayarla({}); }
    d.addEventListener("pointerdown", function (e) { e.preventDefault(); try { d.setPointerCapture(e.pointerId); } catch (x) { } tasi(e); });
    d.addEventListener("pointermove", function (e) { if (e.buttons || e.pressure) tasi(e); });
    d.addEventListener("pointerup", birak_); d.addEventListener("pointercancel", birak_); d.addEventListener("contextmenu", function (e) { e.preventDefault(); });
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
  var tamBtn, sesBtn, aracDiv, hizBtn, uiBtn;
  // Arayüz boyutu: ayar çubuğu, %50 - %150 (seçim hatırlanır)
  Px.ui = parseInt(oku("px_ui"), 10) || 100;
  if (Px.ui < 50 || Px.ui > 150) Px.ui = 100;
  var uiPanel, uiRange, uiYazi;
  function uiUygula() {
    document.documentElement.style.setProperty("--ui", String(Px.ui / 100));
    if (uiBtn) uiBtn.textContent = Px.ui + "%";
    if (uiRange) uiRange.value = Px.ui;
    if (uiYazi) uiYazi.textContent = "Arayüz boyutu: %" + Px.ui;
  }
  uiUygula();
  function uiAyarla(v) {
    Px.ui = Math.max(50, Math.min(150, v)); yaz("px_ui", String(Px.ui)); uiUygula(); sigdir();
  }
  function uiEkle() {
    uiBtn = document.createElement("button"); uiBtn.type = "button"; uiBtn.className = "arac-d arac-hiz"; uiBtn.setAttribute("aria-label", "Arayüz boyutu ayarı");
    uiPanel = document.createElement("div"); uiPanel.className = "ui-panel"; uiPanel.hidden = true;
    uiYazi = document.createElement("div"); uiYazi.className = "ui-yazi";
    uiRange = document.createElement("input"); uiRange.type = "range"; uiRange.min = 50; uiRange.max = 150; uiRange.step = 5;
    uiRange.setAttribute("aria-label", "Arayüz boyutu");
    uiRange.addEventListener("input", function () { uiAyarla(parseInt(uiRange.value, 10)); });
    var sf = document.createElement("button"); sf.type = "button"; sf.className = "btn kucuk"; sf.textContent = "%100'e sıfırla";
    sf.addEventListener("click", function () { uiAyarla(100); Px.ses("tik"); });
    uiPanel.appendChild(uiYazi); uiPanel.appendChild(uiRange); uiPanel.appendChild(sf);
    uiBtn.addEventListener("click", function (e) { e.stopPropagation(); uiPanel.hidden = !uiPanel.hidden; Px.ses("tik"); });
    uiPanel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { uiPanel.hidden = true; });
    uiUygula(); aracDiv.insertBefore(uiBtn, aracDiv.firstChild); aracDiv.appendChild(uiPanel);
  }
  // Oyun hızı: 1x / 2x / 4x (döngü kullanan oyunlarda görünür, seçim hatırlanır)
  Px.hiz = parseInt(oku("px_hiz"), 10) || 1;
  if ([1, 2, 4].indexOf(Px.hiz) < 0) Px.hiz = 1;
  function hizEkle() {
    if (hizBtn || !aracDiv) return;
    hizBtn = document.createElement("button"); hizBtn.type = "button"; hizBtn.className = "arac-d arac-hiz";
    hizBtn.setAttribute("aria-label", "Oyun hızı");
    var guncelle = function () { hizBtn.textContent = Px.hiz + "x"; };
    hizBtn.addEventListener("click", function () {
      Px.hiz = Px.hiz === 1 ? 2 : Px.hiz === 2 ? 4 : 1; yaz("px_hiz", String(Px.hiz)); guncelle(); Px.ses("tik");
    });
    guncelle(); aracDiv.insertBefore(hizBtn, aracDiv.firstChild);
  }
  var yedekTam = false; // tarayıcı tam ekran vermezse (iPhone) elle tam ekran
  function tamMi() { return !!(document.fullscreenElement || document.webkitFullscreenElement || yedekTam); }
  function tamGuncelle() {
    var a = tamMi();
    if (a) document.body.classList.add("tam"); else document.body.classList.remove("tam");
    if (tamBtn) tamBtn.style.backgroundImage = "url(" + ikonYap(a ? "kucul" : "tam") + ")";
    sigdir();
    g.dispatchEvent(new Event("resize"));
  }
  // Tam ekranda oyun alanını boş yer kalmayacak şekilde büyüt (tuval: genişlik, diğerleri: zoom)
  // Her şey tek ekrana sığar: tuval (varsa) kalan alana en-boy oranıyla küçülür/büyür; tuvalsiz oyunlarda sahne zoom ile ölçeklenir.
  // Normal modda yalnızca taşma varsa küçültür; tam ekranda boşluğu doldurur. Kaplamalar (position:fixed) kendi içinde kayar.
  var sigBusy = false;
  function sigdir() {
    if (sigBusy) return; sigBusy = true;
    try { sigdirIs(); } catch (e) { } sigBusy = false;
  }
  function sigdirIs() {
    var tam = tamMi(), sahne = document.querySelector(".sahne"), cv = document.querySelectorAll("canvas.cv");
    var de = document.documentElement, i, kap = sahne ? sahne.querySelectorAll(".kaplama") : [];
    for (i = 0; i < cv.length; i++) cv[i].style.width = "";
    if (sahne) { sahne.style.zoom = ""; sahne.style.width = ""; }
    for (i = 0; i < kap.length; i++) kap[i].style.zoom = "";
    var ust = document.querySelector(".ust"), ih = g.innerHeight, iw = g.innerWidth;
    if (ust) de.style.setProperty("--ust-h", Math.ceil(ust.getBoundingClientRect().bottom) + "px");
    if (!sahne) return;
    var ye = g.pageYOffset || 0;
    if (!tam && de.scrollHeight <= ih && de.scrollWidth <= iw) return; // zaten sığıyor
    var ek = tam ? 2 : 0;
    if (cv.length === 1) {
      var c = cv[0], cw = c.width, chh = c.height, dogal = c.getBoundingClientRect().width;
      // yan yerleşim: yan kontroller tuvalin satırını yüksek yapmasın (geçici gizle), genişlikleri ayrılsın
      var yanlar = sahne.classList.contains("yan") ? [].slice.call(sahne.querySelectorAll(".k-sol,.k-sag")) : [], yanEn = 0, yd = [];
      yanlar.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.width) yanEn += r.width + 14; });
      yanlar.forEach(function (el) { yd.push(el.style.display); el.style.display = "none"; });
      c.style.width = "1px";
      var diger = sahne.getBoundingClientRect().bottom + ye - c.getBoundingClientRect().height;
      var w = (ih - diger - ek - 8) * cw / chh + 8; // kenarlık 2x4px
      yanlar.forEach(function (el, i2) { el.style.display = yd[i2]; });
      var en = iw - (tam ? 8 : 24) - yanEn;
      w = Math.min(w, en); if (!tam) w = Math.min(w, dogal);
      c.style.width = Math.floor(Math.max(90, w)) + "px";
    } else {
      var ch = sahne.children, wm = 1, j, cr, st;
      for (j = 0; j < ch.length; j++) { st = getComputedStyle(ch[j]).position; if (st === "fixed" || st === "absolute") continue; cr = ch[j].getBoundingClientRect(); if (cr.width > wm) wm = cr.width; }
      var uh = ust ? ust.getBoundingClientRect().bottom : 0, z = 1, k;
      var yuk0 = sahne.getBoundingClientRect().bottom + ye - uh;
      z = Math.min((iw - 16) / wm, (ih - uh - ek - 4) / Math.max(1, yuk0));
      z = tam ? Math.min(3, z) : Math.min(1, z);
      for (k = 0; k < 4; k++) { // yeniden akış sonrası hâlâ taşıyorsa biraz daha küçült
        z = Math.max(.3, z);
        sahne.style.zoom = z; sahne.style.width = (100 / z) + "%";
        for (j = 0; j < kap.length; j++) kap[j].style.zoom = 1 / z;
        var alt = sahne.getBoundingClientRect().bottom + ye;
        if (alt <= ih - ek || z <= .3) break;
        z *= (ih - ek - uh - 2) / Math.max(1, alt - uh);
      }
    }
  }
  g.addEventListener("resize", function () { sigdir(); });
  g.addEventListener("orientationchange", function () { setTimeout(sigdir, 250); });
  g.addEventListener("load", function () { sigdir(); setTimeout(sigdir, 300); });
  var sigZ = 0;
  function sigIste() { if (sigZ) return; sigZ = g.requestAnimationFrame(function () { sigZ = 0; sigdir(); }); }
  function sigIzle() {
    var s = document.querySelector(".sahne"); if (!s || !g.MutationObserver) return;
    new MutationObserver(sigIste).observe(s, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
  }
  Px.tamEkran = function () {
    try {
      var el = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
        var p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (p && p.catch) p.catch(function () { yedekTam = !yedekTam; tamGuncelle(); });
      } else { yedekTam = !yedekTam; tamGuncelle(); } // iPhone gibi yerlerde yedek
    } catch (e) { yedekTam = !yedekTam; tamGuncelle(); }
  };
  function sesGuncelle() { if (sesBtn) sesBtn.style.backgroundImage = "url(" + ikonYap(sessiz ? "sessiz" : "ses") + ")"; }
  function aracKur() {
    var d = document.createElement("div"); d.className = "arac";
    sesBtn = document.createElement("button"); sesBtn.type = "button"; sesBtn.className = "arac-d"; sesBtn.setAttribute("aria-label", "Sesi aç/kapat");
    tamBtn = document.createElement("button"); tamBtn.type = "button"; tamBtn.className = "arac-d"; tamBtn.setAttribute("aria-label", "Tam ekran");
    sesBtn.addEventListener("click", function () { sessiz = !sessiz; yaz("px_ses", sessiz ? "0" : "1"); sesGuncelle(); Px.ses("tik"); });
    tamBtn.addEventListener("click", Px.tamEkran);
    d.appendChild(sesBtn); d.appendChild(tamBtn); document.body.appendChild(d); aracDiv = d; uiEkle(); if (Px.hizGerek) hizEkle();
    sesGuncelle(); tamGuncelle(); sigIzle();
    document.addEventListener("fullscreenchange", tamGuncelle);
    document.addEventListener("webkitfullscreenchange", tamGuncelle);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aracKur); else aracKur();

  // ---- Menü kaplaması: tek / iki kişilik seçimi ----
  // o: {baslik, not, secenekler:[{ad, alt, fn}]} ; döner {ac, kapat}
  Px.menu = function (o) {
    Px.menuVar = true; // menüsü olan oyun zaten bir butonla başlar
    var sahne = document.querySelector(".sahne");
    var m = document.createElement("div"); m.className = "kaplama menu"; m.id = "menu";
    var h = document.createElement("h2"); h.textContent = o.baslik; m.appendChild(h);
    if (o.not) { var p = document.createElement("p"); p.className = "ipucu"; p.textContent = o.not; m.appendChild(p); }
    (o.secenekler || []).forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn buyuk";
      b.textContent = s.ad; if (s.alt) { var k = document.createElement("small"); k.textContent = s.alt; b.appendChild(k); }
      b.addEventListener("click", function () {
        Px.ses("tik"); m.hidden = true; s.fn();
        // Mod seçildi ve oyun fiilen başlıyorsa (başka menü açılmadıysa): oyun, BAŞLA'ya basılana kadar bekler
        if (Px.donguVar && !document.querySelector(".kaplama.menu:not([hidden]):not(#baslaKapi)")) {
          Px.mBekle = true; Px.kapi(function () { Px.mBekle = false; });
        }
      });
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
  // Boşluk (Space) ile "Tekrar oyna": oyun bitti kaplaması açıkken, takma ad kutusu odakta değilse çalışır
  (function () {
    var bt = null, acildi = 0, ipucu = null;
    function bul() {
      if (bt) return bt; bt = document.getElementById("bitti"); if (!bt) return null;
      var t = document.getElementById("tekrar");
      if (t) { ipucu = document.createElement("p"); ipucu.className = "ipucu"; ipucu.textContent = "Boşluk (Space) tuşuyla da tekrar oynayabilirsin"; t.parentNode.appendChild(ipucu); }
      new MutationObserver(function () { if (!bt.hidden) acildi = Date.now(); }).observe(bt, { attributes: true, attributeFilter: ["hidden"] });
      if (!bt.hidden) acildi = Date.now();
      return bt;
    }
    document.addEventListener("DOMContentLoaded", bul);
    window.addEventListener("keydown", function (e) {
      if (e.code !== "Space" && e.key !== " ") return;
      var b = bul(), t = document.getElementById("tekrar"), ae = document.activeElement;
      if (!b || b.hidden || !t || t.hidden || e.repeat) return;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
      if (Date.now() - acildi < 700) return; // oyunun son anında basılı kalan boşluk hemen yeniden başlatmasın
      e.preventDefault(); e.stopImmediatePropagation(); t.click();
    }, true);
  })();
  // Geri sayımı (HAZIRLAN 3-2-1) beklemek istemeyenler için: herhangi bir tuşa basınca ya da ekrana dokununca atlanır.
  // bekliyor(): geri sayım sürüyor mu?  bitir(): geri sayımı hemen bitir.  (Menü / BAŞLA kapısı açıkken çalışmaz.)
  Px.atla = function (bekliyor, bitir) {
    function dene() {
      try { if (bekliyor() && !document.getElementById("baslaKapi") && !document.querySelector(".kaplama.menu:not([hidden])")) bitir(); } catch (e) { }
    }
    document.addEventListener("pointerdown", dene, true);
    document.addEventListener("keydown", function (e) {
      if (!e.repeat && ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].indexOf(e.key) < 0) dene();
    }, true);
  };
  // Geri sayım ipucu: tuvale iki satır (tek satıra sığmıyor)
  Px.atlaYazi = function (x, cx, y) {
    Px.yazi(x, "Beklemeden başlamak için", cx, y, 8, "#f4f4f4", "center");
    Px.yazi(x, "bir tuşa bas / dokun", cx, y + 12, 8, "#f4f4f4", "center");
  };
  // BAŞLA kapısı: menüsü olmayan oyunlar, oyuncu bir butona basana kadar bekler
  var kapiAcik = false;
  Px.kapi = function (devam) {
    if (kapiAcik || document.getElementById("baslaKapi")) return;
    var sahne = document.querySelector(".sahne"); if (!sahne) { if (devam) devam(); return; }
    var m = document.createElement("div"); m.className = "kaplama menu"; m.id = "baslaKapi";
    var h = document.createElement("h2"); h.textContent = (document.title || "OYUN").split(" — ")[0].toLocaleUpperCase("tr"); m.appendChild(h);
    var ip = sahne.querySelector(".ipucu");
    if (ip) { var p = document.createElement("p"); p.className = "ipucu"; p.textContent = ip.textContent; m.appendChild(p); }
    var b = document.createElement("button"); b.type = "button"; b.className = "btn buyuk yesil"; b.textContent = "▶ BAŞLA";
    m.appendChild(b); var ha = document.createElement("p"); ha.className = "ipucu"; ha.textContent = "Başlamak için herhangi bir tuşa bas ya da ekrana dokun"; m.appendChild(ha); sahne.appendChild(m); kapiAcik = true;
    function basla() {
      if (!kapiAcik) return; kapiAcik = false; m.remove(); Px.ses("al");
      window.removeEventListener("keydown", tus, true); window.removeEventListener("keyup", tus, true);
      if (devam) devam();
    }
    function tus(e) {
      e.preventDefault(); e.stopImmediatePropagation(); // bekleyen oyun tuşlara tepki vermesin
      if (e.type === "keydown" && !e.repeat && ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].indexOf(e.key) < 0) basla(); // herhangi bir tuş
    }
    m.addEventListener("click", basla); // ekrana / kaplamaya dokunmak da başlatır
    window.addEventListener("keydown", tus, true); window.addEventListener("keyup", tus, true);
    try { b.focus({ preventScroll: true }); } catch (e) { }
  };
  // Sabit adımlı oyun döngüsü (60 fps mantık, ekran hızından bağımsız)
  Px.dongu = function (guncelle, ciz) {
    var onceki = 0, birik = 0, calisiyor = true, bekle = false;
    Px.hizGerek = true; Px.donguVar = true; hizEkle();
    if (!Px.menuVar) { bekle = true; Px.kapi(function () { bekle = false; onceki = 0; birik = 0; }); }
    function kare(t) {
      if (!calisiyor) return;
      if (!onceki) onceki = t;
      Px.joy();
      if (bekle || Px.mBekle) { onceki = t; Px.temizle(); ciz(); Px.son(); requestAnimationFrame(kare); return; }
      birik += Math.min(100, t - onceki) * Px.hiz; onceki = t;
      var n = 0;
      while (birik >= 16.667 && n < 5 * Px.hiz) { guncelle(); birik -= 16.667; n++; }
      Px.temizle(); ciz(); Px.son();
      requestAnimationFrame(kare);
    }
    requestAnimationFrame(kare);
    return { dur: function () { calisiyor = false; } };
  };
  // ---- Joystick / gamepad (Gamepad API): çubuk ve yön tuşları + düğmeler klavye tuşlarına çevrilir ----
  var OK = { u: "ArrowUp", d: "ArrowDown", l: "ArrowLeft", r: "ArrowRight", b: { 0: "Space", 1: "KeyZ", 2: "KeyX", 3: "KeyC" } };
  var JOY = {
    futbol: [{ u: "KeyW", d: "KeyS", l: "KeyA", r: "KeyD", b: { 0: "KeyE", 1: "KeyQ", 2: "KeyX", 3: "KeyC", 4: "KeyZ", 5: "KeyV" } },
             { u: "KeyO", d: "KeyK", l: "Semicolon", r: "KeyL", b: { 0: "KeyP", 1: "KeyI", 2: "Comma", 3: "Period", 4: "KeyM", 5: "Slash" } }],
    basket: [{ u: "KeyW", d: "KeyS", l: "KeyA", r: "KeyD", b: { 0: "KeyW", 1: "KeyF", 2: "KeyQ", 3: "KeyE" } },
             { u: "ArrowUp", d: "ArrowDown", l: "ArrowLeft", r: "ArrowRight", b: { 0: "ArrowUp", 1: "Enter", 2: "KeyP", 3: "KeyI" } }],
    voleybol: [{ u: "KeyW", d: "KeyS", l: "KeyA", r: "KeyD", b: { 0: "KeyW", 1: "KeyW" } },
               { u: "ArrowUp", d: "ArrowDown", l: "ArrowLeft", r: "ArrowRight", b: { 0: "ArrowUp", 1: "ArrowUp" } }],
    pong: [{ u: "KeyW", d: "KeyS", b: {} }, { u: "ArrowUp", d: "ArrowDown", b: {} }]
  };
  var joyAd = (location.pathname.match(/\/oyunlar\/([^\/]+)/) || [])[1], joyHaritasi = JOY[joyAd] || [OK], joyOnce = {};
  Px.joy = function () {
    if (!navigator.getGamepads) return;
    var pads = navigator.getGamepads(), hepsi = {}, i, j, gp, m, tus, b;
    for (i = 0; i < pads.length; i++) {
      gp = pads[i]; if (!gp || !gp.connected) continue;
      m = joyHaritasi[Math.min(gp.index, joyHaritasi.length - 1)] || joyHaritasi[0];
      if (joyHaritasi.length > 1 && gp.index >= joyHaritasi.length) continue;
      tus = {}; b = gp.buttons;
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (m.l && (ax < -.5 || (b[14] && b[14].pressed))) tus[m.l] = 1;
      if (m.r && (ax > .5 || (b[15] && b[15].pressed))) tus[m.r] = 1;
      if (m.u && (ay < -.5 || (b[12] && b[12].pressed))) tus[m.u] = 1;
      if (m.d && (ay > .5 || (b[13] && b[13].pressed))) tus[m.d] = 1;
      for (j in m.b) if (b[j] && b[j].pressed) tus[m.b[j]] = 1;
      if (b[9] && b[9].pressed) tus.Space = 1;
      for (j in tus) hepsi[j] = 1;
    }
    for (j in hepsi) if (!joyOnce[j]) bas(j);
    for (j in joyOnce) if (!hepsi[j]) birak(j);
    joyOnce = hepsi;
  };

  g.Px = Px;
})(window);
