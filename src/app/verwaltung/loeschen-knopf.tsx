"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { terminLoeschen } from "@/app/verwaltung/actions";
import { TrashIcon } from "@/components/icons";

const iconKnopf =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-surface hover:bg-accent-hover";

function Bestaetigen() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 cursor-pointer rounded-control bg-[#B3261E] px-4 text-[15px] font-semibold text-white hover:bg-[#8C1D17]"
    >
      {pending ? "Wird gelöscht …" : "Ja, löschen"}
    </button>
  );
}

/** Löschen mit Rückfrage direkt in der Zeile (kein Browser-Dialog). `zurueck`: Seite nach dem Löschen. */
export function LoeschenKnopf({ id, titel, zurueck }: { id: string; titel: string; zurueck?: string }) {
  const [frage, setFrage] = useState(false);

  if (!frage) {
    return (
      <button
        type="button"
        onClick={() => setFrage(true)}
        aria-label={`„${titel}“ löschen`}
        className={`${iconKnopf} text-[#B3261E]`}
      >
        <TrashIcon className="size-[18px]" />
      </button>
    );
  }

  return (
    <form action={terminLoeschen} className="flex w-full flex-wrap items-center gap-2 rounded-control bg-[#FAE6E4] p-2.5">
      <input type="hidden" name="id" value={id} />
      {zurueck && <input type="hidden" name="zurueck" value={zurueck} />}
      <span role="alert" className="mr-auto text-sm font-semibold text-[#8C1D17]">
        „{titel}“ wirklich löschen?
      </span>
      <Bestaetigen />
      <button
        type="button"
        autoFocus
        onClick={() => setFrage(false)}
        className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-4 text-[15px] font-semibold text-ink"
      >
        Abbrechen
      </button>
    </form>
  );
}
