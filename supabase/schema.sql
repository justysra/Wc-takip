-- 24 Saat / 5 Dakikalık Kalıcı Tuvalet Blokları (288 slot)
-- Supabase Dashboard > SQL Editor içinde bir kez çalıştırın.
-- Ayrıca: Authentication > Sign In / Providers > "Allow anonymous sign-ins" açık olmalı.

create table if not exists public.slots (
  slot_index  smallint primary key check (slot_index between 0 and 287),
  owner_name  text not null check (char_length(btrim(owner_name)) between 1 and 24),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  claimed_at  timestamptz not null default now()
);

alter table public.slots enable row level security;

drop policy if exists "slots herkes okuyabilir" on public.slots;
create policy "slots herkes okuyabilir"
  on public.slots for select
  using (true);

drop policy if exists "slots kendi adina alinir" on public.slots;
create policy "slots kendi adina alinir"
  on public.slots for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "slots sadece sahibi siler" on public.slots;
create policy "slots sadece sahibi siler"
  on public.slots for delete
  to authenticated
  using (owner_id = auth.uid());

-- UPDATE politikası bilinçli olarak yok: bir slot el değiştiremez, yalnızca sahibi tarafından bırakılabilir.

-- Hesap ayarları: görünen ad ve rozet rengi herkese görünür, yalnızca sahibi değiştirebilir.
create table if not exists public.profiles (
  id            uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 2 and 24),
  hue           smallint check (hue between 0 and 359),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles herkes okuyabilir" on public.profiles;
create policy "profiles herkes okuyabilir"
  on public.profiles for select
  using (true);

drop policy if exists "profiles kendini olusturur" on public.profiles;
create policy "profiles kendini olusturur"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles kendini gunceller" on public.profiles;
create policy "profiles kendini gunceller"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Var olan kurulumlarda 20 dakikalık (0–71) kısıtı 5 dakikalık 288 slota genişletilir.
alter table public.slots drop constraint if exists slots_slot_index_check;
alter table public.slots add constraint slots_slot_index_check check (slot_index between 0 and 287);

do $$
declare
  t text;
begin
  foreach t in array array['slots', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
