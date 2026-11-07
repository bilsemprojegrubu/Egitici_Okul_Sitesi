/* Kelime listesi 4. bölüm: aynı harflerle yazılan kelimeler (anagram).
   KELIME_LISTESI'ne eklenenler oyunda sorulabilir.
   KELIME_GECERLI sadece "kabul" içindir: harfleri aynı olan başka bir gerçek kelime de doğru cevap sayılır
   (örnek: kumanya = uyanmak, yaka = kaya = ayak). Boşlukla ayırarak yeni kelime ekleyebilirsin. */
function kel4(s) { return s.split(/\s+/).filter(function (k) { return /^[a-zçğıöşüâîû]{2,12}$/.test(k); }); }
window.KELIME_LISTESI = (window.KELIME_LISTESI || []).concat(kel4(
  "kumanya uyanmak yaka kaya ayak yakın kayın yankı masal salam kasa tarak karat kayıt yatık kuyu uyku " +
  "tabak batak kelam kalem hatta tahta yeni yine ayrı yarı alay salak kalas kara arka akar arak"
));
window.KELIME_GECERLI = kel4(
  "kumanya uyanmak yaka kaya ayak yakın kayın yankı masal salam kasa saka tarak karat kayıt yatık kuyu uyku " +
  "tabak batak kelam kalem hatta tahta yeni yine ayrı yarı alay yala salak kalas kara arka akar arak " +
  "kaş aşk ilke kile atkı kıta rakı ırak karı kale lake ten net yan nay"
);
