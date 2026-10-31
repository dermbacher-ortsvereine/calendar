// Legt für jeden aktiven Veranstalter (außer gemeinsamen wie „Ortsvereine Dermbach“) und für die Administration einen Auth-Benutzer an
// (bzw. setzt das Passwort neu, falls es ihn schon gibt) und verknüpft ihn mit seinem
// Profil (Veranstalter bzw. Administration).
//
// Aufruf (Passwort NIE ins Repo schreiben):
//   ZUGANG_PASSWORT='…' node --env-file=.env.local scripts/zugaenge-anlegen.mjs
//   ZUGANG_PASSWORT='…' node --env-file=.env.local scripts/zugaenge-anlegen.mjs mv ff   # nur einzelne
//
// Ohne Einschränkung bekommen alle Zugänge dasselbe Passwort – das ist nur für die
// lokale Entwicklung gedacht. In Produktion pro Veranstalter ein eigenes Passwort setzen.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const passwort = process.env.ZUGANG_PASSWORT;
const ADMIN_EMAIL = "admin@dermbacher-ortsvereine.de";

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen (.env.local).");
  process.exit(1);
}
if (!passwort || passwort.length < 8) {
  console.error("Bitte ZUGANG_PASSWORT (mindestens 8 Zeichen) als Umgebungsvariable setzen.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const nur = process.argv.slice(2);

const { data: veranstalter, error } = await supabase
  .from("veranstalter")
  .select("id, name, login_email")
  .eq("aktiv", true)
  .eq("gemeinsam", false)
  .order("sortierung");
if (error) throw error;

const ziele = [
  ...veranstalter.map((v) => ({ id: v.id, name: v.name, email: v.login_email, profil: { veranstalter_id: v.id, ist_admin: false } })),
  { id: "admin", name: "Administration", email: ADMIN_EMAIL, profil: { veranstalter_id: null, ist_admin: true } },
].filter((z) => nur.length === 0 || nur.includes(z.id));

const { data: liste, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
const vorhanden = new Map(liste.users.map((u) => [u.email?.toLowerCase(), u.id]));

for (const z of ziele) {
  const userId = vorhanden.get(z.email.toLowerCase());
  const res = userId
    ? await supabase.auth.admin.updateUserById(userId, { password: passwort })
    : await supabase.auth.admin.createUser({ email: z.email, password: passwort, email_confirm: true });
  const profil = res.error
    ? null
    : await supabase.from("profile").upsert({ user_id: res.data.user.id, ...z.profil }, { onConflict: "user_id" });
  if (res.error || profil?.error) {
    console.error(`✗ ${z.name}: ${(res.error ?? profil.error).message}`);
  } else {
    console.log(`✓ ${z.name} (${z.email}) ${userId ? "Passwort aktualisiert" : "angelegt"}`);
  }
}
