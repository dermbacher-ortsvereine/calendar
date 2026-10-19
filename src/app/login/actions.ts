"use server";

import { redirect } from "next/navigation";
import { sichererPfad } from "@/lib/pfad";
import { ADMIN_EMAIL } from "@/lib/sitzung";
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

  redirect(ziel);
}

export async function abmelden() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/");
}
