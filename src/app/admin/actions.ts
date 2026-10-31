"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { TAG_RAEUME, TAG_VERANSTALTER } from "@/lib/daten";
import { getSitzung } from "@/lib/sitzung";
import { zugangSetzen } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { pruefeRaum, type RaumEingabe } from "@/lib/raum-validierung";
import { pruefePasswort, pruefeVeranstalter, type VeranstalterEingabe } from "@/lib/veranstalter-validierung";

export type AdminZustand = {
  fehler?: string;
  feldFehler?: Partial<Record<keyof VeranstalterEingabe | "passwort", string>>;
  erfolg?: string;
  werte?: VeranstalterEingabe;
  raumWerte?: RaumEingabe;
  version: number;
};

const LOGIN_DOMAIN = "dermbacher-ortsvereine.de";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPEN: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

async function nurAdmin() {
  const sitzung = await getSitzung();
  if (!sitzung?.istAdmin) redirect("/login?weiter=/admin");
  return sitzung;
}

function eingabe(formData: FormData): VeranstalterEingabe {
  const w = (k: string) => String(formData.get(k) ?? "");
  return {
    id: w("id").trim().toLowerCase(),
    name: w("name"),
    kuerzel: w("kuerzel"),
    farbe: w("farbe"),
    farbe_hg: w("farbe_hg"),
    sortierung: w("sortierung"),
    aktiv: formData.get("aktiv") === "on",
  };
}

export async function veranstalterSpeichern(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const werte = eingabe(formData);
  const r = pruefeVeranstalter(werte, { neu: false });
  if (!r.ok) return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: r.fehler, werte, version };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("veranstalter").update(r.daten).eq("id", werte.id).select("id");
  if (error || !data?.length) return { fehler: "Speichern hat nicht geklappt.", werte, version };

  updateTag(TAG_VERANSTALTER);
  return { erfolg: "Gespeichert.", version };
}

export async function veranstalterAnlegen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const werte = eingabe(formData);
  const passwort = String(formData.get("passwort") ?? "");
  const r = pruefeVeranstalter({ ...werte, aktiv: true }, { neu: true });
  const pwFehler = pruefePasswort(passwort);
  if (!r.ok || pwFehler) {
    return {
      fehler: "Bitte die markierten Felder prüfen.",
      feldFehler: { ...(r.ok ? {} : r.fehler), ...(pwFehler ? { passwort: pwFehler } : {}) },
      werte,
      version,
    };
  }

  const loginEmail = `${werte.id}@${LOGIN_DOMAIN}`;
  const supabase = await createSessionClient();
  const { error } = await supabase.from("veranstalter").insert({ id: werte.id, login_email: loginEmail, ...r.daten });
  if (error) {
    return {
      fehler: error.code === "23505" ? `Die Kennung „${werte.id}“ gibt es schon.` : "Anlegen hat nicht geklappt.",
      feldFehler: error.code === "23505" ? { id: "Bereits vergeben." } : undefined,
      werte,
      version,
    };
  }

  // Auth-Zugang anlegen – der Datenbank-Trigger verknüpft ihn über login_email mit dem Veranstalter.
  const zugang = await zugangSetzen(loginEmail, passwort, { veranstalter_id: werte.id, ist_admin: false });
  updateTag(TAG_VERANSTALTER);
  if (zugang.fehler) {
    return { fehler: `Veranstalter angelegt, aber der Zugang nicht: ${zugang.fehler}. Bitte das Passwort unten neu setzen.`, version };
  }
  return { erfolg: `„${r.daten.name}“ angelegt. Anmeldung ab sofort mit dem vergebenen Passwort.`, version };
}

export async function passwortSetzen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const id = String(formData.get("id") ?? "");
  const passwort = String(formData.get("passwort") ?? "");
  const pwFehler = pruefePasswort(passwort);
  if (pwFehler) return { fehler: pwFehler, feldFehler: { passwort: pwFehler }, version };

  const supabase = await createSessionClient();
  const { data: v } = await supabase.from("veranstalter").select("login_email, gemeinsam").eq("id", id).maybeSingle();
  if (!v) return { fehler: "Veranstalter nicht gefunden.", version };
  if (v.gemeinsam) return { fehler: "Gemeinsame Veranstalter haben keinen eigenen Zugang.", version };

  const res = await zugangSetzen(v.login_email, passwort, { veranstalter_id: id, ist_admin: false });
  if (res.fehler) return { fehler: `Das hat nicht geklappt: ${res.fehler}`, version };
  return { erfolg: res.angelegt ? "Zugang angelegt." : "Neues Passwort gesetzt. Bitte dem Veranstalter mitteilen.", version };
}

export async function eigenesPasswortAendern(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const passwort = String(formData.get("passwort") ?? "");
  const pwFehler = pruefePasswort(passwort);
  if (pwFehler) return { fehler: pwFehler, feldFehler: { passwort: pwFehler }, version };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({ password: passwort });
  if (error) return { fehler: `Das hat nicht geklappt: ${error.message}`, version };
  return { erfolg: "Dein Passwort wurde geändert.", version };
}

/** Logo hochladen oder entfernen (Feld "aktion"), damit beide Formulare einen gemeinsamen Zustand haben. */
export async function logoAendern(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  return formData.get("aktion") === "entfernen" ? logoEntfernen(vorher, formData) : logoHochladen(vorher, formData);
}

async function logoHochladen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const id = String(formData.get("id") ?? "");
  const datei = formData.get("logo");
  if (!(datei instanceof File) || datei.size === 0) return { fehler: "Bitte eine Bilddatei auswählen.", version };
  const endung = LOGO_TYPEN[datei.type];
  if (!endung) return { fehler: "Bitte ein PNG-, JPG- oder WebP-Bild verwenden.", version };
  if (datei.size > MAX_LOGO_BYTES) return { fehler: "Das Bild ist größer als 2 MB.", version };

  const supabase = await createSessionClient();
  const { data: alt } = await supabase.from("veranstalter").select("logo_url").eq("id", id).maybeSingle();
  if (!alt) return { fehler: "Veranstalter nicht gefunden.", version };

  const pfad = `${id}-${Date.now()}.${endung}`;
  const upload = await supabase.storage.from("logos").upload(pfad, datei, { contentType: datei.type, cacheControl: "31536000" });
  if (upload.error) return { fehler: `Hochladen hat nicht geklappt: ${upload.error.message}`, version };

  const { data: oeffentlich } = supabase.storage.from("logos").getPublicUrl(pfad);
  await supabase.from("veranstalter").update({ logo_url: oeffentlich.publicUrl }).eq("id", id);
  await altesLogoEntfernen(alt.logo_url);

  updateTag(TAG_VERANSTALTER);
  return { erfolg: "Logo gespeichert.", version };
}

async function logoEntfernen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const id = String(formData.get("id") ?? "");
  const supabase = await createSessionClient();
  const { data: alt } = await supabase.from("veranstalter").select("logo_url").eq("id", id).maybeSingle();
  await supabase.from("veranstalter").update({ logo_url: null }).eq("id", id);
  await altesLogoEntfernen(alt?.logo_url ?? null);
  updateTag(TAG_VERANSTALTER);
  return { erfolg: "Logo entfernt.", version };
}

async function altesLogoEntfernen(url: string | null) {
  const pfad = url?.split("/storage/v1/object/public/logos/")[1];
  if (!pfad) return;
  const supabase = await createSessionClient();
  await supabase.storage.from("logos").remove([decodeURIComponent(pfad)]);
}

function raumEingabe(formData: FormData): RaumEingabe {
  const w = (k: string) => String(formData.get(k) ?? "");
  return { id: w("id").trim().toLowerCase(), name: w("name"), sortierung: w("sortierung") };
}

export async function raumSpeichern(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const werte = raumEingabe(formData);
  const r = pruefeRaum(werte, { neu: false });
  if (!r.ok) return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: r.fehler, raumWerte: werte, version };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("raeume").update(r.daten).eq("id", werte.id).select("id");
  if (error || !data?.length) return { fehler: "Speichern hat nicht geklappt.", raumWerte: werte, version };

  updateTag(TAG_RAEUME);
  return { erfolg: "Gespeichert.", version };
}

export async function raumAnlegen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const werte = raumEingabe(formData);
  const r = pruefeRaum(werte, { neu: true });
  if (!r.ok) return { fehler: "Bitte die markierten Felder prüfen.", feldFehler: r.fehler, raumWerte: werte, version };

  const supabase = await createSessionClient();
  const { error } = await supabase.from("raeume").insert({ id: werte.id, ...r.daten });
  if (error) {
    return {
      fehler: error.code === "23505" ? `Die Kennung „${werte.id}“ gibt es schon.` : "Anlegen hat nicht geklappt.",
      feldFehler: error.code === "23505" ? { id: "Bereits vergeben." } : undefined,
      raumWerte: werte,
      version,
    };
  }

  updateTag(TAG_RAEUME);
  return { erfolg: `„${r.daten.name}“ angelegt. Der Raum kann ab sofort reserviert werden.`, version };
}

/** Löschen nur ohne Reservierungen und Sperren (auch vergangene) – die Datenbank verhindert es sonst (23503). */
export async function raumLoeschen(vorher: AdminZustand, formData: FormData): Promise<AdminZustand> {
  await nurAdmin();
  const version = vorher.version + 1;
  const id = String(formData.get("id") ?? "");

  const supabase = await createSessionClient();
  const { count } = await supabase.from("raeume").select("id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return { fehler: "Der letzte Raum kann nicht gelöscht werden.", version };

  const { data, error } = await supabase.from("raeume").delete().eq("id", id).select("id");
  if (error?.code === "23503") {
    return { fehler: "Für diesen Raum gibt es Reservierungen oder Sperren (auch vergangene). Er kann deshalb nicht gelöscht werden.", version };
  }
  if (error || !data?.length) return { fehler: "Löschen hat nicht geklappt.", version };

  updateTag(TAG_RAEUME);
  return { erfolg: "Raum gelöscht.", version };
}
