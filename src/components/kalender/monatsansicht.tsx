import Link from "next/link";
import type { Termin, Veranstalter } from "@/lib/daten";
import { monatsRaster, tagesNummer, uhrzeit, WOCHENTAGE_KOPF, type Monat } from "@/lib/datum";
import { kalenderHref, type KalenderZustand } from "@/lib/kalender-url";

const MAX_PRO_TAG = 3;

export function Monatsansicht({
  monat,
  heute,
  termine,
  veranstalter,
  zustand,
}: {
  monat: Monat;
  heute: string;
  termine: Termin[];
  veranstalter: Map<string, Veranstalter>;
  zustand: KalenderZustand;
}) {
  const proTag = new Map<string, Termin[]>();
  for (const t of termine) proTag.set(t.datum, [...(proTag.get(t.datum) ?? []), t]);
  const raster = monatsRaster(monat);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line bg-surface-muted" aria-hidden="true">
        {WOCHENTAGE_KOPF.map((w) => (
          <div key={w} className="px-1.5 py-2.5 text-[13px] font-bold tracking-[0.04em] text-muted uppercase sm:px-2.5">
            {w}
          </div>
        ))}
      </div>
      <ol className="grid grid-cols-7">
        {raster.map(({ tag, imMonat }, i) => {
          const tagesTermine = proTag.get(tag) ?? [];
          const istHeute = tag === heute;
          return (
            <li
              key={tag}
              className={`flex min-h-16 min-w-0 flex-col gap-1 border-b border-line-soft p-1 sm:min-h-[118px] sm:p-1.5 ${
                i % 7 === 6 ? "" : "border-r"
              } ${imMonat ? "bg-surface" : "bg-surface-muted"}`}
            >
              <div
                className={
                  istHeute
                    ? "flex size-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white"
                    : `flex h-7 items-center pl-1 text-sm font-semibold ${imMonat ? "text-ink" : "text-[#646D67]"}`
                }
              >
                <span className="sr-only">{istHeute ? "Heute, " : ""}</span>
                {tagesNummer(tag)}
              </div>
              <div className="flex flex-col gap-[3px]">
                {tagesTermine.slice(0, MAX_PRO_TAG).map((t) => {
                  const v = veranstalter.get(t.veranstalter_id);
                  if (!v) return null;
                  const ausgewaehlt = zustand.termin === t.id;
                  return (
                    <Link
                      key={t.id}
                      href={kalenderHref(zustand, { termin: t.id })}
                      scroll={false}
                      aria-label={`${t.titel}, ${uhrzeit(t.beginn)} Uhr, ${v.name}`}
                      aria-current={ausgewaehlt ? "true" : undefined}
                      className="block w-full truncate rounded-md px-1.5 py-1 text-left text-xs leading-[1.3] font-medium no-underline"
                      style={{
                        background: v.farbe_hg,
                        color: v.farbe,
                        boxShadow: ausgewaehlt ? `inset 0 0 0 2px ${v.farbe}` : undefined,
                      }}
                    >
                      <span className="text-[11px] font-bold sm:text-xs">{uhrzeit(t.beginn)}</span>
                      <span className="hidden sm:inline"> {t.titel}</span>
                    </Link>
                  );
                })}
                {tagesTermine.length > MAX_PRO_TAG && (
                  <span className="pl-1 text-xs text-muted">
                    +{tagesTermine.length - MAX_PRO_TAG} weitere
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
