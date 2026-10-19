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

/** Passwort eines Zugangs setzen; legt den Auth-Benutzer an, falls es ihn noch nicht gibt. */
export async function zugangSetzen(email: string, passwort: string): Promise<{ fehler?: string; angelegt?: boolean }> {
  const admin = createAdminClient();
  // Benutzer per E-Mail finden (kleine Anzahl Zugänge, eine Seite reicht).
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { fehler: error.message };
  const vorhanden = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  const res = vorhanden
    ? await admin.auth.admin.updateUserById(vorhanden.id, { password: passwort })
    : await admin.auth.admin.createUser({ email, password: passwort, email_confirm: true });
  if (res.error) return { fehler: res.error.message };
  return { angelegt: !vorhanden };
}
