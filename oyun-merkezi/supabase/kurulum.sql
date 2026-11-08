-- =====================================================================
-- OYUN MERKEZİ — Supabase kurulum betiği
-- Supabase paneli > SQL Editor > "New query" kısmına yapıştırıp "Run" deyin.
-- Betik tekrar çalıştırılabilir (varsa günceller). Verileri silmez.
-- Güvenlik modeli: herkes OKUYABİLİR ve EKLEYEBİLİR; kimse DEĞİŞTİREMEZ/SİLEMEZ.
-- =====================================================================

-- 1) Tablo ------------------------------------------------------------
create table if not exists public.skorlar (
  id bigint generated always as identity primary key,
  oyun text not null,
  takma_ad text not null check (char_length(takma_ad) between 2 and 12),
  puan integer not null check (puan >= 0),
  olusturma timestamptz not null default now(),
  constraint oyun_gecerli check (oyun in (
    'bilgi-kalesi','yilan','2048','hafiza','balon','kelime',
    'futbol','platform','tetris','kus','basket','voleybol',
    'tugla','kostebek','uzay','simon','pong','mayin','zipla','araba','dans','balik'))
);

create index if not exists skorlar_oyun_puan on public.skorlar (oyun, puan desc);

-- 2) Oyun bazlı en yüksek puan sınırları -------------------------------
-- Amaç: sahte, abartılı puan gönderilmesini zorlaştırmak. Sınırlar, oyunun
-- kurallarına göre ulaşılabilecek en yüksek değerin rahatça üstünde seçildi.
--   bilgi-kalesi : 100    -> puan = dalga sayısı; 100 dalga fiilen ulaşılamaz.
--   yilan        : 400    -> 20x20 tahta = 400 kare, yılan bundan fazla elma yiyemez.
--   2048         : 100000 -> normal oyunda skorlar bunun çok altında kalır.
--   hafiza       : 1000   -> puan formülü en fazla 1000 verir.
--   balon        : 5000   -> 60 sn'de en fazla ~150 balon x 20 puan = ~3000.
--   kelime       : 500    -> puan = üst üste doğru kelime; sözcük listesi dönse bile 500 olağanüstü.
--   futbol       : 200    -> puan = kazanılan maç sayısı.
--   platform     : 20000  -> puan = mesafe + jeton; uzun koşuda bile bunun altında.
--   tetris       : 100000 -> standart puanlamayla çocuk oyuncu için çok yüksek bir tavan.
--   kus          : 1000   -> geçilen boru sayısı.
--   basket       : 300    -> 30 sn, en fazla ~60 atış x 3 puan = 180.
--   voleybol     : 500    -> oyuncunun aldığı sayı sayısı.
create or replace function public.skor_siniri(p_oyun text)
returns integer
language sql
immutable
as $$
  select case p_oyun
    when 'bilgi-kalesi' then 200000
    when 'yilan'        then 2000
    when '2048'         then 100000
    when 'hafiza'       then 1000
    when 'balon'        then 5000
    when 'kelime'       then 500
    when 'futbol'       then 1000
    when 'platform'     then 20000
    when 'tetris'       then 100000
    when 'kus'          then 5000
    when 'basket'       then 1000
    when 'voleybol'     then 1000
    when 'tugla'        then 20000
    when 'kostebek'     then 1000
    when 'uzay'         then 50000
    when 'simon'        then 500
    when 'pong'         then 5000
    when 'mayin'        then 1000
    when 'zipla'        then 20000
    when 'araba'        then 5000
    when 'dans'         then 200000
    when 'balik'        then 100000
    else 0
  end
$$;

-- 3) Satır düzeyi güvenlik (RLS) ----------------------------------------
alter table public.skorlar enable row level security;

-- Tablo yetkilerini sıfırla; anon sadece okuyabilsin ve belirli sütunları ekleyebilsin.
-- (id ve olusturma sütunlarını istemci belirleyemez.)
revoke all on public.skorlar from anon;
grant select on public.skorlar to anon;
grant insert (oyun, takma_ad, puan) on public.skorlar to anon;

drop policy if exists "herkes okuyabilir" on public.skorlar;
create policy "herkes okuyabilir" on public.skorlar
  for select to anon using (true);

drop policy if exists "herkes ekleyebilir" on public.skorlar;
create policy "herkes ekleyebilir" on public.skorlar
  for insert to anon
  with check (
    takma_ad = btrim(takma_ad)
    and char_length(takma_ad) between 2 and 12
    and puan >= 0
    and puan <= 100000
    and puan <= public.skor_siniri(oyun)   -- oyun bazlı sınır
  );

-- update ve delete için hiçbir policy YOK: kimse puan silemez ya da değiştiremez.

-- 4) Basit spam koruması -------------------------------------------------
-- Aynı takma ad (büyük/küçük harf fark etmez) aynı oyunda 10 saniye içinde
-- ikinci kez kayıt ekleyemez. security definer: kontrol, tabloyu okuyabilsin diye.
create or replace function public.skor_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.skorlar
    where oyun = new.oyun
      and lower(takma_ad) = lower(new.takma_ad)
      and olusturma > now() - interval '10 seconds'
  ) then
    raise exception 'Cok sik skor gonderiyorsun, biraz bekle.';
  end if;
  return new;
end
$$;

drop trigger if exists skor_hiz_siniri_tetik on public.skorlar;
create trigger skor_hiz_siniri_tetik
  before insert on public.skorlar
  for each row execute function public.skor_hiz_siniri();

-- Not: Test kayıtlarını temizlemek isterseniz SQL Editor'da (yönetici olarak) şunu çalıştırın:
--   delete from public.skorlar where takma_ad = 'Deneme';
