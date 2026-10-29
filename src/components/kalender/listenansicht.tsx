import Link from "next/link";
import type { Termin, Veranstalter } from "@/lib/daten";
import { datumKurz, monatsName, monatVon, tagesNummer, wochentagKurz, zeitraumText } from "@/lib/datum";
import { kalenderHref, type KalenderZustand } from "@/lib/kalender-url";
import { VeranstalterTag } from "@/components/kalender/veranstalter-tag";

export function Listenansicht({
  termine,
  veranstalter,
  zustand,
}: {
  termine: Termin[];
  veranstalter: Map<string, Veranstalter>;
  zustand: KalenderZustand;
}) {
  if (termine.length === 0) {
    return <p className="px-5 py-6 text-muted">Keine anstehenden Termine für diese Auswahl.</p>;
  }

  const gruppen: { monat: string; termine: Termin[] }[] = [];
  for (const t of termine) {
    const m = monatVon(t.datum);
    const letzte = gruppen.at(-1);
    if (letzte?.monat === m) letzte.termine.push(t);
    else gruppen.push({ monat: m, termine: [t] });
  }

  return (
    <div className="py-2">
      {gruppen.map((g) => (
        <section key={g.monat} aria-labelledby={`monat-${g.monat}`}>
          <h2
            id={`monat-${g.monat}`}
            className="px-5 pt-4 pb-1.5 font-display text-lg font-bold text-accent"
          >
            {monatsName(g.monat)}
          </h2>
          <ul>
            {g.termine.map((t) => {
              const v = veranstalter.get(t.veranstalter_id);
              if (!v) return null;
              const ausgewaehlt = zustand.termin === t.id;
              return (
                <li key={t.id}>
                  <Link
                    href={kalenderHref(zustand, { termin: t.id })}
                    scroll={false}
                    aria-current={ausgewaehlt ? "true" : undefined}
                    className={`flex w-full items-center gap-4 border-t border-[#EEF1EF] px-4 py-3 text-left sm:px-5 text-ink no-underline hover:bg-accent-hover hover:text-ink ${
                      ausgewaehlt ? "bg-accent-hover" : "bg-surface"
                    }`}
                  >
                    <span className="w-14 shrink-0 rounded-control bg-bg py-1.5 text-center">
                      <span className="block text-xs font-bold text-muted uppercase">
                        {wochentagKurz(t.datum)}
                      </span>
                      <span className="block font-display text-2xl leading-[1.1] font-bold">
                        {tagesNummer(t.datum)}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[17px] font-bold">{t.titel}</span>
                      <span className="text-sm text-muted">
                        {t.bis_datum ? `bis ${datumKurz(t.bis_datum)} · ` : ""}
                        {zeitraumText(t.beginn, t.ende)}
                        {t.ort ? ` · ${t.ort}` : ""}
                      </span>
                      <span className="sm:hidden">
                        <VeranstalterTag v={v} />
                      </span>
                    </span>
                    <span className="hidden sm:inline">
                      <VeranstalterTag v={v} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
