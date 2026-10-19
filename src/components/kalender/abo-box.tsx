"use client";

import { useState } from "react";

/** Kasten "Kalender abonnieren": kopiert den iCal-Link (mit aktuellem Filter). */
export function AboBox({ filter }: { filter: string[] }) {
  const [status, setStatus] = useState<"idle" | "kopiert" | "fehler">("idle");
  const [url, setUrl] = useState("");

  async function kopieren() {
    const link = `${window.location.origin}/api/ical${filter.length ? `?v=${filter.join(",")}` : ""}`;
    setUrl(link);
    try {
      await navigator.clipboard.writeText(link);
      setStatus("kopiert");
    } catch {
      setStatus("fehler");
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-card bg-accent-soft px-5 py-[18px]">
      <h2 className="text-[15px] font-bold text-accent-dark">Kalender abonnieren</h2>
      <p className="text-sm leading-[1.45] text-[#2C4A38]">
        Alle Termine automatisch im Handy- oder Outlook-Kalender – auch nur für einzelne
        Veranstalter.
        {filter.length > 0 && " Der Link enthält die aktuelle Auswahl."}
      </p>
      <button
        type="button"
        onClick={kopieren}
        className="min-h-11 cursor-pointer rounded-control bg-accent text-[15px] font-semibold text-white hover:bg-accent-dark"
      >
        iCal-Link kopieren
      </button>
      <p role="status" className="text-sm text-accent-dark empty:hidden">
        {status === "kopiert" && "Link kopiert – in der Kalender-App als Abo (per URL) hinzufügen."}
      </p>
      {status === "fehler" && (
        <label className="flex flex-col gap-1 text-sm text-accent-dark">
          Kopieren hat nicht geklappt – bitte den Link markieren und kopieren:
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-11 rounded-control border border-line-input bg-surface px-3 text-sm text-ink"
          />
        </label>
      )}
    </div>
  );
}
