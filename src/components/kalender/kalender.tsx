import { cacheLife, cacheTag } from "next/cache";
import { getTermineZwischen, getVeranstalter, TAG_TERMINE, TAG_VERANSTALTER } from "@/lib/daten";
import { heute as heuteBerlin } from "@/lib/datum";
import { ladeFenster } from "@/lib/kalender-fenster";
import { KalenderMitUrl } from "@/components/kalender/kalender-ansicht";

/**
 * Für alle Besucher gleich: ohne URL-Parameter und ohne Login, damit die Seite statisch
 * aus dem CDN kommt (neu erzeugt höchstens stündlich bzw. sofort nach Änderungen per Cache-Tag).
 * Das explizite cacheLife gilt auch gegenüber den kürzeren Lebensdauern der Datenfunktionen.
 */
async function kalenderDaten() {
  "use cache";
  cacheLife("startseite");
  cacheTag(TAG_TERMINE, TAG_VERANSTALTER);
  const heute = heuteBerlin();
  const fenster = ladeFenster(heute, null);
  const [veranstalterListe, termine] = await Promise.all([
    getVeranstalter(),
    getTermineZwischen(fenster.von, fenster.bis),
  ]);
  return { veranstalterListe, termine, fenster, heute };
}

/** Lädt die Termine eines großen Zeitraums; Bedienen läuft danach im Browser (KalenderAnsicht). */
export async function Kalender() {
  return <KalenderMitUrl {...await kalenderDaten()} />;
}

export function KalenderPlatzhalter() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-[18px] px-4 py-6 sm:px-6" aria-busy="true">
      <div className="h-11 w-72 animate-pulse rounded-control bg-line" />
      <div className="h-10 w-full max-w-3xl animate-pulse rounded-full bg-line" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[560px] animate-pulse rounded-card bg-surface" />
        <div className="h-72 animate-pulse rounded-card bg-surface" />
      </div>
      <span className="sr-only">Kalender wird geladen …</span>
    </main>
  );
}
