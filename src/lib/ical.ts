// iCalendar-Erzeugung (RFC 5545) ohne externe Abhängigkeit.
// Bewusst ohne Laufzeit-Imports, damit die Datei direkt mit `node --test` testbar ist.

export type IcalTermin = {
  id: string;
  titel: string;
  datum: string; // "YYYY-MM-DD"
  bis_datum: string | null; // letzter Tag mehrtägiger Termine
  beginn: string | null; // "HH:MM[:SS]"; leer = ganztägig
  ende: string | null; // bei eintägigen Terminen: ende <= beginn bedeutet Folgetag
  ort: string | null;
  beschreibung: string | null;
  ansprechpartner: string | null;
  geaendert_am: string; // ISO-Zeitstempel
  veranstalterName: string;
};

const UID_DOMAIN = "dermbacher-ortsvereine.de";

const VTIMEZONE_BERLIN = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Berlin",
  "X-LIC-LOCATION:Europe/Berlin",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** Text-Werte escapen: Backslash, Semikolon, Komma, Zeilenumbrüche. */
export function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, String.raw`\;`)
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Zeilen auf max. 75 Oktette falten (UTF-8-sicher, keine Zeichen zerteilen). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const teile: string[] = [];
  let aktuell = "";
  let bytes = 0;
  for (const zeichen of line) {
    const laenge = encoder.encode(zeichen).length;
    const limit = teile.length === 0 ? 75 : 74; // Folgezeilen beginnen mit einem Leerzeichen
    if (bytes + laenge > limit) {
      teile.push(aktuell);
      aktuell = "";
      bytes = 0;
    }
    aktuell += zeichen;
    bytes += laenge;
  }
  teile.push(aktuell);
  return teile.join("\r\n ");
}

function lokaleZeit(datum: string, zeit: string): string {
  return `${datum.replaceAll("-", "")}T${zeit.slice(0, 5).replace(":", "")}00`;
}

function folgetag(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return t.toISOString().slice(0, 10);
}

function ganzerTag(datum: string): string {
  return datum.replaceAll("-", "");
}

function utcStempel(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** DTSTART/DTEND: ganztägig als DATE (DTEND exklusiv), sonst Ortszeit Berlin. */
function zeitraum(t: IcalTermin): string[] {
  const letzterTag = t.bis_datum ?? t.datum;
  if (!t.beginn) {
    return [`DTSTART;VALUE=DATE:${ganzerTag(t.datum)}`, `DTEND;VALUE=DATE:${ganzerTag(folgetag(letzterTag))}`];
  }
  const start = `DTSTART;TZID=Europe/Berlin:${lokaleZeit(t.datum, t.beginn)}`;
  if (t.ende) {
    const endDatum = !t.bis_datum && t.ende.slice(0, 5) <= t.beginn.slice(0, 5) ? folgetag(t.datum) : letzterTag;
    return [start, `DTEND;TZID=Europe/Berlin:${lokaleZeit(endDatum, t.ende)}`];
  }
  // mehrtägig ohne Ende: bis zum Ende des letzten Tages
  if (t.bis_datum) return [start, `DTEND;TZID=Europe/Berlin:${lokaleZeit(folgetag(t.bis_datum), "00:00")}`];
  return [start];
}

function vevent(t: IcalTermin, basisUrl: string): string[] {
  const beschreibung = [
    t.beschreibung,
    t.ansprechpartner ? `Ansprechpartner: ${t.ansprechpartner}` : null,
    `Veranstalter: ${t.veranstalterName}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const zeilen = [
    "BEGIN:VEVENT",
    `UID:${t.id}@${UID_DOMAIN}`,
    `DTSTAMP:${utcStempel(t.geaendert_am)}`,
    `LAST-MODIFIED:${utcStempel(t.geaendert_am)}`,
    ...zeitraum(t),
  ];
  zeilen.push(`SUMMARY:${escapeText(t.titel)}`);
  if (t.ort) zeilen.push(`LOCATION:${escapeText(t.ort)}`);
  zeilen.push(`DESCRIPTION:${escapeText(beschreibung)}`);
  zeilen.push(`CATEGORIES:${escapeText(t.veranstalterName)}`);
  zeilen.push(`URL:${basisUrl}/termin/${t.id}`);
  zeilen.push("END:VEVENT");
  return zeilen;
}

export function erzeugeKalender(
  termine: IcalTermin[],
  { name, basisUrl }: { name: string; basisUrl: string },
): string {
  const zeilen = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dermbacher Ortsvereine//Veranstaltungskalender//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Europe/Berlin",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...VTIMEZONE_BERLIN,
    ...termine.flatMap((t) => vevent(t, basisUrl)),
    "END:VCALENDAR",
  ];
  return zeilen.map(foldLine).join("\r\n") + "\r\n";
}

/** Dateiname für den Download, z. B. "herbstkonzert-2026-11-07.ics". */
export function dateiname(t: Pick<IcalTermin, "titel" | "datum">): string {
  const slug = t.titel
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "termin"}-${t.datum}.ics`;
}
