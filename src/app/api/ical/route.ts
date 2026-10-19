import { getTermineAb, getVeranstalter } from "@/lib/daten";
import { heute, plusTage } from "@/lib/datum";
import { erzeugeKalender } from "@/lib/ical";
import { basisUrl, ICAL_CACHE_CONTROL, zuIcalTermin } from "@/lib/ical-antwort";

/** Abo-Feed: alle Termine ab ca. 3 Monaten in der Vergangenheit, optional ?v=mv,ff */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const veranstalterListe = await getVeranstalter();
  const veranstalter = new Map(veranstalterListe.map((v) => [v.id, v]));

  const filter = (url.searchParams.get("v") ?? "")
    .split(",")
    .filter((id) => veranstalter.has(id));

  const termine = (await getTermineAb(plusTage(heute(), -92)))
    .filter((t) => filter.length === 0 || filter.includes(t.veranstalter_id))
    .map((t) => zuIcalTermin(t, veranstalter))
    .filter((t) => t !== null);

  const name =
    filter.length === 0
      ? "Dermbacher Ortsvereine"
      : `Dermbacher Ortsvereine – ${filter.map((id) => veranstalter.get(id)!.name).join(" · ")}`;

  return new Response(erzeugeKalender(termine, { name, basisUrl: basisUrl(request) }), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="dermbacher-ortsvereine.ics"',
      "Cache-Control": ICAL_CACHE_CONTROL,
    },
  });
}
