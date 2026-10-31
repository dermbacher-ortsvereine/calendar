"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reservierungLoeschen } from "@/app/raeume/actions";
import { TrashIcon } from "@/components/icons";

const rotKnopf = "min-h-11 cursor-pointer rounded-control bg-[#B3261E] px-3 text-sm font-semibold text-white hover:bg-[#8C1D17]";

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

/** Eimer-Symbol in der Wochenansicht; Rückfrage direkt im Eintrag (kein Browser-Dialog). */
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
  if (!frage) {
    return (
      <button type="button" onClick={() => setFrage(true)} aria-label={`${beschreibung} ${sperre ? "aufheben" : "stornieren"}`} className={className}>
        <TrashIcon className="size-4" />
      </button>
    );
  }
  return (
    <form action={reservierungLoeschen} className="flex w-full flex-wrap items-center gap-1.5 rounded-md bg-surface p-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="raum" value={raum} />
      <input type="hidden" name="woche" value={woche} />
      <span role="alert" className="w-full text-[13px] font-semibold text-[#8C1D17]">
        {sperre ? "Sperre wirklich aufheben?" : serie ? "Welche Termine stornieren?" : "Wirklich stornieren?"}
      </span>
      <Bestaetigen sperre={sperre} serie={serie} />
      <button type="button" autoFocus onClick={() => setFrage(false)} className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-3 text-sm font-semibold text-ink">
        Abbrechen
      </button>
    </form>
  );
}
