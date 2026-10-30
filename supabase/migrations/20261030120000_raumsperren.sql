-- Raumsperren: Der Admin kann einen Raum für ganze Tage sperren (z. B. Renovierung, Kirmes).
-- Eine Sperre ist eine Reservierung ohne Veranstalter mit gesperrt = true; zweck enthält den Hinweis.
-- Die bestehende Ausschlussbedingung reservierungen_keine_ueberschneidung verhindert damit
-- automatisch weitere Reservierungen in diesem Zeitraum.
--
-- Rechte: Die bestehenden RLS-Regeln erlauben Zeilen ohne Veranstalter nur dem Admin
-- (veranstalter_id = eigener_veranstalter() ist bei NULL nie wahr).

alter table public.reservierungen
  add column gesperrt boolean not null default false;

alter table public.reservierungen
  alter column veranstalter_id drop not null;

alter table public.reservierungen
  add constraint reservierungen_sperre check (
    case
      when gesperrt then veranstalter_id is null and termin_id is null and zweck is not null
        and length(trim(zweck)) > 0 and ansprechpartner is null and telefon is null
      else veranstalter_id is not null
    end
  );

-- Öffentliche Belegung um die Kennzeichnung erweitern (neue Spalte am Ende, Rechte bleiben erhalten).
create or replace view public.reservierungen_oeffentlich as
  select r.id, r.raum_id, r.veranstalter_id, r.zeitraum, r.zweck, r.gesperrt
  from public.reservierungen r;
