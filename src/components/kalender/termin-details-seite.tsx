"use client";

import type { Termin, Veranstalter } from "@/lib/daten";
import { darfSchreiben } from "@/lib/rechte";
import { useSitzungsInfo } from "@/components/sitzung-store";
import { TerminDetails } from "@/components/kalender/termin-details";

/** Detailseite /termin/[id]: Inhalt statisch, Bearbeiten-Knöpfe erst im Browser für Berechtigte. */
export function TerminDetailsSeite({ termin, veranstalter }: { termin: Termin; veranstalter: Veranstalter }) {
  const sitzung = useSitzungsInfo();
  return (
    <TerminDetails
      termin={termin}
      veranstalter={veranstalter}
      ueberschrift="h1"
      bearbeiten={darfSchreiben(sitzung, termin.veranstalter_id) ? { zurueck: "/" } : undefined}
    />
  );
}
