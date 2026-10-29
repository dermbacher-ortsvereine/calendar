"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Interner Link, bei dem Next.js eine neue Seite vom Server holt? */
function startetNavigation(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return false;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-sofort")) return false;
  const ziel = new URL(a.href, location.href);
  if (ziel.origin !== location.origin || ziel.pathname.startsWith("/api/")) return false;
  return ziel.pathname + ziel.search !== location.pathname + location.search;
}

/** Schmaler Balken am oberen Rand, solange nach einem Linkklick die nächste Seite lädt. */
export function Ladebalken() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Neue URL = Navigation fertig: der Schlüssel setzt den Balken zurück.
  return <Balken key={`${pathname}?${searchParams}`} />;
}

function Balken() {
  const [aktiv, setAktiv] = useState(false);

  useEffect(() => {
    const klick = (e: MouseEvent) => {
      if (startetNavigation(e)) setAktiv(true);
    };
    document.addEventListener("click", klick);
    return () => document.removeEventListener("click", klick);
  }, []);

  useEffect(() => {
    if (!aktiv) return;
    // Sicherheitsnetz, falls die Navigation abbricht
    const t = setTimeout(() => setAktiv(false), 15_000);
    return () => clearTimeout(t);
  }, [aktiv]);

  if (!aktiv) return null;
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden">
      <div className="ladebalken h-full bg-accent" />
    </div>
  );
}
