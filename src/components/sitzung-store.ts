"use client";

import { useSyncExternalStore } from "react";
import { ANMELDE_MARKER } from "@/lib/anmelde-marker";
import type { SitzungsInfo } from "@/lib/sitzung";

// Login-Status im Browser: einmal vom Server geholt (Anmeldestatus im Header), überall lesbar.
let aktuell: SitzungsInfo | null = null;
const hoerer = new Set<() => void>();

export function setzeSitzung(info: SitzungsInfo | null) {
  aktuell = info;
  for (const h of hoerer) h();
}

function abonnieren(h: () => void) {
  hoerer.add(h);
  return () => hoerer.delete(h);
}

/** Angemeldeter Veranstalter bzw. Admin; null für anonyme Besucher und beim Server-Rendern. */
export function useSitzungsInfo(): SitzungsInfo | null {
  return useSyncExternalStore(
    abonnieren,
    () => aktuell,
    () => null,
  );
}

export function hatAnmeldeMarker(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${ANMELDE_MARKER}=`));
}
