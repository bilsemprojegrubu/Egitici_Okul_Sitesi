-- Takma ad benzersizliği (Oyun Merkezi 2.0.9)
-- Supabase > SQL Editor'a yapıştırıp bir kez çalıştırın. Tekrar çalıştırmak zararsızdır.
-- Bir takma adı yalnızca bir cihaz alabilir (büyük/küçük harf, boşluk ve Türkçe harf farkı yok sayılır).

create table if not exists public.oyuncular (
  id        bigint generated always as identity primary key,
  takma_ad  text not null check (char_length(takma_ad) between 2 and 12),
  cihaz     text not null check (char_length(cihaz) between 8 and 64),
  olusturma timestamptz not null default now()
);

-- "Ali Can", "alican", "ALİCAN" aynı sayılır
create or replace function public.ad_anahtar(t text)
returns text language sql immutable as $$
  select translate(lower(translate(replace(t, ' ', ''), 'İI', 'ii')), 'ıçğöşüâîû', 'icgosuaiu')
$$;

create unique index if not exists oyuncular_ad_benzersiz on public.oyuncular (public.ad_anahtar(takma_ad));

alter table public.oyuncular enable row level security;
revoke all on public.oyuncular from anon, authenticated;
grant insert (takma_ad, cihaz) on public.oyuncular to anon;

-- Sadece ekleme: kimse okuyamaz (cihaz kimlikleri gizli kalır), değiştiremez, silemez.
drop policy if exists "ad alabilir" on public.oyuncular;
create policy "ad alabilir" on public.oyuncular
  for insert to anon
  with check (takma_ad = btrim(takma_ad) and char_length(takma_ad) between 2 and 12);
