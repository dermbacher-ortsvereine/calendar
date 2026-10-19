import type { Termin, Veranstalter } from "@/lib/daten";
import type { IcalTermin } from "@/lib/ical";

export function zuIcalTermin(t: Termin, veranstalter: Map<string, Veranstalter>): IcalTermin | null {
  const v = veranstalter.get(t.veranstalter_id);
  if (!v) return null;
  return { ...t, veranstalterName: v.name };
}

/** Basis-URL für Links im Feed: konfigurierte Domain, sonst die der Anfrage. */
export function basisUrl(request: Request): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

// Vercel-CDN: 5 Minuten frisch, danach bis zu 1 Stunde veraltet ausliefern und im Hintergrund erneuern.
export const ICAL_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=3600";
