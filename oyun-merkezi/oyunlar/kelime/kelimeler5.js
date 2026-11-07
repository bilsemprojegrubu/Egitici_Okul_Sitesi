/* Kelime listesi 5. bölüm: okul, doğa, yiyecek, vücut, meslek, spor ve günlük hayat kelimeleri.
   Yeni kelime eklemek için boşlukla ayırarak yazman yeterli (tekrarlar oyun açılırken ayıklanır). */
window.KELIME_LISTESI = (window.KELIME_LISTESI || []).concat((
// okul
"defter kalem silgi cetvel makas yapıştırıcı pergel önlük sıra tahta sınıf teneffüs karne ödev ders kitaplık çanta kalemlik boya fırça resim müzik beden fen sosyal matematik türkçe harita küre okuma yazma dikte kompozisyon deney laboratuvar kütüphane müdür " +
// doğa ve hava
"yağmur kar dolu rüzgar fırtına bulut şimşek gökkuşağı sis çiy buz kış mevsim bahar sonbahar orman ırmak nehir göl şelale vadi tepe yayla ova çöl adacık kıyı kumsal dalga kaya mağara volkan yıldız gezegen güneş uzay roket astronot " +
// yiyecek
"ekmek peynir zeytin yumurta bal reçel tereyağı süt yoğurt ayran çorba pilav makarna köfte tavuk balık salata domates salatalık biber patates havuç soğan elma armut kiraz çilek vişne şeftali kayısı erik üzüm incir muz portakal mandalina kavun fındık ceviz badem fıstık kestane lokum baklava börek pide simit poğaça kek pasta dondurma çikolata bisküvi gofret " +
// vücut
"kafa saç göz kaş kirpik burun kulak ağız dudak diş dil çene boyun omuz kol dirsek bilek parmak tırnak göğüs karın sırt bel kalça bacak diz ayak topuk kalp akciğer beyin kemik kas deri " +
// meslekler
"öğretmen doktor hemşire polis itfaiyeci pilot aşçı terzi berber marangoz demirci çiftçi balıkçı kaptan şoför mühendis mimar avukat hakim gazeteci yazar ressam müzisyen oyuncu çiçekçi fırıncı bakkal kasap manav tamirci bahçıvan veteriner dişçi eczacı " +
// spor ve oyun
"futbol basketbol voleybol yüzme koşu atletizm jimnastik tenis okçuluk güreş boks judo kayak paten bisiklet kaykay top file kale hakem forma takım şampiyon madalya kupa antrenör oyuncak bilmece satranç domino puzzle lego uçurtma balon " +
// ev ve günlük hayat
"mutfak banyo salon yatak oda balkon bahçe merdiven kapı pencere perde halı koltuk masa sandalye dolap ayna lamba saat telefon televizyon bilgisayar tablet klavye fare kulaklık şemsiye cüzdan anahtar kilit sepet battaniye yastık yorgan havlu sabun fırça tarak bardak tabak kaşık çatal bıçak tencere tava kavanoz ocak " +
// taşıt ve yer
"otobüs tren uçak gemi vapur kayık araba kamyon motosiklet helikopter tramvay metro istasyon liman havalimanı köprü tünel okul hastane eczane müze sinema tiyatro park stadyum market pazar fırın postane " +
// duygular ve özellikler
"neşe merak heyecan sabır dürüstlük saygı sevgi nezaket paylaşım yardımlaşma dayanışma hoşgörü cesaret azim gayret başarı dostluk kardeşlik aile komşu misafir bayram şenlik ").split(/\s+/).filter(function (k) { return /^[a-zçğıöşüâîû]{3,12}$/.test(k); }));
