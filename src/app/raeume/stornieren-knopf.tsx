"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reservierungLoeschen } from "@/app/raeume/actions";
import { BestaetigungDialog, rotKnopf } from "@/components/bestaetigung-dialog";
import { TrashIcon } from "@/components/icons";

function Bestaetigen({ sperre, serie }: { sperre: boolean; serie: boolean }) {
  const { pending } = useFormStatus();
  if (serie) {
    // Wiederkehrende Reservierung: nur diesen Tag oder auch alle folgenden der Reihe
    return (
      <>
        <button type="submit" name="umfang" value="einzeln" disabled={pending} className={rotKnopf}>
          {pending ? "Wird storniert …" : "Nur diesen Termin"}
        </button>
        <button type="submit" name="umfang" value="folgende" disabled={pending} className={rotKnopf}>
          Diesen und alle folgenden
        </button>
      </>
    );
  }
  return (
    <button type="submit" disabled={pending} className={rotKnopf}>
      {pending ? (sperre ? "Wird aufgehoben …" : "Wird storniert …") : sperre ? "Ja, aufheben" : "Ja, stornieren"}
    </button>
  );
}

/** Eimer-Symbol in der Wochenansicht; Rückfrage im Modal (kein Browser-Dialog). */
export function StornierenKnopf({
  id,
  beschreibung,
  sperre = false,
  serie = false,
  raum,
  woche,
  className,
}: {
  id: string;
  beschreibung: string;
  /** Sperre statt Reservierung: „aufheben“ statt „stornieren“ */
  sperre?: boolean;
  /** Teil einer Reihe: Rückfrage „Nur diesen Termin“ / „Diesen und alle folgenden“ */
  serie?: boolean;
  raum: string;
  woche: string;
  className: string;
}) {
  const [frage, setFrage] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setFrage(true)} aria-label={`${beschreibung} ${sperre ? "aufheben" : "stornieren"}`} className={className}>
        <TrashIcon className="size-4" />
      </button>
      <BestaetigungDialog
        offen={frage}
        onSchliessen={() => setFrage(false)}
        titel={sperre ? "Sperre wirklich aufheben?" : serie ? "Welche Termine stornieren?" : "Reservierung wirklich stornieren?"}
        text={
          serie
            ? `${beschreibung} gehört zu einer wiederkehrenden Reservierung.`
            : sperre
              ? `${beschreibung} – danach kann der Raum wieder reserviert werden.`
              : beschreibung.replace(/^Reservierung /, "")
        }
        action={reservierungLoeschen}
        felder={{ id, raum, woche }}
      >
        <Bestaetigen sperre={sperre} serie={serie} />
      </BestaetigungDialog>
    </>
  );
}
