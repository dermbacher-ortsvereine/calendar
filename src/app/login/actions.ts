"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ANMELDE_MARKER, ANMELDE_MARKER_OPTIONEN } from "@/lib/anmelde-marker";
import { sichererPfad } from "@/lib/pfad";
import { ADMIN_EMAIL, getSitzung, type SitzungsInfo } from "@/lib/sitzung";
import { createPublicClient } from "@/lib/supabase/public";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginZustand = { fehler?: string; kennung?: string };

export async function anmelden(_vorher: LoginZustand, formData: FormData): Promise<LoginZustand> {
  const kennung = String(formData.get("kennung") ?? "");
  const passwort = String(formData.get("passwort") ?? "");
  const ziel = sichererPfad(formData.get("weiter"));

  if (!kennung) return { fehler: "Bitte den Veranstalter auswählen.", kennung };
  if (!passwort) return { fehler: "Bitte das Passwort eingeben.", kennung };

  let email: string | null = null;
  if (kennung === "admin") {
    email = ADMIN_EMAIL;
  } else {
    const { data } = await createPublicClient()
      .from("veranstalter")
      .select("login_email")
      .eq("id", kennung)
      .eq("aktiv", true)
      .maybeSingle();
    email = data?.login_email ?? null;
  }
  if (!email) return { fehler: "Bitte den Veranstalter auswählen.", kennung };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
  if (error) {
    const zuViele = error.status === 429;
    return {
      fehler: zuViele
        ? "Zu viele Versuche. Bitte in ein paar Minuten noch einmal probieren."
        : "Das Passwort stimmt nicht. Bitte noch einmal versuchen.",
      kennung,
    };
  }

  (await cookies()).set(ANMELDE_MARKER, "1", ANMELDE_MARKER_OPTIONEN);
  redirect(ziel);
}

export async function abmelden() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ANMELDE_MARKER);
  redirect("/");
}

/** Login-Status für den Browser (Header, Bearbeiten-Knöpfe). Ohne gültige Sitzung fällt das Hinweis-Cookie weg. */
export async function sitzungsInfo(): Promise<SitzungsInfo | null> {
  const sitzung = await getSitzung();
  if (!sitzung) {
    (await cookies()).delete(ANMELDE_MARKER);
    return null;
  }
  return { anzeigename: sitzung.anzeigename, istAdmin: sitzung.istAdmin, schreibbar: sitzung.schreibbar };
}
