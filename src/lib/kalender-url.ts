// Zustand des öffentlichen Kalenders steckt komplett in der URL, damit Links teilbar sind:
//   ?v=mv,ff        Filter (leer = alle)
//   ?ansicht=liste  "monat" | "liste" (leer = Monat am Desktop, Liste am Handy)
//   ?m=2026-11      angezeigter Monat (leer = aktueller Monat)
//   ?termin=<uuid>  geöffnete Detailansicht

import { istMonat, type Monat } from "@/lib/datum";

export type Ansicht = "monat" | "liste";

export type KalenderZustand = {
  filter: string[];
  ansicht: Ansicht | null;
  monat: Monat | null;
  termin: string | null;
};

type Roh = Record<string, string | string[] | undefined>;

const erster = (wert: string | string[] | undefined) => (Array.isArray(wert) ? wert[0] : wert);

export function leseZustand(params: Roh, gueltigeIds: string[]): KalenderZustand {
  const v = erster(params.v);
  const filter = v ? [...new Set(v.split(",").filter((id) => gueltigeIds.includes(id)))] : [];
  const ansicht = erster(params.ansicht);
  const monat = erster(params.m);
  const termin = erster(params.termin);
  return {
    filter: filter.length === gueltigeIds.length ? [] : filter,
    ansicht: ansicht === "monat" || ansicht === "liste" ? ansicht : null,
    monat: istMonat(monat) ? monat : null,
    termin: termin && /^[0-9a-f-]{36}$/i.test(termin) ? termin : null,
  };
}

export function kalenderHref(zustand: KalenderZustand, aenderung: Partial<KalenderZustand> = {}): string {
  const z = { ...zustand, ...aenderung };
  const q = new URLSearchParams();
  if (z.filter.length) q.set("v", z.filter.join(","));
  if (z.ansicht) q.set("ansicht", z.ansicht);
  if (z.monat) q.set("m", z.monat);
  if (z.termin) q.set("termin", z.termin);
  const s = q.toString().replaceAll("%2C", ",");
  return s ? `/?${s}` : "/";
}

/** Verhalten wie im Design: erster Klick zeigt nur diesen, weitere fügen hinzu/entfernen. */
export function filterUmschalten(filter: string[], id: string, alleIds: string[]): string[] {
  let neu: string[];
  if (filter.length === 0) neu = [id];
  else if (filter.includes(id)) neu = filter.filter((x) => x !== id);
  else neu = alleIds.filter((x) => filter.includes(x) || x === id);
  return neu.length === alleIds.length ? [] : neu;
}

export function istAktiv(filter: string[], id: string): boolean {
  return filter.length === 0 || filter.includes(id);
}
