# Mercedes-Benz Actros tarzı TIR (çekici + dorse) – çok renkli 3D model

Ölçek ≈ 1:100 · Toplam boy ≈ 183 mm · en 32 mm (aynalar dahil) · yükseklik ≈ 44 mm
AMS yok → her renk ayrı STL; basıp yapıştırın (alternatif: tek 3MF'i slicer'da açın).

| # | Dosya | Renk | Not |
|---|-------|------|-----|
| 01 | kabin_beyaz | Beyaz | Kabin + tavan rüzgârlığı |
| 02 | camlar_siyah | Siyah | Ön cam + 2 yan cam (düz plaka, yapıştır) |
| 03 | izgara_yildiz_gumus | Gümüş | Izgara + Mercedes yıldızı (kabin önüne) |
| 04 | farlar_sari | Sarı/turuncu | 2 far + 5 tavan lambası |
| 05 | tampon_ayna_siyah | Siyah | Tampon + 2 ayna |
| 06 | cekici_sase_gri | Gri | Şase, depolar, akslar, 5. tekerlek |
| 07 | lastikler_siyah | Siyah | 12 lastik (yatık, 4x3 dizili) |
| 08 | jantlar_gumus | Gümüş | 12 jant (yatık) |
| 09 | dorse_sase_gri | Koyu gri | Dorse zemini, akslar, ayaklar, kingpin |
| 10 | dorse_kasa_beyaz | Beyaz | İçi boş kasa (baskıda ters = çatı tablada) |
| 11 | arka_stop_kirmizi | Kırmızı | 2 arka stop |

Klasörler
- `stl_baski_hazir/` → doğrudan basılacak yönde (destek gerektirmeyecek şekilde yatık/ters).
- `stl_birlesik_konum/` → montaj konumunda (slicer'da hepsini aynı anda içe aktarıp renk atamak için).
- `mercedes_tir_renkli.3mf` → tüm parçalar renkli, montajlı.

Montaj
1. Akslar şasiye dahil (Ø2 mm). Jantları lastiklere yerleştirin (jant deliği Ø2.3, aks Ø2 → serbest döner), uçlara damla yapıştırıcı.
2. Kabini şase üzerine, camları/ızgarayı/farları/tamponu kabine yapıştırın.
3. Dorse kasasını dorse şasesine yapıştırın. Dorse kingpin'i 5. tekerlek deliğine oturur → dorse çıkarılabilir ve döner (yapıştırmayın).

Önerilen baskı: 0.2 mm katman, 0.4 mm nozzle, %15 dolgu, destek yok. Lastikler için TPU opsiyonel.
Yeniden üretmek/ölçek değiştirmek için: `python3 build_truck.py` (numpy gerekir).
