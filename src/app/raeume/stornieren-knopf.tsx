"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reservierungLoeschen } from "@/app/raeume/actions";
import { TrashIcon } from "@/components/icons";

function Bestaetigen() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-control bg-[#B3261E] px-3 text-sm font-semibold text-white hover:bg-[#8C1D17]">
      {pending ? "Wird storniert …" : "Ja, stornieren"}
    </button>
  );
}

/** Eimer-Symbol in der Wochenansicht; Rückfrage direkt im Eintrag (kein Browser-Dialog). */
export function StornierenKnopf({
  id,
  beschreibung,
  raum,
  woche,
  className,
}: {
  id: string;
  beschreibung: string;
  raum: string;
  woche: string;
  className: string;
}) {
  const [frage, setFrage] = useState(false);
  if (!frage) {
    return (
      <button type="button" onClick={() => setFrage(true)} aria-label={`Reservierung ${beschreibung} stornieren`} className={className}>
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
        Wirklich stornieren?
      </span>
      <Bestaetigen />
      <button type="button" autoFocus onClick={() => setFrage(false)} className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-3 text-sm font-semibold text-ink">
        Abbrechen
      </button>
    </form>
  );
}
