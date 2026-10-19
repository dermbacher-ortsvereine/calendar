"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getRaeume, getVeranstalter, TAG_RESERVIERUNGEN } from "@/lib/daten";
import { datumKurz } from "@/lib/datum";
import { eingabeAusFormData, inBerlin, parseZeitraum, pruefeReservierung, type ReservierungEingabe } from "@/lib/reservierung";
import { getSitzung } from "@/lib/sitzung";
import { createPublicClient } from "@/lib/supabase/public";
import { createSessionClient } from "@/lib/supabase/server";

export type ReservierungZustand = {
  fehler?: string;
  feldFehler?: Partial<Record<keyof ReservierungEingabe, string>>;
  werte?: ReservierungEingabe;
  version: number;
};

/** Beschreibt bestehende Belegungen, die mit dem gewünschten Zeitraum kollidieren. */
async function konfliktText(raumId: string, zeitraum: string): Promise<string> {
  const [{ data }, veranstalter] = await Promise.all([
    createPublicClient()
      .from("reservierungen_oeffentlich")
      .select("veranstalter_id, zeitraum, zweck")
      .eq("raum_id", raumId)
      .overlaps("zeitraum", zeitraum),
    getVeranstalter(),
  ]);
  const namen = new Map(veranstalter.map((v) => [v.id, v.name]));
  const teile = (data ?? []).flatMap((b) => {
    const z = typeof b.zeitraum === "string" ? parseZeitraum(b.zeitraum) : null;
    if (!z) return [];
    const s = inBerlin(z.start);
    const e = inBerlin(z.ende);
    return [`${datumKurz(s.datum)}, ${s.zeit}–${e.zeit} Uhr (${namen.get(b.veranstalter_id ?? "") ?? "belegt"}${b.zweck ? `: ${b.zweck}` : ""})`];
  });
  return teile.length ? ` Bereits belegt: ${teile.join("; ")}.` : "";
}

export async function reservieren(vorher: ReservierungZustand, formData: FormData): Promise<ReservierungZustand> {
  const version = vorher.version + 1;
  const werte = eingabeAusFormData(formData);
  const sitzung = await getSitzung();
  if (!sitzung) return { fehler: "Du bist nicht mehr angemeldet. Bitte neu anmelden.", werte, version };

  const raeume = await getRaeume();
  const pruefung = pruefeReservierung(werte, raeume.map((r) => r.id));
  if (!pruefung.ok) {
    return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: pruefung.fehler, werte, version };
  }

  const veranstalterId = sitzung.istAdmin ? werte.veranstalter_id : sitzung.veranstalter?.id;
  if (!veranstalterId) {
    return { fehler: "Bitte den Veranstalter auswählen.", feldFehler: { veranstalter_id: "Bitte auswählen." }, werte, version };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("reservierungen")
    .insert({ ...pruefung.daten, veranstalter_id: veranstalterId });

  if (error) {
    // 23P01 = exclusion_violation: Überschneidung mit einer bestehenden Reservierung
    if (error.code === "23P01") {
      const raum = raeume.find((r) => r.id === werte.raum_id)?.name ?? "Der Raum";
      return {
        fehler: `${raum} ist in dieser Zeit schon reserviert.${await konfliktText(werte.raum_id, pruefung.daten.zeitraum)}`,
        werte,
        version,
      };
    }
    return { fehler: "Die Reservierung konnte nicht gespeichert werden. Bitte später noch einmal versuchen.", werte, version };
  }

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({ raum: werte.raum_id, woche: werte.datum, reserviert: "1" });
  redirect(`/raeume?${q}#reservieren`);
}

export async function reservierungLoeschen(formData: FormData) {
  const sitzung = await getSitzung();
  if (!sitzung) redirect("/login?weiter=/raeume");

  const id = String(formData.get("id") ?? "");
  const supabase = await createSessionClient();
  const { data } = await supabase.from("reservierungen").delete().eq("id", id).select("id");

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({
    raum: String(formData.get("raum") ?? ""),
    woche: String(formData.get("woche") ?? ""),
    [data?.length ? "storniert" : "fehler"]: "1",
  });
  redirect(`/raeume?${q}#reservieren`);
}
