import { getTermin, getVeranstalter } from "@/lib/daten";
import { dateiname, erzeugeKalender } from "@/lib/ical";
import { basisUrl, ICAL_CACHE_CONTROL, zuIcalTermin } from "@/lib/ical-antwort";

/** Einzelner Termin als .ics-Download ("In meinen Kalender"). */
export async function GET(request: Request, ctx: RouteContext<"/api/ical/[id]">) {
  const { id } = await ctx.params;
  const [termin, veranstalterListe] = await Promise.all([getTermin(id), getVeranstalter()]);
  const ical = termin && zuIcalTermin(termin, new Map(veranstalterListe.map((v) => [v.id, v])));
  if (!termin || !ical) {
    return new Response("Termin nicht gefunden", { status: 404 });
  }

  const name = dateiname(termin);
  return new Response(erzeugeKalender([ical], { name: termin.titel, basisUrl: basisUrl(request) }), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": ICAL_CACHE_CONTROL,
    },
  });
}
