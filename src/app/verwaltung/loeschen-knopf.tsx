"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { terminLoeschen } from "@/app/verwaltung/actions";
import { BestaetigungDialog, rotKnopf } from "@/components/bestaetigung-dialog";
import { TrashIcon } from "@/components/icons";

const iconKnopf =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-surface hover:bg-accent-hover";

function Bestaetigen() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={rotKnopf}>
      {pending ? "Wird gelöscht …" : "Ja, löschen"}
    </button>
  );
}

/** Löschen mit Rückfrage im Modal (kein Browser-Dialog). `zurueck`: Seite nach dem Löschen. */
export function LoeschenKnopf({ id, titel, zurueck }: { id: string; titel: string; zurueck?: string }) {
  const [frage, setFrage] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setFrage(true)}
        aria-label={`„${titel}“ löschen`}
        className={`${iconKnopf} text-[#B3261E]`}
      >
        <TrashIcon className="size-[18px]" />
      </button>
      <BestaetigungDialog
        offen={frage}
        onSchliessen={() => setFrage(false)}
        titel="Termin wirklich löschen?"
        text={`„${titel}“ wird aus dem öffentlichen Kalender entfernt.`}
        action={terminLoeschen}
        felder={{ id, zurueck }}
      >
        <Bestaetigen />
      </BestaetigungDialog>
    </>
  );
}
