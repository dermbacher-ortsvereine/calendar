-- Härtung nach Sicherheitsdurchsicht (siehe CLAUDE.md, Abschnitt 10).

-- 1) Profile nicht mehr automatisch per E-Mail-Adresse verknüpfen.
--    Wäre die Selbstregistrierung in Produktion versehentlich offen, hätte sich sonst jemand
--    mit einer internen Adresse (z. B. kar@…) registrieren und deren Rechte bekommen können.
--    Profile legt jetzt nur noch der Server mit dem Service-Role-Schlüssel an (Admin-Seite, Skript).
drop trigger if exists auth_benutzer_profil on auth.users;
drop function if exists private.neuer_auth_benutzer();

-- 2) Deaktivierte Veranstalter dürfen nichts mehr schreiben (auch mit noch gültiger Sitzung).
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
  where p.user_id = auth.uid() and v.aktiv;
$$;

-- 3) Reservierte Kennungen: "admin" würde sonst die Login-Adresse der Administration belegen.
alter table public.veranstalter
  add constraint veranstalter_id_nicht_reserviert
  check (id not in ('admin', 'administration', 'root', 'system', 'support'));

-- 4) Eine Reservierung darf nur auf einen Termin desselben Veranstalters verweisen.
create function private.termin_gehoert_zu(p_termin uuid, p_veranstalter text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_termin is null
    or exists (select 1 from public.termine t where t.id = p_termin and t.veranstalter_id = p_veranstalter);
$$;
grant execute on function private.termin_gehoert_zu(uuid, text) to authenticated;

drop policy "reservierungen anlegen" on public.reservierungen;
drop policy "reservierungen aendern" on public.reservierungen;

create policy "reservierungen anlegen" on public.reservierungen
  for insert to authenticated
  with check (
    (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()))
    and private.termin_gehoert_zu(termin_id, veranstalter_id)
  );
create policy "reservierungen aendern" on public.reservierungen
  for update to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()))
  with check (
    (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()))
    and private.termin_gehoert_zu(termin_id, veranstalter_id)
  );

-- 5) Längenlimits auch in der Datenbank (gleich wie im Formular), falls jemand direkt über die API schreibt.
alter table public.termine
  add constraint termine_laengen check (
    length(titel) <= 120
    and coalesce(length(ort), 0) <= 120
    and coalesce(length(beschreibung), 0) <= 2000
    and coalesce(length(ansprechpartner), 0) <= 200
  );
alter table public.reservierungen
  add constraint reservierungen_laengen check (
    coalesce(length(zweck), 0) <= 120
    and coalesce(length(ansprechpartner), 0) <= 120
    and coalesce(length(telefon), 0) <= 40
  );
alter table public.veranstalter
  add constraint veranstalter_laengen check (length(name) <= 80 and length(kuerzel) <= 4);
