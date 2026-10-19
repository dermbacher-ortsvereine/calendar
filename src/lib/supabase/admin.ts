import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Supabase-Client mit Service-Role-Schlüssel: umgeht RLS. NUR serverseitig und nur
 * für Admin-Aufgaben verwenden, die die Datenbank-Rechte nicht abdecken (Auth-Benutzer verwalten).
 * Der Schlüssel steht nur in Vercel bzw. .env.local – niemals im Repo.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Profil = { veranstalter_id: string | null; ist_admin: boolean };

/**
 * Passwort eines Zugangs setzen; legt den Auth-Benutzer an, falls es ihn noch nicht gibt,
 * und verknüpft ihn mit seinem Profil (Veranstalter bzw. Admin).
 */
export async function zugangSetzen(
  email: string,
  passwort: string,
  profil: Profil,
): Promise<{ fehler?: string; angelegt?: boolean }> {
  const admin = createAdminClient();
  // Benutzer per E-Mail finden (kleine Anzahl Zugänge, eine Seite reicht).
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { fehler: error.message };
  const vorhanden = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  const res = vorhanden
    ? await admin.auth.admin.updateUserById(vorhanden.id, { password: passwort })
    : await admin.auth.admin.createUser({ email, password: passwort, email_confirm: true });
  if (res.error || !res.data.user) return { fehler: res.error?.message ?? "Unbekannter Fehler" };

  const { error: profilFehler } = await admin
    .from("profile")
    .upsert({ user_id: res.data.user.id, ...profil }, { onConflict: "user_id" });
  if (profilFehler) return { fehler: profilFehler.message };
  return { angelegt: !vorhanden };
}
