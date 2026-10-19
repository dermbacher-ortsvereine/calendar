-- Grundschema: Veranstalter, Profile, Termine, Räume, Reservierungen
-- Siehe CLAUDE.md, Abschnitte 5 und 10.

create extension if not exists btree_gist with schema extensions;

-- Hilfsfunktionen liegen in einem nicht per API erreichbaren Schema.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.veranstalter (
  id text primary key check (id ~ '^[a-z0-9-]+$'),   -- 'vfl', 'mv', ...
  name text not null,
  kuerzel text not null,                              -- 'VfL', 'MV', ...
  farbe text not null check (farbe ~ '^#[0-9A-Fa-f]{6}$'),     -- Textfarbe
  farbe_hg text not null check (farbe_hg ~ '^#[0-9A-Fa-f]{6}$'), -- Hintergrund
  logo_url text,
  login_email text unique not null,                   -- interne Login-Adresse, z. B. mv@dermbacher-ortsvereine.de
  sortierung int not null default 0,
  aktiv boolean not null default true
);

create table public.profile (
  user_id uuid primary key references auth.users on delete cascade,
  veranstalter_id text references public.veranstalter on update cascade,
  ist_admin boolean not null default false
);

create table public.termine (
  id uuid primary key default gen_random_uuid(),
  veranstalter_id text not null references public.veranstalter on update cascade,
  titel text not null check (length(trim(titel)) > 0),
  datum date not null,
  beginn time not null,
  ende time,                      -- optional; ende <= beginn bedeutet „bis zum nächsten Tag“
  ort text,
  beschreibung text,
  ansprechpartner text,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

create index termine_datum_idx on public.termine (datum, beginn);
create index termine_veranstalter_idx on public.termine (veranstalter_id, datum);

create table public.raeume (
  id text primary key,            -- 'stueffjen', 'schulungsraum'
  name text not null,             -- 'Stüffjen', 'Schulungsraum'
  sortierung int not null default 0
);

create table public.reservierungen (
  id uuid primary key default gen_random_uuid(),
  raum_id text not null references public.raeume on update cascade,
  veranstalter_id text not null references public.veranstalter on update cascade,
  zeitraum tstzrange not null check (not isempty(zeitraum) and lower_inc(zeitraum) and not upper_inc(zeitraum)),
  zweck text,
  ansprechpartner text,           -- nicht öffentlich
  telefon text,                   -- nicht öffentlich
  termin_id uuid references public.termine on delete set null,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  -- Keine Überschneidungen im selben Raum – geprüft in der Datenbank, nicht nur im Frontend.
  constraint reservierungen_keine_ueberschneidung
    exclude using gist (raum_id with =, zeitraum with &&)
);

create index reservierungen_veranstalter_idx on public.reservierungen (veranstalter_id);

-- ---------------------------------------------------------------------------
-- geaendert_am automatisch pflegen
-- ---------------------------------------------------------------------------

create function private.setze_geaendert_am()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.geaendert_am := now();
  return new;
end;
$$;

create trigger termine_geaendert_am
  before update on public.termine
  for each row execute function private.setze_geaendert_am();

create trigger reservierungen_geaendert_am
  before update on public.reservierungen
  for each row execute function private.setze_geaendert_am();

-- ---------------------------------------------------------------------------
-- Rollen-Helfer (security definer, damit RLS auf profile nicht rekursiv greift)
-- ---------------------------------------------------------------------------

create function private.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.ist_admin from public.profile p where p.user_id = auth.uid()),
    false
  );
$$;

create function private.eigener_veranstalter()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.veranstalter_id from public.profile p where p.user_id = auth.uid();
$$;

grant execute on function private.ist_admin() to anon, authenticated;
grant execute on function private.eigener_veranstalter() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Neue Auth-Benutzer automatisch verknüpfen:
--   E-Mail = veranstalter.login_email  -> Profil dieses Veranstalters
--   E-Mail = admin@dermbacher-ortsvereine.de -> Admin
-- Selbstregistrierung ist abgeschaltet (config.toml / Dashboard), Benutzer legt nur der Admin an.
-- ---------------------------------------------------------------------------

create function private.neuer_auth_benutzer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  select v.id into v_id from public.veranstalter v where lower(v.login_email) = lower(new.email);

  if v_id is not null then
    insert into public.profile (user_id, veranstalter_id, ist_admin)
    values (new.id, v_id, false)
    on conflict (user_id) do update set veranstalter_id = excluded.veranstalter_id;
  elsif lower(new.email) = 'admin@dermbacher-ortsvereine.de' then
    insert into public.profile (user_id, veranstalter_id, ist_admin)
    values (new.id, null, true)
    on conflict (user_id) do update set ist_admin = true;
  end if;

  return new;
end;
$$;

create trigger auth_benutzer_profil
  after insert on auth.users
  for each row execute function private.neuer_auth_benutzer();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.veranstalter enable row level security;
alter table public.profile enable row level security;
alter table public.termine enable row level security;
alter table public.raeume enable row level security;
alter table public.reservierungen enable row level security;

-- Veranstalter: lesen für alle, ändern nur Admin
create policy "veranstalter lesen" on public.veranstalter
  for select to anon, authenticated using (true);
create policy "veranstalter admin" on public.veranstalter
  for all to authenticated
  using ((select private.ist_admin())) with check ((select private.ist_admin()));

-- Profile: eigenes Profil lesen; alles andere nur Admin
create policy "profil lesen" on public.profile
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.ist_admin()));
create policy "profil admin" on public.profile
  for all to authenticated
  using ((select private.ist_admin())) with check ((select private.ist_admin()));

-- Termine: lesen für alle; schreiben nur eigener Veranstalter oder Admin
create policy "termine lesen" on public.termine
  for select to anon, authenticated using (true);
create policy "termine anlegen" on public.termine
  for insert to authenticated
  with check (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));
create policy "termine aendern" on public.termine
  for update to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()))
  with check (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));
create policy "termine loeschen" on public.termine
  for delete to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));

-- Räume: lesen für alle, ändern nur Admin
create policy "raeume lesen" on public.raeume
  for select to anon, authenticated using (true);
create policy "raeume admin" on public.raeume
  for all to authenticated
  using ((select private.ist_admin())) with check ((select private.ist_admin()));

-- Reservierungen: Tabelle selbst (mit Telefon/Ansprechpartner) nur für eigenen Veranstalter oder Admin.
-- Öffentlich lesbar ist nur die View reservierungen_oeffentlich (unten).
create policy "reservierungen lesen" on public.reservierungen
  for select to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));
create policy "reservierungen anlegen" on public.reservierungen
  for insert to authenticated
  with check (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));
create policy "reservierungen aendern" on public.reservierungen
  for update to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()))
  with check (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));
create policy "reservierungen loeschen" on public.reservierungen
  for delete to authenticated
  using (veranstalter_id = (select private.eigener_veranstalter()) or (select private.ist_admin()));

-- Öffentliche Belegung: nur Raum, Zeitraum, Veranstalter und Zweck.
-- Bewusst ohne security_invoker, damit anonyme Besucher die Belegung sehen,
-- ohne Zugriff auf Ansprechpartner und Telefon zu bekommen.
create view public.reservierungen_oeffentlich as
  select r.id, r.raum_id, r.veranstalter_id, r.zeitraum, r.zweck
  from public.reservierungen r;

-- ---------------------------------------------------------------------------
-- Rechte (explizit, unabhängig von den Projekt-Standardrechten)
-- ---------------------------------------------------------------------------

revoke all on public.veranstalter, public.profile, public.termine, public.raeume,
  public.reservierungen, public.reservierungen_oeffentlich from anon, authenticated;

grant select on public.veranstalter, public.termine, public.raeume, public.reservierungen_oeffentlich
  to anon, authenticated;
grant insert, update, delete on public.veranstalter, public.termine, public.raeume to authenticated;
grant select, insert, update, delete on public.profile, public.reservierungen to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: Logos (öffentlich lesbar, nur Admin lädt hoch)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "logos admin anlegen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (select private.ist_admin()));
create policy "logos admin aendern" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (select private.ist_admin()))
  with check (bucket_id = 'logos' and (select private.ist_admin()));
create policy "logos admin loeschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (select private.ist_admin()));
