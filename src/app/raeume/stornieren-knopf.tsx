"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reservierungLoeschen } from "@/app/raeume/actions";

function Bestaetigen() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-control bg-[#B3261E] px-4 text-[15px] font-semibold text-white hover:bg-[#8C1D17]">
      {pending ? "Wird storniert …" : "Ja, stornieren"}
    </button>
  );
}

export function StornierenKnopf({ id, beschreibung, raum, woche }: { id: string; beschreibung: string; raum: string; woche: string }) {
  const [frage, setFrage] = useState(false);
  if (!frage) {
    return (
      <button
        type="button"
        onClick={() => setFrage(true)}
        aria-label={`Reservierung ${beschreibung} stornieren`}
        className="min-h-11 shrink-0 cursor-pointer rounded-control border border-line px-3 text-sm font-semibold text-[#B3261E] hover:bg-accent-hover"
      >
        Stornieren
      </button>
    );
  }
  return (
    <form action={reservierungLoeschen} className="flex w-full flex-wrap items-center gap-2 rounded-control bg-[#FAE6E4] p-2.5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="raum" value={raum} />
      <input type="hidden" name="woche" value={woche} />
      <span role="alert" className="mr-auto text-sm font-semibold text-[#8C1D17]">
        Reservierung wirklich stornieren?
      </span>
      <Bestaetigen />
      <button type="button" autoFocus onClick={() => setFrage(false)} className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-4 text-[15px] font-semibold text-ink">
        Abbrechen
      </button>
    </form>
  );
}
