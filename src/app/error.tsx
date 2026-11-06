"use client";

import { useEffect } from "react";

/** Fehlerseite, z. B. wenn die Datenbank gerade nicht erreichbar ist. */
export default function Fehler({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-[760px] px-4 py-7 sm:px-6">
      <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 text-[15px] leading-relaxed sm:p-8">
        <h1 className="font-display text-[28px] font-bold">Gerade nicht erreichbar</h1>
        <p>
          Der Kalender kann im Moment nicht geladen werden. Bitte versuch es in ein paar Minuten noch
          einmal.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 cursor-pointer rounded-control bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-dark"
        >
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
