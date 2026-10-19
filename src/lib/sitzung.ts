import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "admin@dermbacher-ortsvereine.de";

export type Sitzung = {
  userId: string;
  istAdmin: boolean;
  /** null beim Admin-Zugang */
  veranstalter: { id: string; name: string } | null;
  /** Anzeigename im Header: Veranstalter bzw. "Administration" */
  anzeigename: string;
};

/** Aktuelle Sitzung (pro Request einmal ermittelt). Liest Cookies – nur innerhalb von Suspense nutzen. */
export const getSitzung = cache(async (): Promise<Sitzung | null> => {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profil } = await supabase
    .from("profile")
    .select("ist_admin, veranstalter:veranstalter_id (id, name, aktiv)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profil) return null;

  // Deaktivierte Veranstalter gelten als abgemeldet (die Datenbank verweigert ihnen ebenfalls das Schreiben).
  const veranstalter = profil.veranstalter?.aktiv ? { id: profil.veranstalter.id, name: profil.veranstalter.name } : null;
  if (!profil.ist_admin && !veranstalter) return null;

  return {
    userId,
    istAdmin: profil.ist_admin,
    veranstalter,
    anzeigename: profil.ist_admin && !veranstalter ? "Administration" : veranstalter!.name,
  };
});
