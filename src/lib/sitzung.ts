import { cache } from "react";
import { getVeranstalter } from "@/lib/daten";
import type { Schreibrechte } from "@/lib/rechte";
import { createSessionClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "admin@dermbacher-ortsvereine.de";

export type Sitzung = Schreibrechte & {
  userId: string;
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
    .select("ist_admin, veranstalter:veranstalter_id (id, name, aktiv, gemeinsam)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profil) return null;

  // Deaktivierte und gemeinsame Veranstalter gelten als abgemeldet (die Datenbank verweigert ihnen ebenfalls das Schreiben).
  const v = profil.veranstalter;
  const veranstalter = v?.aktiv && !v.gemeinsam ? { id: v.id, name: v.name } : null;
  if (!profil.ist_admin && !veranstalter) return null;
  const gemeinsame = veranstalter ? (await getVeranstalter()).filter((g) => g.gemeinsam).map((g) => g.id) : [];

  return {
    userId,
    istAdmin: profil.ist_admin,
    veranstalter,
    anzeigename: profil.ist_admin && !veranstalter ? "Administration" : veranstalter!.name,
    schreibbar: veranstalter ? [veranstalter.id, ...gemeinsame] : [],
  };
});
