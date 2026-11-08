-- Slot notları: sahibi kendi slotuna en fazla 140 karakterlik bir not yazabilir.
-- Supabase Dashboard > SQL Editor içinde bir kez çalıştırın. Mevcut slotlar silinmez.

alter table public.slots add column if not exists note text;
alter table public.slots drop constraint if exists slots_note_check;
alter table public.slots add constraint slots_note_check check (note is null or char_length(note) <= 140);

-- Güncelleme yalnızca not sütununda açık; slot el değiştiremez.
revoke update on public.slots from anon, authenticated;
grant update (note) on public.slots to authenticated;

drop policy if exists "slots notunu sahibi gunceller" on public.slots;
create policy "slots notunu sahibi gunceller"
  on public.slots for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
