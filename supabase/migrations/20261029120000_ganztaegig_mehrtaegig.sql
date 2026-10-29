-- Ganztägige und mehrtägige Termine (z. B. „Probenwochenende Fr–So, ganztags“).
--   beginn leer   = ganztägig (keine Uhrzeit)
--   bis_datum     = letzter Tag eines mehrtägigen Termins; leer bei eintägigen Terminen.
--                   beginn gilt dann für den ersten Tag, ende für den letzten.

alter table public.termine alter column beginn drop not null;

alter table public.termine add column bis_datum date;

alter table public.termine
  add constraint termine_bis_datum check (bis_datum is null or bis_datum > datum),
  add constraint termine_ende_braucht_beginn check (ende is null or beginn is not null);

-- Für Abfragen „Termine, die in [von, bis] liegen oder hineinreichen“.
create index termine_bis_datum_idx on public.termine (bis_datum) where bis_datum is not null;
