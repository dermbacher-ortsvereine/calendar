import Link from "next/link";
import type { Termin, Veranstalter } from "@/lib/daten";
import { beginnText, datumKurzBereich, monatsRaster, tagesNummer, uhrzeit, WOCHENTAGE_KOPF, type Monat } from "@/lib/datum";
import { kalenderHref, type KalenderZustand } from "@/lib/kalender-url";
import { wochenBalken } from "@/lib/wochen-balken";

const MAX_SPUREN = 3;

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
  const raster = monatsRaster(monat);
  const wochen = Array.from({ length: raster.length / 7 }, (_, i) => raster.slice(i * 7, i * 7 + 7));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line bg-surface-muted" aria-hidden="true">
        {WOCHENTAGE_KOPF.map((w) => (
          <div key={w} className="px-1.5 py-2.5 text-[13px] font-bold tracking-[0.04em] text-muted uppercase sm:px-2.5">
            {w}
          </div>
        ))}
      </div>
      {wochen.map((woche) => {
        // Mehrtägige Termine laufen als durchgehender Balken über ihre Tage (pro Woche ein Abschnitt).
        const { balken, weitere } = wochenBalken(
          woche.map((t) => t.tag),
          termine,
          MAX_SPUREN,
        );
        const spuren = Math.max(0, ...balken.map((b) => b.spur + 1));
        return (
          <div
            key={woche[0].tag}
            className="grid min-h-16 grid-cols-7 gap-y-[3px] sm:min-h-[118px]"
            style={{ gridTemplateRows: `auto repeat(${spuren}, auto) auto minmax(0.25rem, 1fr)` }}
          >
            {woche.map(({ tag, imMonat }, i) => (
              <div
                key={`hg-${tag}`}
                className={`border-b border-line-soft ${i === 6 ? "" : "border-r"} ${imMonat ? "bg-surface" : "bg-surface-muted"}`}
                style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
              />
            ))}
            {woche.map(({ tag, imMonat }, i) => {
              const istHeute = tag === heute;
              return (
                <div key={`nr-${tag}`} className="px-1 pt-1 pb-[1px] sm:px-1.5 sm:pt-1.5" style={{ gridColumn: i + 1, gridRow: 1 }}>
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
                </div>
              );
            })}
            {balken.map(({ termin: t, start, spanne, spur, weiterVorher, weiterNachher }) => {
              const v = veranstalter.get(t.veranstalter_id);
              if (!v) return null;
              const ausgewaehlt = zustand.termin === t.id;
              // Uhrzeit nur, wo der Termin beginnt; sonst (ganztägig, Fortsetzung) das Kürzel, damit am Handy etwas lesbar bleibt
              const kurz = t.beginn && !weiterVorher ? uhrzeit(t.beginn) : v.kuerzel;
              return (
                <Link
                  key={t.id}
                  href={kalenderHref(zustand, { termin: t.id })}
                  scroll={false}
                  aria-label={`${t.titel}, ${datumKurzBereich(t.datum, t.bis_datum)}, ${beginnText(t.beginn)}, ${v.name}`}
                  aria-current={ausgewaehlt ? "true" : undefined}
                  className={`relative block min-w-0 truncate px-1.5 py-1 text-left text-xs leading-[1.3] font-medium no-underline ${
                    weiterVorher ? "rounded-l-none" : "ml-1 rounded-l-md sm:ml-1.5"
                  } ${weiterNachher ? "rounded-r-none" : "mr-1 rounded-r-md sm:mr-1.5"}`}
                  style={{
                    gridColumn: `${start + 1} / span ${spanne}`,
                    gridRow: spur + 2,
                    background: v.farbe_hg,
                    color: v.farbe,
                    boxShadow: ausgewaehlt ? `inset 0 0 0 2px ${v.farbe}` : undefined,
                  }}
                >
                  <span className="text-[11px] font-bold sm:text-xs">{kurz}</span>
                  <span className="hidden sm:inline"> {t.titel}</span>
                </Link>
              );
            })}
            {weitere.map((anzahl, i) =>
              anzahl > 0 ? (
                <span
                  key={`mehr-${woche[i].tag}`}
                  className="relative px-1 text-xs text-muted sm:px-1.5"
                  style={{ gridColumn: i + 1, gridRow: spuren + 2 }}
                >
                  <span className="pl-1">+{anzahl} weitere</span>
                </span>
              ) : null,
            )}
          </div>
        );
      })}
    </div>
  );
}
