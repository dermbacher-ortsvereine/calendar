import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";

export type Veranstalter = Pick<
  Tables<"veranstalter">,
  "id" | "name" | "kuerzel" | "farbe" | "farbe_hg" | "logo_url" | "sortierung" | "gemeinsam"
>;
export type Termin = Omit<Tables<"termine">, "erstellt_am">;

const TERMIN_SPALTEN =
  "id, veranstalter_id, titel, datum, bis_datum, beginn, ende, ort, beschreibung, ansprechpartner, geaendert_am, eingetragen_von";

// Cache-Tags: nach Änderungen per updateTag()/revalidateTag() neu laden.
export const TAG_TERMINE = "termine";
export const TAG_VERANSTALTER = "veranstalter";

export async function getVeranstalter(): Promise<Veranstalter[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_VERANSTALTER);
  const { data, error } = await createPublicClient()
    .from("veranstalter")
    .select("id, name, kuerzel, farbe, farbe_hg, logo_url, sortierung, gemeinsam")
    .eq("aktiv", true)
    .order("sortierung")
    .order("name");
  if (error) throw error;
  return data;
}

/** PostgREST-Filter: Termin endet am Tag `von` oder später (auch mehrtägige, die vorher begonnen haben). */
const endetAbFilter = (von: string) => `datum.gte.${von},bis_datum.gte.${von}`;

/** Termine, die [von, bis] (inklusive) berühren, sortiert; ganztägige zuerst. */
export async function getTermineZwischen(von: string, bis: string): Promise<Termin[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_TERMINE);
  const { data, error } = await createPublicClient()
    .from("termine")
    .select(TERMIN_SPALTEN)
    .or(endetAbFilter(von))
    .lte("datum", bis)
    .order("datum")
    .order("beginn", { nullsFirst: true })
    .order("titel");
  if (error) throw error;
  return data;
}

/** Alle Termine, die an einem Datum oder später stattfinden (für den iCal-Feed). */
export async function getTermineAb(von: string): Promise<Termin[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_TERMINE);
  const { data, error } = await createPublicClient()
    .from("termine")
    .select(TERMIN_SPALTEN)
    .or(endetAbFilter(von))
    .order("datum")
    .order("beginn", { nullsFirst: true })
    .limit(2000);
  if (error) throw error;
  return data;
}

export async function getTermin(id: string): Promise<Termin | null> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_TERMINE);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await createPublicClient()
    .from("termine")
    .select(TERMIN_SPALTEN)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const TAG_RESERVIERUNGEN = "reservierungen";
export const TAG_RAEUME = "raeume";

export type Raum = Tables<"raeume">;

export type Belegung = {
  id: string;
  raum_id: string;
  /** null bei Sperren */
  veranstalter_id: string | null;
  /** Sperre durch den Admin; `zweck` ist dann der Hinweis */
  gesperrt: boolean;
  zweck: string | null;
  /** Veranstalter, der eingetragen hat (bei gemeinsamen Veranstaltern interessant); null beim Admin */
  eingetragen_von: string | null;
  /** tstzrange als Text, siehe parseZeitraum() */
  zeitraum: string;
  /** gemeinsame ID wiederkehrender Reservierungen */
  serie_id: string | null;
};

export async function getRaeume(): Promise<Raum[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_RAEUME);
  const { data, error } = await createPublicClient().from("raeume").select("*").order("sortierung");
  if (error) throw error;
  return data;
}

/** Öffentliche Belegung (ohne Kontaktdaten) aller Räume, die [von, bis) in Berliner Zeit berührt. */
export async function getBelegung(von: string, bis: string): Promise<Belegung[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_RESERVIERUNGEN);
  const { data, error } = await createPublicClient()
    .from("reservierungen_oeffentlich")
    .select("id, raum_id, veranstalter_id, zweck, zeitraum, gesperrt, eingetragen_von, serie_id")
    .overlaps("zeitraum", `[${von} 00:00 Europe/Berlin,${bis} 00:00 Europe/Berlin)`);
  if (error) throw error;
  return (data ?? []).flatMap((b) =>
    b.id && b.raum_id && typeof b.zeitraum === "string"
      ? [{ id: b.id, raum_id: b.raum_id, veranstalter_id: b.veranstalter_id, gesperrt: !!b.gesperrt, zweck: b.zweck, eingetragen_von: b.eingetragen_von, zeitraum: b.zeitraum, serie_id: b.serie_id }]
      : [],
  );
}
