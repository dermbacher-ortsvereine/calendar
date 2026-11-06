"use client";

import "./globals.css";

/** Letzte Rückfallebene, falls schon das Layout (z. B. der Header) nicht gerendert werden kann. */
export default function GlobalerFehler({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="de">
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <main className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 text-[15px] leading-relaxed sm:p-8">
            <h1 className="text-[28px] font-bold">Dermbacher Ortsvereine</h1>
            <p>
              Der Kalender ist gerade nicht erreichbar. Bitte versuch es in ein paar Minuten noch
              einmal.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="min-h-11 cursor-pointer rounded-control bg-accent px-5 text-[15px] font-semibold text-white"
            >
              Erneut versuchen
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
