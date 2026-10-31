-- Wiederkehrende Reservierungen („jeden Dienstag“, „alle 2 Wochen“, „jeden 1. Montag im Monat“):
-- Jede Wiederholung ist eine eigene Zeile; alle Zeilen einer Reihe teilen sich serie_id.
-- So prüft die bestehende Ausschlussbedingung jeden Tag einzeln, und einzelne Tage lassen
-- sich ganz normal ändern oder stornieren. Rechte (RLS) bleiben unverändert.

alter table public.reservierungen
  add column serie_id uuid;

create index reservierungen_serie_idx on public.reservierungen (serie_id) where serie_id is not null;

-- Sperren gehören nie zu einer Reihe.
alter table public.reservierungen
  add constraint reservierungen_serie_ohne_sperre check (not (gesperrt and serie_id is not null));

-- Öffentliche Belegung: Kennzeichnung als Reihe (neue Spalte am Ende, Rechte bleiben erhalten).
create or replace view public.reservierungen_oeffentlich as
  select r.id, r.raum_id, r.veranstalter_id, r.zeitraum, r.zweck, r.gesperrt, r.eingetragen_von, r.serie_id
  from public.reservierungen r;
