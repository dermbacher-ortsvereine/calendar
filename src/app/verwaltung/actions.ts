"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { TAG_TERMINE } from "@/lib/daten";
import { getSitzung } from "@/lib/sitzung";
import { createSessionClient } from "@/lib/supabase/server";
import { eingabeAusFormData, pruefeTermin, type TerminEingabe } from "@/lib/termin-validierung";

export type FormularZustand = {
  fehler?: string;
  feldFehler?: Partial<Record<keyof TerminEingabe, string>>;
  werte?: TerminEingabe;
  /** zählt hoch, damit das Formular nach einem Fehler mit den eingegebenen Werten neu aufgebaut wird */
  version: number;
};

const NICHT_ANGEMELDET = "Du bist nicht mehr angemeldet. Bitte neu anmelden.";

export async function terminSpeichern(vorher: FormularZustand, formData: FormData): Promise<FormularZustand> {
  const version = vorher.version + 1;
  const sitzung = await getSitzung();
  const werte = eingabeAusFormData(formData);
  if (!sitzung) return { fehler: NICHT_ANGEMELDET, werte, version };

  const pruefung = pruefeTermin(werte);
  if (!pruefung.ok) {
    return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: pruefung.fehler, werte, version };
  }

  // Normale Veranstalter speichern immer für sich selbst; nur der Admin wählt aus. RLS prüft zusätzlich.
  const veranstalterId = sitzung.istAdmin ? werte.veranstalter_id : sitzung.veranstalter?.id;
  if (!veranstalterId) {
    return { fehler: "Bitte den Veranstalter auswählen.", feldFehler: { veranstalter_id: "Bitte auswählen." }, werte, version };
  }

  const supabase = await createSessionClient();
  const id = String(formData.get("id") ?? "");
  const daten = { ...pruefung.daten, veranstalter_id: veranstalterId };
  const { data, error } = id
    ? await supabase.from("termine").update(daten).eq("id", id).select("id")
    : await supabase.from("termine").insert(daten).select("id");

  if (error || !data?.length) {
    return {
      fehler: id
        ? "Der Termin konnte nicht gespeichert werden. Vielleicht wurde er gelöscht oder gehört einem anderen Veranstalter."
        : "Der Termin konnte nicht gespeichert werden. Bitte später noch einmal versuchen.",
      werte,
      version,
    };
  }

  updateTag(TAG_TERMINE);
  redirect("/verwaltung?gespeichert=1");
}

export async function terminLoeschen(formData: FormData) {
  const sitzung = await getSitzung();
  if (!sitzung) redirect("/login?weiter=/verwaltung");

  const id = String(formData.get("id") ?? "");
  const supabase = await createSessionClient();
  const { data } = await supabase.from("termine").delete().eq("id", id).select("id");

  updateTag(TAG_TERMINE);
  redirect(data?.length ? "/verwaltung?geloescht=1" : "/verwaltung?fehler=loeschen");
}
