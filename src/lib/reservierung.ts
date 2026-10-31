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
  /** leer = einmalig, sonst ein Wert aus WIEDERHOLUNGEN */
  wiederholung: string;
  /** letzter möglicher Tag der Reihe */
  wiederholen_bis: string;
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
    wiederholung: wert("wiederholung"),
    wiederholen_bis: wert("wiederholen_bis"),
  };
}

export function pruefeReservierung(
  e: ReservierungEingabe,
  raumIds: string[],
):
  | { ok: true; daten: ReservierungDaten; /** alle Tage der Reihe (einmalig: nur `datum`) */ tage: string[] }
  | { ok: false; fehler: Partial<Record<keyof ReservierungEingabe, string>> } {
  const fehler: Partial<Record<keyof ReservierungEingabe, string>> = {};
  if (!raumIds.includes(e.raum_id)) fehler.raum_id = "Bitte einen Raum wählen.";
  if (!gueltigesDatum(e.datum)) fehler.datum = "Bitte ein gültiges Datum wählen.";
  if (e.wiederholung !== "" && !istWiederholung(e.wiederholung)) fehler.wiederholung = "Bitte auswählen.";
  else if (e.wiederholung !== "") {
    if (!gueltigesDatum(e.wiederholen_bis)) fehler.wiederholen_bis = "Bitte den letzten Tag wählen.";
    else if (gueltigesDatum(e.datum) && e.wiederholen_bis < e.datum) fehler.wiederholen_bis = "Darf nicht vor dem ersten Tag liegen.";
    else if (gueltigesDatum(e.datum) && tageZwischen(e.datum, e.wiederholen_bis) > MAX_WIEDERHOLUNG_TAGE)
      fehler.wiederholen_bis = "Höchstens ein Jahr nach dem ersten Tag.";
  }
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
    tage: istWiederholung(e.wiederholung) ? wiederholungsTage(e.datum, e.wiederholung, e.wiederholen_bis) : [e.datum],
  };
}

// --- Wiederkehrende Reservierungen: bewusst nur drei Rhythmen ---

export const WIEDERHOLUNGEN = ["woechentlich", "zweiwoechentlich", "monatlich"] as const;
export type Wiederholung = (typeof WIEDERHOLUNGEN)[number];

const MAX_WIEDERHOLUNG_TAGE = 366;

const istWiederholung = (w: string): w is Wiederholung => (WIEDERHOLUNGEN as readonly string[]).includes(w);

const WOCHENTAG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function utcTag(datum: string): Date {
  const [y, m, d] = datum.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Der wievielte Wochentag im Monat: 1–4, oder -1 für den letzten (ab dem 29.). */
export function wochentagImMonat(datum: string): number {
  const tag = Number(datum.slice(8, 10));
  return tag > 28 ? -1 : Math.ceil(tag / 7);
}

/** n-ter (bzw. bei -1 letzter) Wochentag `wt` im Monat `monat` (0-basiert, darf überlaufen). */
function nterWochentag(jahr: number, monat: number, wt: number, n: number): string {
  if (n === -1) {
    const letzter = new Date(Date.UTC(jahr, monat + 1, 0));
    letzter.setUTCDate(letzter.getUTCDate() - ((letzter.getUTCDay() - wt + 7) % 7));
    return letzter.toISOString().slice(0, 10);
  }
  const erster = new Date(Date.UTC(jahr, monat, 1));
  erster.setUTCDate(1 + ((wt - erster.getUTCDay() + 7) % 7) + (n - 1) * 7);
  return erster.toISOString().slice(0, 10);
}

/** Alle Tage einer Reihe von `datum` bis einschließlich `bis`. */
export function wiederholungsTage(datum: string, art: Wiederholung, bis: string): string[] {
  const tage: string[] = [];
  if (art === "monatlich") {
    const start = utcTag(datum);
    const n = wochentagImMonat(datum);
    for (let i = 0; ; i++) {
      const tag = nterWochentag(start.getUTCFullYear(), start.getUTCMonth() + i, start.getUTCDay(), n);
      if (tag > bis) break;
      tage.push(tag);
    }
    return tage;
  }
  const schritt = art === "woechentlich" ? 7 : 14;
  for (const t = utcTag(datum); t.toISOString().slice(0, 10) <= bis; t.setUTCDate(t.getUTCDate() + schritt)) {
    tage.push(t.toISOString().slice(0, 10));
  }
  return tage;
}

/** Texte für das Auswahlfeld, passend zum gewählten Datum („Jede Woche (dienstags)“). */
export function wiederholungsText(art: Wiederholung, datum: string): string {
  const wt = gueltigesDatum(datum) ? WOCHENTAG[utcTag(datum).getUTCDay()] : null;
  switch (art) {
    case "woechentlich":
      return wt ? `Jede Woche (${wt.toLowerCase()}s)` : "Jede Woche";
    case "zweiwoechentlich":
      return wt ? `Alle 2 Wochen (${wt.toLowerCase()}s)` : "Alle 2 Wochen";
    case "monatlich": {
      if (!wt) return "Jeden Monat (gleicher Wochentag)";
      const n = wochentagImMonat(datum);
      return `Jeden Monat am ${n === -1 ? "letzten" : `${n}.`} ${wt}`;
    }
  }
}

/** Beginn und Ende als Zeitpunkte (wie zeitraumLiteral, aber in JS gerechnet). */
export function zeitraumGrenzen(datum: string, von: string, bis: string): { start: Date; ende: Date } {
  const v = von.slice(0, 5);
  const b = bis.slice(0, 5);
  return { start: berlinZeitpunkt(datum, v), ende: berlinZeitpunkt(b <= v ? folgetag(datum) : datum, b) };
}

export const ueberschneiden = (a: { start: Date; ende: Date }, b: { start: Date; ende: Date }) =>
  a.start < b.ende && b.start < a.ende;

/** Berliner Ortszeit -> Zeitpunkt (Versatz an der Stelle bestimmen, zweimal wegen Zeitumstellung). */
function berlinZeitpunkt(datum: string, zeit: string): Date {
  const [y, m, d] = datum.split("-").map(Number);
  const [h, min] = zeit.split(":").map(Number);
  const ziel = Date.UTC(y, m - 1, d, h, min);
  const versatz = (t: number) => {
    const b = inBerlin(new Date(t));
    const [by, bm, bd] = b.datum.split("-").map(Number);
    const [bh, bmin] = b.zeit.split(":").map(Number);
    return Date.UTC(by, bm - 1, bd, bh, bmin) - t;
  };
  let t = ziel - versatz(ziel);
  t = ziel - versatz(t);
  return new Date(t);
}

// --- Raumsperren (nur Admin): ganze Tage, mit Hinweis ---

export type SperreEingabe = {
  raum_id: string;
  datum: string;
  /** letzter gesperrter Tag; leer = nur `datum` */
  bis_datum: string;
  hinweis: string;
};

export type SperreDaten = {
  raum_id: string;
  zeitraum: string; // tstzrange-Literal
  zweck: string;
};

const MAX_SPERRTAGE = 366;

/** Ganze Tage [datum 00:00, Tag nach bisDatum 00:00) in Berliner Ortszeit. */
export function sperrZeitraumLiteral(datum: string, bisDatum: string): string {
  return `["${datum} 00:00 Europe/Berlin","${folgetag(bisDatum || datum)} 00:00 Europe/Berlin")`;
}

export function sperreAusFormData(formData: FormData): SperreEingabe {
  const wert = (k: string) => String(formData.get(k) ?? "");
  return { raum_id: wert("raum_id"), datum: wert("datum"), bis_datum: wert("bis_datum"), hinweis: wert("hinweis") };
}

export function pruefeSperre(
  e: SperreEingabe,
  raumIds: string[],
): { ok: true; daten: SperreDaten } | { ok: false; fehler: Partial<Record<keyof SperreEingabe, string>> } {
  const fehler: Partial<Record<keyof SperreEingabe, string>> = {};
  if (!raumIds.includes(e.raum_id)) fehler.raum_id = "Bitte einen Raum wählen.";
  if (!gueltigesDatum(e.datum)) fehler.datum = "Bitte ein gültiges Datum wählen.";
  if (e.bis_datum !== "") {
    if (!gueltigesDatum(e.bis_datum)) fehler.bis_datum = "Bitte ein gültiges Datum wählen.";
    else if (gueltigesDatum(e.datum) && e.bis_datum < e.datum) fehler.bis_datum = "Darf nicht vor dem ersten Tag liegen.";
    else if (gueltigesDatum(e.datum) && tageZwischen(e.datum, e.bis_datum) >= MAX_SPERRTAGE)
      fehler.bis_datum = "Höchstens ein Jahr am Stück.";
  }
  const hinweis = e.hinweis.trim();
  if (hinweis === "") fehler.hinweis = "Bitte einen Hinweis angeben, z. B. „Renovierung“.";
  else if (hinweis.length > 120) fehler.hinweis = "Höchstens 120 Zeichen.";
  if (Object.keys(fehler).length) return { ok: false, fehler };

  return {
    ok: true,
    daten: { raum_id: e.raum_id, zeitraum: sperrZeitraumLiteral(e.datum, e.bis_datum), zweck: hinweis },
  };
}

function tageZwischen(von: string, bis: string): number {
  const t = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(bis) - t(von)) / 86_400_000);
}

/** Gesperrte Tage (erster und letzter, inklusive) aus einem Sperr-Zeitraum. */
export function sperrTage(z: { start: Date; ende: Date }): { von: string; bis: string } {
  const von = inBerlin(z.start).datum;
  // Ende ist exklusiv (00:00 des Folgetags) – eine Minute davor liegt im letzten Tag.
  const bis = inBerlin(new Date(z.ende.getTime() - 60_000)).datum;
  return { von, bis: bis < von ? von : bis };
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
