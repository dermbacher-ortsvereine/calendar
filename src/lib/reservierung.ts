// Reservierungen: Prüfung, Zeitraum-Literale und Umrechnung nach Europe/Berlin.
// Ohne Laufzeit-Imports (mit `node --test` testbar).

export type ReservierungEingabe = {
  raum_id: string;
  datum: string;
  von: string;
  bis: string;
  zweck: string;
  ansprechpartner: string;
  telefon: string;
  veranstalter_id: string;
};

export type ReservierungDaten = {
  raum_id: string;
  zeitraum: string; // tstzrange-Literal
  zweck: string | null;
  ansprechpartner: string | null;
  telefon: string | null;
};

const ZEIT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function gueltigesDatum(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && y >= 2000 && y <= 2100;
}

function folgetag(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

const leerZuNull = (s: string, max: number) => (s.trim() === "" ? null : s.trim().slice(0, max));

/**
 * tstzrange-Literal in Berliner Ortszeit, z. B.
 * ["2026-10-21 19:00 Europe/Berlin","2026-10-21 22:00 Europe/Berlin")
 * Postgres rechnet die Zeitzone (inkl. Sommerzeit) selbst um. Bis <= Von = Folgetag.
 */
export function zeitraumLiteral(datum: string, von: string, bis: string): string {
  const v = von.slice(0, 5);
  const b = bis.slice(0, 5);
  const endDatum = b <= v ? folgetag(datum) : datum;
  return `["${datum} ${v} Europe/Berlin","${endDatum} ${b} Europe/Berlin")`;
}

export function eingabeAusFormData(formData: FormData): ReservierungEingabe {
  const wert = (k: string) => String(formData.get(k) ?? "");
  return {
    raum_id: wert("raum_id"),
    datum: wert("datum"),
    von: wert("von"),
    bis: wert("bis"),
    zweck: wert("zweck"),
    ansprechpartner: wert("ansprechpartner"),
    telefon: wert("telefon"),
    veranstalter_id: wert("veranstalter_id"),
  };
}

export function pruefeReservierung(
  e: ReservierungEingabe,
  raumIds: string[],
): { ok: true; daten: ReservierungDaten } | { ok: false; fehler: Partial<Record<keyof ReservierungEingabe, string>> } {
  const fehler: Partial<Record<keyof ReservierungEingabe, string>> = {};
  if (!raumIds.includes(e.raum_id)) fehler.raum_id = "Bitte einen Raum wählen.";
  if (!gueltigesDatum(e.datum)) fehler.datum = "Bitte ein gültiges Datum wählen.";
  if (!ZEIT.test(e.von)) fehler.von = "Bitte die Startzeit wählen.";
  if (!ZEIT.test(e.bis)) fehler.bis = "Bitte die Endzeit wählen.";
  else if (ZEIT.test(e.von) && e.von.slice(0, 5) === e.bis.slice(0, 5)) fehler.bis = "Von und Bis dürfen nicht gleich sein.";
  if (e.zweck.trim().length > 120) fehler.zweck = "Höchstens 120 Zeichen.";
  if (e.ansprechpartner.trim().length > 120) fehler.ansprechpartner = "Höchstens 120 Zeichen.";
  if (e.telefon.trim().length > 40) fehler.telefon = "Höchstens 40 Zeichen.";
  if (Object.keys(fehler).length) return { ok: false, fehler };

  return {
    ok: true,
    daten: {
      raum_id: e.raum_id,
      zeitraum: zeitraumLiteral(e.datum, e.von, e.bis),
      zweck: leerZuNull(e.zweck, 120),
      ansprechpartner: leerZuNull(e.ansprechpartner, 120),
      telefon: leerZuNull(e.telefon, 40),
    },
  };
}

/** Postgres-Ausgabe eines tstzrange, z. B. ["2026-10-21 17:00:00+00","2026-10-21 20:00:00+00") */
export function parseZeitraum(range: string): { start: Date; ende: Date } | null {
  const m = /^[[(]"?([^",]+)"?,"?([^",]+)"?[\])]$/.exec(range.trim());
  if (!m) return null;
  const iso = (s: string) => new Date(s.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  const start = iso(m[1]);
  const ende = iso(m[2]);
  return Number.isNaN(start.getTime()) || Number.isNaN(ende.getTime()) ? null : { start, ende };
}

const berlinDatum = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });
const berlinZeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Zeitpunkt -> { datum: "YYYY-MM-DD", zeit: "HH:MM" } in Berliner Ortszeit */
export function inBerlin(d: Date): { datum: string; zeit: string } {
  return { datum: berlinDatum.format(d), zeit: berlinZeit.format(d) };
}

/** Montag der Woche, in der `tag` liegt. */
export function wochenMontag(tag: string): string {
  const [y, m, d] = tag.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}
