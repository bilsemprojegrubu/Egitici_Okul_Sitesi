-- Zaten kurulu bir Supabase için: "Piksel Balık" oyununu sıralamaya ekler.
-- Supabase > SQL Editor'da bir kez çalıştır. (Yeni kurulumda gerek yok, kurulum.sql'de var.)
alter table public.skorlar drop constraint if exists oyun_gecerli;
alter table public.skorlar add constraint oyun_gecerli check (oyun in (
  'bilgi-kalesi','yilan','2048','hafiza','balon','kelime',
  'futbol','platform','tetris','kus','basket','voleybol',
  'tugla','kostebek','uzay','simon','pong','mayin','zipla','araba','dans','balik'));

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
