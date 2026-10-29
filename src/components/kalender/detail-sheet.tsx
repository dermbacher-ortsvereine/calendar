"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { KalenderLink, kalenderNavigieren } from "@/components/kalender/kalender-link";

/**
 * Hülle der Detailansicht: am Desktop eine Karte in der rechten Spalte,
 * am Handy (< lg) ein Bottom-Sheet mit abgedunkeltem Hintergrund.
 * Schließen per Link, Escape oder Tipp auf den Hintergrund.
 */
export function DetailSheet({
  schliessenHref,
  titelId,
  children,
}: {
  schliessenHref: string;
  titelId: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: window.matchMedia("(min-width: 1024px)").matches });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") kalenderNavigieren(schliessenHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [schliessenHref]);

  return (
    <>
      <KalenderLink
        href={schliessenHref}
        tabIndex={-1}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-[#17201B]/40 lg:hidden"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="region"
        aria-labelledby={titelId}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-line bg-surface p-[22px] pb-8 shadow-[0_-8px_30px_rgba(23,32,27,0.18)] outline-none lg:static lg:z-auto lg:max-h-none lg:rounded-card lg:pb-[22px] lg:shadow-none"
      >
        <div aria-hidden="true" className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-line lg:hidden" />
        {children}
      </div>
    </>
  );
}
