// Datums-Helfer. Kalendertage werden als "YYYY-MM-DD" behandelt und in UTC gerechnet,
// damit Sommer-/Winterzeit keine Tage verschiebt. "Heute" bestimmt sich nach Europe/Berlin.

export const ZEITZONE = "Europe/Berlin";

export const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const MONATE_KURZ = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const WOCHENTAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const WOCHENTAGE_KOPF = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const pad = (n: number) => String(n).padStart(2, "0");

function parse(tag: string): Date {
  const [y, m, d] = tag.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function key(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Heutiges Datum in Berlin als "YYYY-MM-DD". Nur zur Laufzeit aufrufen (nicht beim Prerendern). */
export function heute(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZEITZONE }).format(new Date());
}

export function plusTage(tag: string, n: number): string {
  const d = parse(tag);
  d.setUTCDate(d.getUTCDate() + n);
  return key(d);
}

/** Monat als "YYYY-MM". */
export type Monat = string;

export function monatVon(tag: string): Monat {
  return tag.slice(0, 7);
}

export function istMonat(wert: string | undefined): wert is Monat {
  if (!wert || !/^\d{4}-(0[1-9]|1[0-2])$/.test(wert)) return false;
  const jahr = Number(wert.slice(0, 4));
  return jahr >= 2000 && jahr <= 2100;
}

export function plusMonate(monat: Monat, n: number): Monat {
  const [y, m] = monat.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monatsName(monat: Monat): string {
  const [y, m] = monat.split("-").map(Number);
  return `${MONATE[m - 1]} ${y}`;
}

/** Alle Tage des Monatsrasters (Wochen Mo–So, inkl. Tage aus Vor-/Folgemonat). */
export function monatsRaster(monat: Monat): { tag: string; imMonat: boolean }[] {
  const [y, m] = monat.split("-").map(Number);
  const erster = new Date(Date.UTC(y, m - 1, 1));
  const versatz = (erster.getUTCDay() + 6) % 7;
  const tageImMonat = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const gesamt = Math.ceil((versatz + tageImMonat) / 7) * 7;
  return Array.from({ length: gesamt }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1, 1 - versatz + i));
    return { tag: key(d), imMonat: d.getUTCMonth() === m - 1 };
  });
}

export function tagesNummer(tag: string): number {
  return parse(tag).getUTCDate();
}

/** "Sa" */
export function wochentagKurz(tag: string): string {
  return WOCHENTAGE_KURZ[parse(tag).getUTCDay()];
}

/** "Sa, 24. Okt." */
export function datumKurz(tag: string): string {
  const d = parse(tag);
  return `${WOCHENTAGE_KURZ[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE_KURZ[d.getUTCMonth()]}`;
}

/** "Samstag, 24. Oktober 2026" */
export function datumLang(tag: string): string {
  const d = parse(tag);
  return `${WOCHENTAGE[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "19:00:00" -> "19:00" */
export function uhrzeit(zeit: string): string {
  return zeit.slice(0, 5);
}

/** "14:00–17:30 Uhr" bzw. "ab 19:00 Uhr" */
export function zeitraumText(beginn: string, ende: string | null): string {
  return ende ? `${uhrzeit(beginn)}–${uhrzeit(ende)} Uhr` : `ab ${uhrzeit(beginn)} Uhr`;
}

/** "19. Okt." */
export function tagMonat(tag: string): string {
  const d = parse(tag);
  return `${d.getUTCDate()}. ${MONATE_KURZ[d.getUTCMonth()]}`;
}

/** "Montag" */
export function wochentagLang(tag: string): string {
  return WOCHENTAGE[parse(tag).getUTCDay()];
}
