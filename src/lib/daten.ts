import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";

export type Veranstalter = Pick<
  Tables<"veranstalter">,
  "id" | "name" | "kuerzel" | "farbe" | "farbe_hg" | "logo_url" | "sortierung"
>;
export type Termin = Omit<Tables<"termine">, "erstellt_am">;

const TERMIN_SPALTEN =
  "id, veranstalter_id, titel, datum, beginn, ende, ort, beschreibung, ansprechpartner, geaendert_am";

// Cache-Tags: nach Änderungen per updateTag()/revalidateTag() neu laden.
export const TAG_TERMINE = "termine";
export const TAG_VERANSTALTER = "veranstalter";

export async function getVeranstalter(): Promise<Veranstalter[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_VERANSTALTER);
  const { data, error } = await createPublicClient()
    .from("veranstalter")
    .select("id, name, kuerzel, farbe, farbe_hg, logo_url, sortierung")
    .eq("aktiv", true)
    .order("sortierung")
    .order("name");
  if (error) throw error;
  return data;
}

/** Termine mit Datum in [von, bis] (inklusive), sortiert. */
export async function getTermineZwischen(von: string, bis: string): Promise<Termin[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_TERMINE);
  const { data, error } = await createPublicClient()
    .from("termine")
    .select(TERMIN_SPALTEN)
    .gte("datum", von)
    .lte("datum", bis)
    .order("datum")
    .order("beginn")
    .order("titel");
  if (error) throw error;
  return data;
}

/** Alle Termine ab einem Datum (für den iCal-Feed). */
export async function getTermineAb(von: string): Promise<Termin[]> {
  "use cache";
  cacheLife("kalender");
  cacheTag(TAG_TERMINE);
  const { data, error } = await createPublicClient()
    .from("termine")
    .select(TERMIN_SPALTEN)
    .gte("datum", von)
    .order("datum")
    .order("beginn")
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
