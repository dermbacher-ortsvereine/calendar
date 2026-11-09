"use server";

import { getTermin, getTermineZwischen, type Termin } from "@/lib/daten";
import { heute, istMonat, monatsRaster } from "@/lib/datum";
import { imBlaetterBereich } from "@/lib/kalender-url";

// Nachladen für den öffentlichen Kalender, wenn ein Monat oder Termin außerhalb des
// vorgeladenen Zeitraums aufgerufen wird (selten: weit zurück/voraus geblättert, alter Termin-Link).

export async function ladeMonat(monat: unknown): Promise<Termin[]> {
  if (typeof monat !== "string" || !istMonat(monat) || !imBlaetterBereich(monat, heute())) return [];
  const raster = monatsRaster(monat);
  return getTermineZwischen(raster[0].tag, raster.at(-1)!.tag);
}

export async function ladeTermin(id: unknown): Promise<Termin | null> {
  return typeof id === "string" ? getTermin(id) : null;
}
