"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getRaeume, getVeranstalter, TAG_RESERVIERUNGEN } from "@/lib/daten";
import { datumKurz } from "@/lib/datum";
import {
  eingabeAusFormData,
  inBerlin,
  parseZeitraum,
  pruefeReservierung,
  pruefeSperre,
  sperreAusFormData,
  sperrTage,
  type ReservierungEingabe,
  type SperreEingabe,
} from "@/lib/reservierung";
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
      .select("veranstalter_id, zeitraum, zweck, gesperrt")
      .eq("raum_id", raumId)
      .overlaps("zeitraum", zeitraum),
    getVeranstalter(),
  ]);
  const namen = new Map(veranstalter.map((v) => [v.id, v.name]));
  const teile = (data ?? []).flatMap((b) => {
    const z = typeof b.zeitraum === "string" ? parseZeitraum(b.zeitraum) : null;
    if (!z) return [];
    if (b.gesperrt) {
      const t = sperrTage(z);
      const tage = t.von === t.bis ? datumKurz(t.von) : `${datumKurz(t.von)} bis ${datumKurz(t.bis)}`;
      return [`${tage} gesperrt${b.zweck ? ` (${b.zweck})` : ""}`];
    }
    const s = inBerlin(z.start);
    const e = inBerlin(z.ende);
    return [`${datumKurz(s.datum)}, ${s.zeit}–${e.zeit} Uhr (${namen.get(b.veranstalter_id ?? "") ?? "belegt"}${b.zweck ? `: ${b.zweck}` : ""})`];
  });
  return teile.length ? ` Bereits belegt: ${teile.join("; ")}.` : "";
}

/** Legt eine Reservierung an oder ändert sie (mit Feld `id`). */
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
  const id = String(formData.get("id") ?? "");
  const daten = { ...pruefung.daten, veranstalter_id: veranstalterId };
  const { data, error } = id
    ? await supabase.from("reservierungen").update(daten).eq("id", id).eq("gesperrt", false).select("id")
    : await supabase.from("reservierungen").insert(daten).select("id");

  if (error || !data?.length) {
    // 23P01 = exclusion_violation: Überschneidung mit einer bestehenden Reservierung
    if (error?.code === "23P01") {
      const raum = raeume.find((r) => r.id === werte.raum_id)?.name ?? "Der Raum";
      return {
        fehler: `${raum} ist in dieser Zeit schon reserviert.${await konfliktText(werte.raum_id, pruefung.daten.zeitraum)}`,
        werte,
        version,
      };
    }
    return {
      fehler: id
        ? "Die Reservierung konnte nicht gespeichert werden. Vielleicht wurde sie storniert oder gehört einem anderen Veranstalter."
        : "Die Reservierung konnte nicht gespeichert werden. Bitte später noch einmal versuchen.",
      werte,
      version,
    };
  }

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({ raum: werte.raum_id, woche: werte.datum, [id ? "geaendert" : "reserviert"]: "1" });
  redirect(`/raeume?${q}#belegung`);
}

export type SperreZustand = {
  fehler?: string;
  feldFehler?: Partial<Record<keyof SperreEingabe, string>>;
  werte?: SperreEingabe;
  version: number;
};

/** Sperrt einen Raum für ganze Tage (nur Admin); ändert eine Sperre mit Feld `id`. */
export async function sperren(vorher: SperreZustand, formData: FormData): Promise<SperreZustand> {
  const version = vorher.version + 1;
  const werte = sperreAusFormData(formData);
  const sitzung = await getSitzung();
  if (!sitzung?.istAdmin) return { fehler: "Räume sperren kann nur die Administration.", werte, version };

  const raeume = await getRaeume();
  const pruefung = pruefeSperre(werte, raeume.map((r) => r.id));
  if (!pruefung.ok) {
    return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: pruefung.fehler, werte, version };
  }

  const supabase = await createSessionClient();
  const id = String(formData.get("id") ?? "");
  const daten = { ...pruefung.daten, gesperrt: true, veranstalter_id: null };
  const { data, error } = id
    ? await supabase.from("reservierungen").update(daten).eq("id", id).eq("gesperrt", true).select("id")
    : await supabase.from("reservierungen").insert(daten).select("id");

  if (error || !data?.length) {
    if (error?.code === "23P01") {
      const raum = raeume.find((r) => r.id === werte.raum_id)?.name ?? "Der Raum";
      return {
        fehler: `${raum} ist in diesem Zeitraum schon belegt. Bitte die bestehenden Reservierungen zuerst verschieben oder stornieren.${await konfliktText(werte.raum_id, pruefung.daten.zeitraum)}`,
        werte,
        version,
      };
    }
    return { fehler: "Die Sperre konnte nicht gespeichert werden. Bitte später noch einmal versuchen.", werte, version };
  }

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({ raum: werte.raum_id, woche: werte.datum, [id ? "geaendert" : "gesperrt"]: "1" });
  redirect(`/raeume?${q}#belegung`);
}

export async function reservierungLoeschen(formData: FormData) {
  const sitzung = await getSitzung();
  if (!sitzung) redirect("/login?weiter=/raeume");

  const id = String(formData.get("id") ?? "");
  const supabase = await createSessionClient();
  const { data } = await supabase.from("reservierungen").delete().eq("id", id).select("gesperrt");

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({
    raum: String(formData.get("raum") ?? ""),
    woche: String(formData.get("woche") ?? ""),
    [data?.length ? (data[0].gesperrt ? "entsperrt" : "storniert") : "fehler"]: "1",
  });
  redirect(`/raeume?${q}#belegung`);
}
