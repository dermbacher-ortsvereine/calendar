-- Gemeinsame Veranstalter (z. B. „Ortsvereine Dermbach“ für die Sitzungen aller Ortsvereine):
-- Sie haben keinen eigenen Zugang; jeder angemeldete Veranstalter darf in ihrem Namen
-- Termine und Reservierungen anlegen, ändern und löschen (der Vorsitz wechselt reihum).
-- eingetragen_von hält fest, wer tatsächlich eingetragen hat (wird von der Datenbank gesetzt).

alter table public.veranstalter
  add column gemeinsam boolean not null default false;

-- Eigene Farbe (Indigo), bewusst getrennt von „Allgemein“ (ag).
insert into public.veranstalter (id, name, kuerzel, farbe, farbe_hg, login_email, sortierung, gemeinsam) values
  ('ov', 'Ortsvereine Dermbach', 'OV', '#3A3D99', '#E6E7F7', 'ov@dermbacher-ortsvereine.de', 5, true)
on conflict (id) do nothing;

-- Ein Profil, das (versehentlich) auf einen gemeinsamen Veranstalter zeigt, bekommt keine Rechte.
create or replace function private.eigener_veranstalter()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.veranstalter_id
  from public.profile p
  join public.veranstalter v on v.id = p.veranstalter_id
  where p.user_id = auth.uid() and v.aktiv and not v.gemeinsam;
$$;

-- Darf die aktuelle Sitzung für diesen Veranstalter schreiben?
-- Admin: immer. Veranstalter: für sich selbst und für aktive gemeinsame Veranstalter.
create function private.darf_schreiben_fuer(p_veranstalter text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.ist_admin()
    or (
      private.eigener_veranstalter() is not null
      and (
        p_veranstalter = private.eigener_veranstalter()
        or exists (select 1 from public.veranstalter v where v.id = p_veranstalter and v.gemeinsam and v.aktiv)
      )
    );
$$;
grant execute on function private.darf_schreiben_fuer(text) to authenticated;

-- ---------------------------------------------------------------------------
-- eingetragen_von: beim Anlegen aus der Sitzung, danach unveränderlich
-- (Admin und Server-Importe: leer bzw. wie angegeben).
-- ---------------------------------------------------------------------------

alter table public.termine
  add column eingetragen_von text references public.veranstalter on update cascade;
alter table public.reservierungen
  add column eingetragen_von text references public.veranstalter on update cascade;

update public.termine set eingetragen_von = veranstalter_id;
update public.reservierungen set eingetragen_von = veranstalter_id where not gesperrt;

create function private.setze_eingetragen_von()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.eingetragen_von := old.eingetragen_von;
  elsif auth.uid() is not null then
    new.eingetragen_von := private.eigener_veranstalter();
  end if;
  return new;
end;
$$;

create trigger termine_eingetragen_von
  before insert or update on public.termine
  for each row execute function private.setze_eingetragen_von();

create trigger reservierungen_eingetragen_von
  before insert or update on public.reservierungen
  for each row execute function private.setze_eingetragen_von();

-- ---------------------------------------------------------------------------
-- RLS: gemeinsame Veranstalter wie eigene behandeln
-- ---------------------------------------------------------------------------

drop policy "termine anlegen" on public.termine;
drop policy "termine aendern" on public.termine;
drop policy "termine loeschen" on public.termine;

create policy "termine anlegen" on public.termine
  for insert to authenticated
  with check (private.darf_schreiben_fuer(veranstalter_id));
create policy "termine aendern" on public.termine
  for update to authenticated
  using (private.darf_schreiben_fuer(veranstalter_id))
  with check (private.darf_schreiben_fuer(veranstalter_id));
create policy "termine loeschen" on public.termine
  for delete to authenticated
  using (private.darf_schreiben_fuer(veranstalter_id));

-- Lesen inkl. Ansprechpartner/Telefon: auch gemeinsame Reservierungen für alle Veranstalter.
drop policy "reservierungen lesen" on public.reservierungen;
drop policy "reservierungen anlegen" on public.reservierungen;
drop policy "reservierungen aendern" on public.reservierungen;
drop policy "reservierungen loeschen" on public.reservierungen;

create policy "reservierungen lesen" on public.reservierungen
  for select to authenticated
  using (private.darf_schreiben_fuer(veranstalter_id));
create policy "reservierungen anlegen" on public.reservierungen
  for insert to authenticated
  with check (
    private.darf_schreiben_fuer(veranstalter_id)
    and private.termin_gehoert_zu(termin_id, veranstalter_id)
  );
create policy "reservierungen aendern" on public.reservierungen
  for update to authenticated
  using (private.darf_schreiben_fuer(veranstalter_id))
  with check (
    private.darf_schreiben_fuer(veranstalter_id)
    and private.termin_gehoert_zu(termin_id, veranstalter_id)
  );
create policy "reservierungen loeschen" on public.reservierungen
  for delete to authenticated
  using (private.darf_schreiben_fuer(veranstalter_id));

-- Öffentliche Belegung: wer eingetragen hat (nur der Veranstalter, keine Kontaktdaten).
create or replace view public.reservierungen_oeffentlich as
  select r.id, r.raum_id, r.veranstalter_id, r.zeitraum, r.zweck, r.gesperrt, r.eingetragen_von
  from public.reservierungen r;
