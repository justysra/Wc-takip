-- Bir kez çalıştırın: 20 dakikalık eski indeksler 5 dakikalık dilimlerle aynı saati göstermez.
-- Tablo boşalır; yeni kayıtlar 00:00, 00:05, 00:10 ... şeklinde eklenir.

alter table public.slots drop constraint if exists slots_slot_index_check;
alter table public.slots add constraint slots_slot_index_check check (slot_index between 0 and 287);

delete from public.slots;
