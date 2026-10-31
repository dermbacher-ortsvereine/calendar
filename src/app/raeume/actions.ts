"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getRaeume, getVeranstalter, TAG_RESERVIERUNGEN } from "@/lib/daten";
import { datumKurz, plusTage } from "@/lib/datum";
import {
  eingabeAusFormData,
  inBerlin,
  parseZeitraum,
  pruefeReservierung,
  pruefeSperre,
  sperreAusFormData,
  sperrTage,
  ueberschneiden,
  zeitraumGrenzen,
  zeitraumLiteral,
  type ReservierungEingabe,
  type SperreEingabe,
} from "@/lib/reservierung";
import { darfSchreiben } from "@/lib/rechte";
import { getSitzung } from "@/lib/sitzung";
import { createPublicClient } from "@/lib/supabase/public";
import { createSessionClient } from "@/lib/supabase/server";

export type ReservierungZustand = {
  fehler?: string;
  feldFehler?: Partial<Record<keyof ReservierungEingabe, string>>;
  werte?: ReservierungEingabe;
  /** Reihe mit belegten Tagen: Beschreibung je belegtem Tag und Zahl der freien Tage */
  konflikte?: { belegt: string[]; frei: number };
  version: number;
};

type Belegt = { id: string | null; start: Date; ende: Date; text: string };

/** Bestehende Belegungen eines Raums im Zeitraum, jeweils mit lesbarer Beschreibung. */
async function belegungen(raumId: string, zeitraum: string): Promise<Belegt[]> {
  const [{ data }, veranstalter] = await Promise.all([
    createPublicClient()
      .from("reservierungen_oeffentlich")
      .select("id, veranstalter_id, zeitraum, zweck, gesperrt")
      .eq("raum_id", raumId)
      .overlaps("zeitraum", zeitraum),
    getVeranstalter(),
  ]);
  const namen = new Map(veranstalter.map((v) => [v.id, v.name]));
  return (data ?? []).flatMap((b) => {
    const z = typeof b.zeitraum === "string" ? parseZeitraum(b.zeitraum) : null;
    if (!z) return [];
    if (b.gesperrt) {
      const t = sperrTage(z);
      const tage = t.von === t.bis ? datumKurz(t.von) : `${datumKurz(t.von)} bis ${datumKurz(t.bis)}`;
      return [{ id: b.id, ...z, text: `${tage} gesperrt${b.zweck ? ` (${b.zweck})` : ""}` }];
    }
    const s = inBerlin(z.start);
    const e = inBerlin(z.ende);
    return [{ id: b.id, ...z, text: `${datumKurz(s.datum)}, ${s.zeit}–${e.zeit} Uhr (${namen.get(b.veranstalter_id ?? "") ?? "belegt"}${b.zweck ? `: ${b.zweck}` : ""})` }];
  });
}

/** Beschreibt bestehende Belegungen, die mit dem gewünschten Zeitraum kollidieren. */
async function konfliktText(raumId: string, zeitraum: string): Promise<string> {
  const teile = (await belegungen(raumId, zeitraum)).map((b) => b.text);
  return teile.length ? ` Bereits belegt: ${teile.join("; ")}.` : "";
}

/**
 * Reihe: an welchen Tage ist die Zeit von–bis schon belegt? Tag -> Beschreibung der Belegung(en).
 * `eigene`: Reservierungen, die gerade geändert werden (zählen nicht als Konflikt).
 */
async function belegteTage(e: ReservierungEingabe, tage: string[], eigene = new Set<string>()): Promise<Map<string, string>> {
  // Bis zum übernächsten Tag: Reservierungen über Mitternacht reichen in den Folgetag.
  const gesamt = `["${tage[0]} 00:00 Europe/Berlin","${plusTage(tage[tage.length - 1], 2)} 00:00 Europe/Berlin")`;
  const vorhanden = (await belegungen(e.raum_id, gesamt)).filter((b) => !b.id || !eigene.has(b.id));
  const belegt = new Map<string, string>();
  for (const tag of tage) {
    const z = zeitraumGrenzen(tag, e.von, e.bis);
    const treffer = vorhanden.filter((b) => ueberschneiden(z, b));
    if (treffer.length) belegt.set(tag, treffer.map((b) => b.text).join("; "));
  }
  return belegt;
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

  // Wie bei Terminen: eigener oder gemeinsamer Veranstalter, der Admin wählt frei. RLS prüft zusätzlich.
  const veranstalterId = darfSchreiben(sitzung, werte.veranstalter_id) ? werte.veranstalter_id : sitzung.veranstalter?.id;
  if (!veranstalterId) {
    return { fehler: "Bitte den Veranstalter auswählen.", feldFehler: { veranstalter_id: "Bitte auswählen." }, werte, version };
  }

  const supabase = await createSessionClient();
  const id = String(formData.get("id") ?? "");
  const daten = { ...pruefung.daten, veranstalter_id: veranstalterId };
  const raumName = raeume.find((r) => r.id === werte.raum_id)?.name ?? "Der Raum";

  // Neue Reihe: belegte Tage vorab ermitteln und auf Wunsch auslassen; alle übrigen in einem Schritt anlegen.
  if (!id && werte.wiederholung !== "") {
    const belegt = await belegteTage(werte, pruefung.tage);
    const frei = pruefung.tage.filter((t) => !belegt.has(t));
    if (frei.length === 0) {
      return { fehler: `${raumName} ist an allen ${pruefung.tage.length} Tagen schon belegt.`, werte, version };
    }
    if (belegt.size > 0 && formData.get("belegte_auslassen") !== "1") {
      return { konflikte: { belegt: [...belegt.values()], frei: frei.length }, werte, version };
    }
    const serieId = crypto.randomUUID();
    const { error } = await supabase
      .from("reservierungen")
      .insert(frei.map((tag) => ({ ...daten, zeitraum: zeitraumLiteral(tag, werte.von, werte.bis), serie_id: serieId })));
    if (error) {
      return {
        fehler:
          error.code === "23P01"
            ? `${raumName} wurde gerade an einem dieser Tage reserviert. Bitte noch einmal auf „Reservieren“ tippen.`
            : "Die Reservierungen konnten nicht gespeichert werden. Bitte später noch einmal versuchen.",
        werte,
        version,
      };
    }
    updateTag(TAG_RESERVIERUNGEN);
    const q = new URLSearchParams({ raum: werte.raum_id, woche: werte.datum, reserviert: String(frei.length) });
    if (belegt.size) q.set("ausgelassen", String(belegt.size));
    redirect(`/raeume?${q}#belegung`);
  }

  // Reihe ändern („Diesen und alle folgenden“): jeder Termin behält seinen Tag, alles andere gilt für alle.
  if (id && werte.umfang === "folgende") {
    const { data: zeile } = await supabase.from("reservierungen").select("serie_id, zeitraum").eq("id", id).eq("gesperrt", false).maybeSingle();
    const { data: reihe } =
      zeile?.serie_id && typeof zeile.zeitraum === "string"
        ? await supabase.from("reservierungen").select("id, zeitraum").eq("serie_id", zeile.serie_id).rangeGte("zeitraum", zeile.zeitraum)
        : { data: null };
    const termine = (reihe ?? [])
      .flatMap((r) => {
        const z = typeof r.zeitraum === "string" ? parseZeitraum(r.zeitraum) : null;
        return z ? [{ id: r.id, tag: inBerlin(z.start).datum }] : [];
      })
      .sort((a, b) => a.tag.localeCompare(b.tag));
    if (!termine.length) {
      return {
        fehler: "Die Reihe konnte nicht gespeichert werden. Vielleicht wurde sie storniert oder gehört einem anderen Veranstalter.",
        werte,
        version,
      };
    }
    const belegt = await belegteTage(werte, termine.map((t) => t.tag), new Set(termine.map((t) => t.id)));
    const frei = termine.filter((t) => !belegt.has(t.tag));
    if (frei.length === 0) {
      return { fehler: `${raumName} ist an allen ${termine.length} Tagen zu dieser Zeit schon belegt.`, werte, version };
    }
    if (belegt.size > 0 && formData.get("belegte_auslassen") !== "1") {
      return { konflikte: { belegt: [...belegt.values()], frei: frei.length }, werte, version };
    }
    // Ein Schritt für alle Zeilen (alles oder nichts); serie_id mitschicken, damit die Zeilen in der Reihe bleiben.
    const { error } = await supabase.from("reservierungen").upsert(
      frei.map((t) => ({ ...daten, id: t.id, serie_id: zeile!.serie_id, zeitraum: zeitraumLiteral(t.tag, werte.von, werte.bis) })),
      { onConflict: "id" },
    );
    if (error) {
      return {
        fehler:
          error.code === "23P01"
            ? `${raumName} wurde gerade an einem dieser Tage reserviert. Bitte noch einmal auf „Speichern“ tippen.`
            : "Die Reihe konnte nicht gespeichert werden. Bitte später noch einmal versuchen.",
        werte,
        version,
      };
    }
    updateTag(TAG_RESERVIERUNGEN);
    const q = new URLSearchParams({ raum: werte.raum_id, woche: frei[0].tag, geaendert: String(frei.length) });
    if (belegt.size) q.set("unveraendert", String(belegt.size));
    redirect(`/raeume?${q}#belegung`);
  }

  const { data, error } = id
    ? await supabase.from("reservierungen").update(daten).eq("id", id).eq("gesperrt", false).select("id")
    : await supabase.from("reservierungen").insert(daten).select("id");

  if (error || !data?.length) {
    // 23P01 = exclusion_violation: Überschneidung mit einer bestehenden Reservierung
    if (error?.code === "23P01") {
      return {
        fehler: `${raumName} ist in dieser Zeit schon reserviert.${await konfliktText(werte.raum_id, pruefung.daten.zeitraum)}`,
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
  // „Diesen und alle folgenden“: alle Zeilen der Reihe, die nicht vor dieser beginnen (RLS prüft die Rechte).
  const { data: reihe } =
    formData.get("umfang") === "folgende"
      ? await supabase.from("reservierungen").select("serie_id, zeitraum").eq("id", id).maybeSingle()
      : { data: null };
  const { data } =
    reihe?.serie_id && typeof reihe.zeitraum === "string"
      ? await supabase.from("reservierungen").delete().eq("serie_id", reihe.serie_id).rangeGte("zeitraum", reihe.zeitraum).select("gesperrt")
      : await supabase.from("reservierungen").delete().eq("id", id).select("gesperrt");

  updateTag(TAG_RESERVIERUNGEN);
  const q = new URLSearchParams({
    raum: String(formData.get("raum") ?? ""),
    woche: String(formData.get("woche") ?? ""),
    [data?.length ? (data[0].gesperrt ? "entsperrt" : "storniert") : "fehler"]: String(data?.length || 1),
  });
  redirect(`/raeume?${q}#belegung`);
}
