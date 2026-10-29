// Verteilt Termine einer Kalenderwoche auf Spuren, damit mehrtägige Termine als
// durchgehender Balken über ihre Tage laufen (wie in gängigen Kalender-Apps).

export type BalkenTermin = { id: string; datum: string; bis_datum: string | null };

export type Balken<T> = {
  termin: T;
  /** Spalte des ersten sichtbaren Tages (0 = Montag) */
  start: number;
  /** Anzahl Tage in dieser Woche */
  spanne: number;
  spur: number;
  /** Termin beginnt vor dieser Woche bzw. läuft über sie hinaus */
  weiterVorher: boolean;
  weiterNachher: boolean;
};

/**
 * @param woche die sieben Tage der Woche ("YYYY-MM-DD", Mo–So)
 * @param termine sortiert (Datum, Beginn, Titel); die Reihenfolge entscheidet bei Gleichstand
 * @param maxSpuren sichtbare Spuren; was darüber liegt, zählt pro Tag in `weitere`
 */
export function wochenBalken<T extends BalkenTermin>(
  woche: string[],
  termine: T[],
  maxSpuren: number,
): { balken: Balken<T>[]; weitere: number[] } {
  const erster = woche[0];
  const letzter = woche[6];
  const abschnitte = termine
    .map((termin, reihenfolge) => {
      const bis = termin.bis_datum ?? termin.datum;
      if (bis < erster || termin.datum > letzter) return null;
      const start = termin.datum < erster ? 0 : woche.indexOf(termin.datum);
      const ende = bis > letzter ? 6 : woche.indexOf(bis);
      return { termin, reihenfolge, start, spanne: ende - start + 1, weiterVorher: termin.datum < erster, weiterNachher: bis > letzter };
    })
    .filter((a) => a !== null)
    // Früher beginnende und längere Balken nach oben, sonst Eingabereihenfolge
    .sort((a, b) => a.start - b.start || b.spanne - a.spanne || a.reihenfolge - b.reihenfolge);

  const belegt: boolean[][] = [];
  const balken: Balken<T>[] = [];
  const weitere = Array<number>(7).fill(0);
  for (const { termin, start, spanne, weiterVorher, weiterNachher } of abschnitte) {
    const tage = Array.from({ length: spanne }, (_, i) => start + i);
    let spur = 0;
    while (tage.some((tag) => belegt[spur]?.[tag])) spur++;
    belegt[spur] ??= [];
    for (const tag of tage) belegt[spur][tag] = true;
    if (spur < maxSpuren) balken.push({ termin, start, spanne, spur, weiterVorher, weiterNachher });
    else for (const tag of tage) weitere[tag]++;
  }
  return { balken, weitere };
}
