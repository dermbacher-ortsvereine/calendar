import { createPublicClient } from "@/lib/supabase/public";

/**
 * Hält das Supabase-Projekt wach: Free-Projekte werden nach 7 Tagen ohne Aktivität pausiert
 * und starten nicht von selbst wieder. Ein Vercel-Schedule ruft diese Route täglich auf (vercel.json).
 * Bewusst ungecacht, damit die Anfrage wirklich bei der Datenbank ankommt.
 *
 * Vercel schickt bei Schedule-Aufrufen (Pfad-Ziel) automatisch `Authorization: Bearer <CRON_SECRET>`,
 * sofern die Umgebungsvariable CRON_SECRET gesetzt ist.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Nicht erlaubt", { status: 401 });
  }

  const { error } = await createPublicClient().from("veranstalter").select("id").limit(1);
  if (error) {
    console.error("Keep-alive: Datenbank nicht erreichbar", error);
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
