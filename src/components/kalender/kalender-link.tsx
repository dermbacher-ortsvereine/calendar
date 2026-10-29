"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

/**
 * Ändert den Kalenderzustand nur im Browser: neue URL per History-API, ohne Serveranfrage.
 * Next.js gleicht useSearchParams() und Zurück-/Vor-Taste damit ab.
 */
export function kalenderNavigieren(href: string) {
  window.history.pushState(null, "", href);
}

/** Echter Link (teilbar, neuer Tab per Mittelklick), der beim normalen Klick sofort umschaltet. */
export function KalenderLink({
  href,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function klick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    kalenderNavigieren(href);
  }
  // data-sofort: der Ladebalken ignoriert diese Klicks
  return <a {...rest} href={href} onClick={klick} data-sofort="" />;
}
