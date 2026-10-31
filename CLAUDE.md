# Übergabe: dermbacher-ortsvereine.de

Hallo Claude Code! Diese Datei beschreibt das Projekt, die Zielarchitektur und wo die Designs liegen. Bitte lies sie vollständig, bevor du Code schreibst, und stimme den Umsetzungsplan zuerst mit mir ab.

## 0. WICHTIG: Öffentliches Repository – keine Geheimnisse committen

Dieses Repository ist **öffentlich** (github.com/dermbacher-ortsvereine/calendar). Deshalb gilt ohne Ausnahme:

- **Niemals** Passwörter, API-Schlüssel, Tokens, Datenbank-Passwörter, Service-Role-Keys, Supabase-Zugangsdaten oder echte personenbezogene Daten (Telefonnummern, private E-Mail-Adressen) committen – auch nicht in Seeds, Tests, Kommentaren oder Beispieldateien.
- Lokale Werte stehen nur in `.env.local` (per `.gitignore` ausgeschlossen). Im Repo liegt nur `.env.example` mit leeren Platzhaltern.
- Echte Werte trägt **der Projektinhaber selbst** ein: in **Vercel** (Project Settings → Environment Variables) bzw. in **Supabase** (Dashboard: Auth-Benutzer, Passwörter, Einstellungen). Claude gibt in solchen Fällen Bescheid, welcher Wert wo einzutragen ist, statt ihn ins Repo zu schreiben.
- Initiale Passwörter der Veranstalter werden **nicht** im Seed oder in Migrationen gesetzt, sondern im Supabase-Dashboard bzw. über die Admin-Seite.
- Vor jedem Commit prüfen (`git diff --staged`), dass keine Geheimnisse enthalten sind.

## 1. Worum es geht

Dermbach (Stadtteil von Herdorf, Kreis Altenkirchen) ist ein kleiner Ort mit einer Handvoll Ortsvereinen und Veranstaltern. Sie treffen sich zweimal im Jahr und pflegen einen gemeinsamen Jahreskalender aller Veranstaltungen. Bisher läuft das umständlich: Termine werden an eine Person gemailt, die sie in eine Excel-Liste einträgt, und die Liste wird herumgeschickt.

Das soll durch eine einfache Web-App unter **dermbacher-ortsvereine.de** ersetzt werden:

1. **Öffentlicher Kalender** (Hauptsache): Jeder kann ohne Login alle Termine sehen, filtern und Details aufrufen.
2. **Termine pflegen**: Jeder Veranstalter meldet sich mit seinem eigenen Passwort an und pflegt seine eigenen Termine selbst.
3. **Räume** (Zusatz): Belegungsplan und Reservierung für zwei Räume in der Turnhalle: das **Stüffjen** (genau so geschrieben) und den **Schulungsraum**.

Leitlinie für alles: **sehr einfach bedienbar**. Die Nutzer sind Ehrenamtliche jeden Alters, viele am Handy. Lieber eine Funktion weniger als eine komplizierte Oberfläche.

## 2. Designs

Im Ordner `design/` liegen die abgestimmten Entwürfe als HTML-Dateien:

| Datei | Inhalt |
|---|---|
| `design/01-kalender.dc.html` | Öffentlicher Kalender: Monatsansicht, Liste „Nächste Termine“, Filter, Detailansicht, „Demnächst“, iCal-Abo |
| `design/02-raeume.dc.html` | Räume: Raumauswahl, Wochenbelegung, Reservierungsformular |
| `design/03-termine-pflegen.dc.html` | Login pro Veranstalter, Formular „Neuer Termin“, Liste „Eure Termine“ |

Hinweise zu diesen Dateien:

- Es sind **Design-Referenzen, kein Produktionscode**. Sie stammen aus einem Design-Canvas (Claude Design) und laden ein `support.js`, das es hier nicht gibt. Sie rendern also nicht direkt im Browser.
- Lies sie als Spezifikation: Layout, Abstände, Farben, Schriften und Texte stehen als Inline-Styles im Markup. Die Beispieldaten (Veranstalter, Termine, Belegungen) und die Interaktionslogik stehen im `<script>`-Block am Ende jeder Datei.
- Baue die Oberfläche **nach diesen Vorlagen als echte Komponenten** nach. Übernimm Optik und Texte möglichst genau, aber kopiere nicht das Template-Format.
- Die interaktive Original-Version liegt auch auf claude.ai (privat, nur für mich sichtbar): https://claude.ai/artifact/RXz4HAHyuBtPibTTbHz83w. Du kannst sie nicht öffnen; maßgeblich ist der Ordner `design/`.

### Design-Tokens

- **Schriften** (Google Fonts): Überschriften „Bricolage Grotesque“ (600/700), Fließtext „Figtree“ (400–700). Bitte per `next/font` selbst hosten (DSGVO, keine Requests an Google).
- **Grundfarben**: Hintergrund `#F3F5F3`, Flächen `#FFFFFF`, Text `#17201B`, gedämpfter Text `#56615A`, Linien `#DDE3DF`, Akzent (Primärbuttons, Logo, „Heute“) `#24573A`, heller Akzent `#E6EEE8`.
- **Radien**: Karten 16 px, Buttons und Eingabefelder 10 px, Chips rund.
- **Klickflächen**: mindestens 44 px hoch.

### Veranstalter und Farben

Es gibt **keine Unterscheidung** zwischen Verein und Veranstalter; in der Oberfläche heißt alles „Veranstalter“.

| Kürzel | Name | Textfarbe | Hintergrund |
|---|---|---|---|
| vfl | VfL Dermbach | `#1D5FA8` (Blau) | `#E4EEF9` |
| mv | Musikverein Dermbach | `#0B6670` (Türkis) | `#DDF1F2` |
| gv | Gesangsverein Dermbach | `#3B6E12` (Grün) | `#E6F2D5` |
| ff | Freiwillige Feuerwehr Dermbach | `#B3261E` (Rot) | `#FAE6E4` |
| kfd | kfd Dermbach | `#6B3FA0` (Lila) | `#EFE8F8` |
| wt | Weihnachtstreiben GbR | `#6B3A1E` (Braun) | `#F1E2D6` |
| kar | Karnevals GbR | `#6E5000` (Gelb: dunkle Schrift) | `#FFE58A` |

Die Farben gehören in die Datenbank (Tabelle `veranstalter`), nicht fest in den Code, damit später weitere Veranstalter dazukommen können. Neben jeder Farbe steht in der Oberfläche immer der Name; die Farbe ist nie das einzige Unterscheidungsmerkmal.

**Logos**: Noch nicht vorhanden. Jeder Veranstalter bekommt ein optionales Logo-Feld. Bis ein Logo hochgeladen ist, zeigt die Detailansicht einen runden Platzhalter mit dem Kürzel (VfL, MV, GV, FF, kfd, WT, KG).

## 3. Technik (Zielarchitektur)

- **Framework**: Next.js (App Router, TypeScript), Deployment auf **Vercel**.
- **Datenbank und Login**: **Supabase** (Postgres, Auth, Row Level Security, Storage für Logos). Als Alternative war Neon im Gespräch; ich habe mich für Supabase entschieden, weil Login, Rechte und Datei-Upload damit gleich mit erledigt sind.
- **Styling**: Tailwind CSS mit den Tokens oben als Theme.
- **Zeitzone**: Alles in `Europe/Berlin`; in der Datenbank `timestamptz` bzw. Datum plus Uhrzeit.
- **Sprache**: Oberfläche komplett Deutsch, Datumsformat „Sa, 24. Okt.“ bzw. „Samstag, 24. Oktober 2026“, Wochen beginnen am Montag.
- Bitte jeweils die aktuellen stabilen Versionen verwenden und keine unnötigen Abhängigkeiten einbauen.

## 4. Funktionen im Detail

### 4.1 Öffentlicher Kalender (`/`)

- Monatsansicht mit Blättern (‹ ›) und „Heute“; der heutige Tag ist markiert.
- Umschalter „Monat“ / „Nächste Termine“ (Liste ab heute, nach Monaten gruppiert).
- Filter-Chips „Veranstalter:“. Verhalten wie im Design: Am Anfang sind alle aktiv. Ein Klick auf einen Chip zeigt nur diesen Veranstalter, weitere Klicks fügen hinzu oder entfernen. „Alle anzeigen“ setzt zurück. Der Filter steht in der URL (z. B. `?v=mv,ff`), damit man gefilterte Links teilen kann.
- Klick auf einen Termin öffnet die Detailansicht (Desktop: rechte Spalte; Handy: Bottom-Sheet oder eigene Seite `/termin/[id]`): Veranstalter mit Logo, Titel, Datum, Uhrzeit, Ort, Beschreibung, Ansprechpartner, Button „In meinen Kalender (.ics)“.
- Seitenleiste „Demnächst“ mit den nächsten 5 Terminen.
- Kasten „Kalender abonnieren“: kopiert einen iCal-Link; das Abo respektiert den aktuellen Filter.
- **Am Handy**: Die Monatsansicht zeigt pro Tag nur farbige Punkte bzw. Kurzformen. Standardansicht auf kleinen Bildschirmen ist die Liste „Nächste Termine“.

### 4.2 Räume (`/raeume`)

- Zwei große Auswahlkarten (Stüffjen, Schulungsraum), nur mit Namen und „x Belegungen in dieser Woche“.
- Wochenansicht Mo–So mit Blättern; pro Tag die Belegungen (Uhrzeit, Veranstalter, Zweck) oder „Noch frei“; Button „Reservieren“ übernimmt das Datum ins Formular.
- Reservierungsformular: Raum, Datum, Von, Bis, Veranstalter, Wofür, Ansprechpartner und Telefon. Darunter nur der Hinweis „Überschneidungen werden automatisch geprüft.“
- Ansehen ist öffentlich, **Reservieren nur mit Veranstalter-Login**. Ist man nicht angemeldet, führt „Reservieren“ zum Login und danach zurück.
- Überschneidungen werden in der Datenbank verhindert (siehe 5.), nicht nur im Frontend.

### 4.3 Termine pflegen (`/login`, `/verwaltung`)

- Login: Auswahlfeld „Veranstalter“ und Passwort. Technisch ist jeder Veranstalter ein Supabase-Auth-Benutzer mit einer internen E-Mail (z. B. `mv@dermbacher-ortsvereine.de`); das Auswahlfeld setzt diese E-Mail im Hintergrund ein. Niemand muss eine E-Mail-Adresse eintippen.
- Nach dem Login: „Angemeldet: [Veranstalter]“ und „Abmelden“ im Header.
- Formular „Neuer Termin“: Titel, Datum, Beginn, Ende (optional), Ort (Freitext mit Vorschlägen: Turnhalle, Stüffjen, Schulungsraum, Dorfplatz, Sportplatz, Kirche, Feuerwehrgerätehaus), Beschreibung (optional). Checkbox „Stüffjen oder Schulungsraum gleich mit reservieren“: legt die passende Raumreservierung mit an; bei Konflikt verständliche Meldung, der Termin wird trotzdem gespeichert.
- Liste „Eure Termine“ (eigene, ab heute) mit Bearbeiten und Löschen (Löschen mit Rückfrage).
- Erfolgsmeldung: „Termin gespeichert – er ist ab sofort im öffentlichen Kalender sichtbar.“
- Ein Veranstalter sieht und ändert **nur seine eigenen** Termine und Reservierungen.

### 4.4 Administration (klein halten)

- Eine Admin-Rolle (ich) kann Veranstalter anlegen, Name, Kürzel, Farben und Logo pflegen und Passwörter zurücksetzen, außerdem jeden Termin und jede Reservierung bearbeiten.
- Einfache Admin-Seite `/admin` reicht; kein großes Backend.

### 4.5 iCal

- `GET /api/ical` liefert alle zukünftigen Termine (plus z. B. 3 Monate Vergangenheit) als `.ics`, optional gefiltert mit `?v=mv,ff`.
- `GET /api/ical/[id]` liefert einen einzelnen Termin als Download.
- Korrekte Zeitzone (`Europe/Berlin`, VTIMEZONE), stabile UIDs, Cache-Header für Vercel.

## 5. Datenmodell (Vorschlag)

```sql
create table veranstalter (
  id text primary key,                 -- 'vfl', 'mv', ...
  name text not null,
  kuerzel text not null,               -- 'VfL', 'MV', ...
  farbe text not null,                 -- Textfarbe, z. B. '#1D5FA8'
  farbe_hg text not null,              -- Hintergrund, z. B. '#E4EEF9'
  logo_url text,
  login_email text unique not null,
  sortierung int not null default 0,
  aktiv boolean not null default true
);

create table profile (                 -- verknüpft Auth-User mit Veranstalter/Rolle
  user_id uuid primary key references auth.users on delete cascade,
  veranstalter_id text references veranstalter,
  ist_admin boolean not null default false
);

create table termine (
  id uuid primary key default gen_random_uuid(),
  veranstalter_id text not null references veranstalter,
  titel text not null,
  datum date not null,
  beginn time not null,
  ende time,
  ort text,
  beschreibung text,
  ansprechpartner text,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

create table raeume (
  id text primary key,                 -- 'stueffjen', 'schulungsraum'
  name text not null                   -- 'Stüffjen', 'Schulungsraum'
);

create extension if not exists btree_gist;

create table reservierungen (
  id uuid primary key default gen_random_uuid(),
  raum_id text not null references raeume,
  veranstalter_id text not null references veranstalter,
  zeitraum tstzrange not null,
  zweck text,
  ansprechpartner text,
  termin_id uuid references termine on delete set null,
  exclude using gist (raum_id with =, zeitraum with &&)   -- keine Überschneidungen
);
```

Row Level Security:

- `veranstalter`, `termine`, `raeume`, `reservierungen`: **lesen für alle** (auch anonym).
- `termine` und `reservierungen` schreiben, ändern und löschen: nur wenn `veranstalter_id` zum eigenen Profil passt, oder als Admin.
- `veranstalter` und `profile` ändern: nur Admin.
- Bei Reservierungen öffentlich nur Raum, Zeitraum, Veranstalter und Zweck anzeigen, nicht Telefonnummern (eigene View oder Spaltenauswahl).

Bitte als Supabase-Migrationen anlegen (`supabase/migrations`), plus `seed.sql` mit den sieben Veranstaltern und den zwei Räumen. Beispieltermine aus den Designs gern als optionale Seed-Daten für die Entwicklung, aber getrennt von den echten Stammdaten.

## 6. Seitenstruktur

```
/                    Öffentlicher Kalender (Monat / Nächste Termine)
/termin/[id]         Termin-Detail (Handy, teilbare Links)
/raeume              Belegung und Reservierung
/login               Veranstalter-Login
/verwaltung          Eigene Termine pflegen (geschützt)
/admin               Veranstalter verwalten (nur Admin)
/impressum, /datenschutz
/api/ical, /api/ical/[id]
```

## 7. Weitere Anforderungen

- **Barrierearm**: echte `<button>`/`<a>`/`<label>`, Tastaturbedienung, ausreichende Kontraste (die Farben oben sind darauf abgestimmt).
- **Responsive**: Alles muss am Handy gut funktionieren; das Menü bricht um.
- **Datenschutz**: keine Tracking- oder Analyse-Tools, keine externen Schriften oder Skripte, nur notwendige Cookies (Login). Impressum- und Datenschutzseite mit Platzhaltertext.
- **Performance**: Kalender serverseitig rendern; öffentliche Seiten kurz cachen und nach Änderungen neu validieren.
- **Umgebungsvariablen**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur serverseitig, z. B. für Admin-Funktionen). Eine `.env.example` anlegen, niemals echte Schlüssel committen.

## 8. Offene Punkte (bitte als Platzhalter umsetzen, nicht erfinden)

- Logos der Veranstalter (kommen später als Datei-Upload).
- Ansprechpartner, Kontakt für „Passwort vergessen?“, Texte für Impressum und Datenschutz.
- Platzzahl und Ausstattung der Räume werden aktuell nicht angezeigt.
- Platzhalter in eckigen Klammern aus den Designs (z. B. `[Ort]`, `[Preis]`) sind Beispieldaten, kein fester Text.

## 9. Vorgehen

1. Lies dieses Dokument und die drei Dateien in `design/`.
2. Schlag mir einen kurzen Umsetzungsplan vor (Reihenfolge, offene Fragen) und warte auf mein OK.
3. Dann Schritt für Schritt: Projekt-Grundgerüst und Theme, Datenbank-Migrationen und Seed, öffentlicher Kalender, iCal, Login und Verwaltung, Räume, Admin.
4. Nach jedem größeren Schritt kurz zusammenfassen, was fertig ist und wie ich es lokal teste.
5. Zum Schluss: Anleitung für Supabase-Projekt, Vercel-Deployment und Domain-Anbindung von dermbacher-ortsvereine.de.

## 10. Entscheidungen (abgestimmt am 19.10.2026)

Diese Punkte gehen den Abschnitten oben vor:

- **Node/Paketmanager**: Node über `nvm` (aktuell v26), Paketmanager `pnpm`. Next.js 16.4 (App Router, `cacheComponents`), React 19, Tailwind v4.
- **Telefon bei Reservierungen**: zusätzliche Spalte `reservierungen.telefon`. Öffentlich nicht sichtbar, nur für den eigenen Veranstalter und den Admin.
- **Admin-Login**: eigener Auth-Benutzer mit `profile.ist_admin = true` (ohne Veranstalter). Erscheint im Login-Auswahlfeld als letzter Eintrag „Administration“.
- **„Stüffjen oder Schulungsraum gleich mit reservieren“** (4.3): wird **vorerst nicht** umgesetzt. Termine und Reservierungen werden getrennt gepflegt; `reservierungen.termin_id` bleibt für später im Schema.
- **Veranstalter im Reservierungsformular**: für normale Nutzer der eigene Veranstalter (oder ein gemeinsamer, siehe unten); nur der Admin kann frei auswählen.
- **Raum-IDs**: `stueffjen` und `schulungsraum` (wie in Abschnitt 5, nicht wie im Design-Skript).
- **Stammdaten** (7 Veranstalter, 2 Räume) stehen in einer Migration (`supabase/migrations/*_stammdaten.sql`), damit sie per `supabase db push` auch in Produktion landen. `supabase/seed.sql` enthält nur Beispieltermine für die lokale Entwicklung.
- **Zugänge**: Profile (Verknüpfung Auth-Benutzer ↔ Veranstalter/Admin) legt **nur der Server** mit dem Service-Role-Schlüssel an (`zugangSetzen` in `src/lib/supabase/admin.ts`, Skript `scripts/zugaenge-anlegen.mjs`). Der frühere E-Mail-Trigger wurde aus Sicherheitsgründen entfernt (Migration `*_haertung.sql`); den ersten Admin verknüpft einmalig eine SQL-Zeile im Supabase SQL Editor (Deployment-Anleitung liegt nur lokal in `docs/`, nicht im Repo). Deaktivierte Veranstalter verlieren Sitzung und Schreibrechte. Selbstregistrierung ist abgeschaltet – in Produktion im Supabase-Dashboard unter Authentication → Sign In / Providers „Allow new users to sign up“ **ausschalten**, den Email-Provider aber **eingeschaltet** lassen und „Confirm email“ ausschalten.
- **Lokales Supabase** läuft auf den Ports 564xx (API 56421, DB 56422, Studio 56423), weil auf dem Entwicklungsrechner weitere Supabase-Projekte laufen.
- **iCal**: eigener Generator in `src/lib/ical.ts` (keine Abhängigkeit, Tests: `pnpm test`). Termine ohne Ende haben kein `DTEND`; Ende ≤ Beginn = Folgetag. Feed: ab 92 Tagen in der Vergangenheit. CDN-Cache 5 Min. (`s-maxage=300`). Links im Feed nutzen `NEXT_PUBLIC_SITE_URL` – in Vercel auf `https://dermbacher-ortsvereine.de` setzen.
- **Admin (`/admin`)**: Veranstalter bearbeiten (inkl. Kontrastprüfung WCAG AA ≥ 4.5:1), anlegen (Login-Adresse `<kennung>@dermbacher-ortsvereine.de` + Startpasswort), deaktivieren statt löschen, Logo (PNG/JPG/WebP ≤ 2 MB, kein SVG), Passwörter setzen. Auth-Benutzer verwaltet der Server mit `SUPABASE_SERVICE_ROLE_KEY` (`src/lib/supabase/admin.ts`, nur serverseitig); alles andere läuft über die Admin-Sitzung und RLS.
- **Ganztägige und mehrtägige Termine** (abgestimmt am 29.10.2026, Migration `*_ganztaegig_mehrtaegig.sql`): `termine.beginn` leer = ganztägig (Formular: Checkbox „Ganztägig“), `termine.bis_datum` = letzter Tag mehrtägiger Termine (`beginn` gilt für den ersten, `ende` für den letzten Tag). Monatsansicht zeigt mehrtägige Termine an jedem Tag; iCal ganztägig als `VALUE=DATE`.
- **Ortsbezeichnung**: MZH, Turnhalle und Mehrzweckhalle sind dasselbe Gebäude – in Oberfläche und Daten immer „Mehrzweckhalle“.
- **Weitere Veranstalter** (aus dem Excel-Import, nicht in der Stammdaten-Migration): `hv` Heimatverein Dermbach (HV), `kkd` KKD (KKD), `ag` Allgemein (AG, für Termine ohne Veranstalter wie Wahlen oder Kirchenjubiläen).
- **Raumsperren** (abgestimmt am 30.10.2026, Migration `*_raumsperren.sql`): Nur der Admin kann einen Raum für ganze Tage sperren (`/raeume`, Umschalter „Reservieren / Sperren“). Technisch eine Zeile in `reservierungen` mit `gesperrt = true`, ohne Veranstalter, Hinweis in `zweck` (Pflicht, öffentlich sichtbar). Die bestehende Ausschlussbedingung verhindert damit Reservierungen an diesen Tagen; bestehende Reservierungen müssen vor dem Sperren storniert oder verschoben werden. In der Wochenansicht grau gestreift mit Schloss, kein „Reservieren“-Knopf an gesperrten Tagen.
- **Gemeinsame Veranstalter** (abgestimmt am 30.10.2026, Migration `*_gemeinsame_veranstalter.sql`): `veranstalter.gemeinsam = true` (zunächst nur `ov` „Ortsvereine Dermbach“, Kürzel OV, Indigo `#3A3D99` auf `#E6E7F7` – bewusst getrennt von `ag` „Allgemein“). Gemeinsame Veranstalter haben **keinen eigenen Zugang** (nicht im Login, kein Passwort in `/admin`, nicht im Zugangsskript; ein Profil darauf bekommt keine Rechte). Jeder angemeldete Veranstalter darf in ihrem Namen Termine und Reservierungen anlegen, ändern und löschen und sieht dabei auch Ansprechpartner/Telefon (RLS über `private.darf_schreiben_fuer`). Im Formular wählt man zwischen eigenem Veranstalter (vorausgewählt) und „Ortsvereine Dermbach (gemeinsam)“. `termine.eingetragen_von` / `reservierungen.eingetragen_von` setzt die Datenbank beim Anlegen aus der Sitzung (danach unveränderlich, Admin: leer); angezeigt als „eingetragen von …“ in Belegung und Verwaltung.
- **Wiederkehrende Reservierungen** (abgestimmt am 31.10.2026, Migration `*_reservierungsserien.sql`): Im Reservierungsformular „Wiederholen“ mit nur drei Rhythmen – jede Woche, alle 2 Wochen, jeden Monat am n-ten (bzw. letzten) Wochentag – plus „bis einschließlich“ (höchstens ein Jahr). Jede Wiederholung ist eine eigene Zeile in `reservierungen`, verbunden über `serie_id`. Belegte Tage werden vorab ermittelt und angezeigt; „Die übrigen N reservieren“ legt den Rest in einem Schritt an. Bearbeiten und Stornieren fragen bei Reihen „Nur diesen Termin“ (vorausgewählt) / „Diesen und alle folgenden“. Beim Ändern der Reihe behält jeder Termin seinen Tag (Datum gesperrt); Uhrzeit, Raum, Zweck, Veranstalter und Kontakt gelten für alle, belegte Tage bleiben auf Wunsch unverändert. Anderer Wochentag oder Rhythmus: „alle folgenden“ stornieren und neu anlegen. Wochenansicht: Wiederholungssymbol an Reihenterminen.
