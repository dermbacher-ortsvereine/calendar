import { io } from "next/cache";
import { getTermin, getTermineZwischen, getVeranstalter } from "@/lib/daten";
import { heute as heuteBerlin } from "@/lib/datum";
import { ladeFenster } from "@/lib/kalender-fenster";
import { leseZustand } from "@/lib/kalender-url";
import { getSitzung } from "@/lib/sitzung";
import { KalenderAnsicht } from "@/components/kalender/kalender-ansicht";

/** Lädt die Termine eines großen Zeitraums; Bedienen läuft danach im Browser (KalenderAnsicht). */
export async function Kalender({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  const veranstalterListe = await getVeranstalter();
  const zustand = leseZustand(params, veranstalterListe.map((v) => v.id));

  await io(); // "heute" erst zur Anfragezeit bestimmen, nicht beim Prerendern
  const heute = heuteBerlin();
  const fenster = ladeFenster(heute, zustand.monat);
  const [termine, sitzung] = await Promise.all([getTermineZwischen(fenster.von, fenster.bis), getSitzung()]);
  const einzelTermin =
    zustand.termin && !termine.some((t) => t.id === zustand.termin) ? await getTermin(zustand.termin) : null;

  return (
    <KalenderAnsicht
      veranstalterListe={veranstalterListe}
      termine={termine}
      fenster={fenster}
      heute={heute}
      einzelTermin={einzelTermin}
      bearbeiter={sitzung && { istAdmin: sitzung.istAdmin, veranstalterId: sitzung.veranstalter?.id ?? null }}
    />
  );
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
