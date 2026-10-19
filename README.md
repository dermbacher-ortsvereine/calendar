# dermbacher-ortsvereine.de – Veranstaltungskalender

Gemeinsamer Kalender der Dermbacher Ortsvereine. Next.js (App Router) + Supabase, Deployment auf Vercel.
Projektbeschreibung und Entscheidungen: siehe [`CLAUDE.md`](CLAUDE.md).

> **Öffentliches Repository:** keine Passwörter, Schlüssel oder echten Kontaktdaten committen.
> Echte Werte gehören in `.env.local` (lokal), in Vercel oder ins Supabase-Dashboard.

## Lokal starten

Voraussetzungen: Node (siehe `.nvmrc`, z. B. `nvm use`), pnpm, Docker, Supabase-CLI.

```bash
pnpm install
pnpm db:start                 # lokales Supabase (Ports 564xx), spielt Migrationen + seed.sql ein
cp .env.example .env.local    # Werte aus `supabase status` eintragen (API_URL, PUBLISHABLE_KEY, SECRET_KEY)
ZUGANG_PASSWORT='…' pnpm zugaenge   # lokale Logins für alle Veranstalter + Administration
pnpm dev                      # http://localhost:3000
```

- Supabase Studio lokal: http://127.0.0.1:56423
- Datenbank neu aufsetzen (Migrationen + Beispieldaten): `pnpm db:reset`, danach `pnpm zugaenge` erneut ausführen.

## Datenbank

- `supabase/migrations/` – Schema, RLS, Stammdaten (Veranstalter, Räume). Gehen per `supabase db push` in Produktion.
- `supabase/seed.sql` – nur Beispieltermine für die lokale Entwicklung (wird von `db push` nicht eingespielt).
