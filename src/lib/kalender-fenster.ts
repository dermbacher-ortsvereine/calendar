// Der öffentliche Kalender lädt die Termine eines größeren Zeitraums auf einmal, damit
// Blättern, Filtern, Ansicht wechseln und Details öffnen ohne Serveranfrage auskommen.

import { monatsRaster, monatVon, plusMonate, plusTage, type Monat } from "./datum.ts";

/** So weit reicht die Liste „Nächste Termine“ (und „Demnächst“) ab heute. */
export const VORSCHAU_TAGE = 400;

export type Fenster = { von: string; bis: string };

const rasterVon = (monat: Monat) => monatsRaster(monat)[0].tag;
const rasterBis = (monat: Monat) => monatsRaster(monat).at(-1)!.tag;

/** 3 Monate zurück bis gut ein Jahr voraus; ein Monat aus der URL wird mit abgedeckt. */
export function ladeFenster(heute: string, monat: Monat | null): Fenster {
  const aktuell = monatVon(heute);
  let von = rasterVon(plusMonate(aktuell, -3));
  let bis = rasterBis(plusMonate(aktuell, 12));
  const vorschau = plusTage(heute, VORSCHAU_TAGE);
  if (vorschau > bis) bis = vorschau;
  if (monat) {
    if (rasterVon(monat) < von) von = rasterVon(monat);
    if (rasterBis(monat) > bis) bis = rasterBis(monat);
  }
  return { von, bis };
}

/** Liegen alle Tage der Monatsansicht (inkl. angrenzender Wochen) im geladenen Fenster? */
export function monatImFenster(monat: Monat, fenster: Fenster): boolean {
  return rasterVon(monat) >= fenster.von && rasterBis(monat) <= fenster.bis;
}
