"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import type { Termin, Veranstalter } from "@/lib/daten";
import { beginnText, datumKurzBereich, monatsName, monatsRaster, monatVon, plusMonate, plusTage } from "@/lib/datum";
import { monatImFenster, VORSCHAU_TAGE, type Fenster } from "@/lib/kalender-fenster";
import { istAktiv, kalenderHref, leseZustand, type Ansicht, type KalenderZustand } from "@/lib/kalender-url";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { AboBox } from "@/components/kalender/abo-box";
import { DetailSheet } from "@/components/kalender/detail-sheet";
import { FilterChips } from "@/components/kalender/filter-chips";
import { KalenderLink } from "@/components/kalender/kalender-link";
import { Listenansicht } from "@/components/kalender/listenansicht";
import { Monatsansicht } from "@/components/kalender/monatsansicht";
import { TerminDetails } from "@/components/kalender/termin-details";

/** Ohne gewählte Ansicht: Monat ab md, Liste darunter (Handy). Klassen ausgeschrieben für Tailwind. */
const SICHTBAR = {
  block: { monat: "hidden md:block", liste: "block md:hidden" },
  flex: { monat: "hidden md:flex", liste: "flex md:hidden" },
} as const;

function sichtbarkeit(ansicht: Ansicht | null, art: Ansicht, display: "block" | "flex" = "block") {
  if (ansicht === art) return display;
  if (ansicht) return "hidden";
  return SICHTBAR[display][art];
}

const navButton =
  "flex size-11 items-center justify-center rounded-control border border-line-input bg-surface text-ink hover:bg-accent-hover hover:text-ink";

function Umschalter({ aktiv, zustand }: { aktiv: Ansicht; zustand: KalenderZustand }) {
  const knopf = (art: Ansicht, label: string) => (
    <KalenderLink
      href={kalenderHref(zustand, { ansicht: art })}
      aria-current={aktiv === art ? "true" : undefined}
      className={`inline-flex min-h-10 items-center rounded-[9px] px-4 text-[15px] font-semibold no-underline ${
        aktiv === art
          ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:text-ink"
          : "text-muted-strong hover:text-ink"
      }`}
    >
      {label}
    </KalenderLink>
  );
  return (
    <nav aria-label="Ansicht" className="flex gap-1 rounded-xl bg-toggle p-1">
      {knopf("monat", "Monat")}
      {knopf("liste", "Nächste Termine")}
    </nav>
  );
}

/**
 * Öffentlicher Kalender. Der Zustand (Filter, Ansicht, Monat, Termin) steht in der URL;
 * alle Termine im `fenster` sind schon geladen, sodass Klicks ohne Serveranfrage umschalten.
 * Nur ein Monat außerhalb des Fensters wird beim Server nachgeladen.
 */
export function KalenderAnsicht({
  veranstalterListe,
  termine,
  fenster,
  heute,
  einzelTermin,
  bearbeiter,
}: {
  veranstalterListe: Veranstalter[];
  termine: Termin[];
  fenster: Fenster;
  heute: string;
  /** per Link geöffneter Termin außerhalb des Fensters */
  einzelTermin: Termin | null;
  /** angemeldeter Veranstalter bzw. Admin: darf eigene Termine direkt bearbeiten */
  bearbeiter: { istAdmin: boolean; veranstalterId: string | null } | null;
}) {
  const router = useRouter();
  const [laedt, startTransition] = useTransition();
  const veranstalter = new Map(veranstalterListe.map((v) => [v.id, v]));
  const zustand = leseZustand(Object.fromEntries(useSearchParams()), veranstalterListe.map((v) => v.id));

  const monat = zustand.monat ?? monatVon(heute);
  const raster = monatsRaster(monat);
  const abgedeckt = monatImFenster(monat, fenster);
  const href = kalenderHref(zustand);

  useEffect(() => {
    // Monat außerhalb des Fensters: Server rendert mit der aktuellen URL ein passendes Fenster.
    if (!abgedeckt) startTransition(() => router.replace(href, { scroll: false }));
  }, [abgedeckt, href, router]);

  const sichtbar = (t: Termin) => veranstalter.has(t.veranstalter_id) && istAktiv(zustand.filter, t.veranstalter_id);
  const ueberschneidet = (t: Termin, von: string, bis: string) => t.datum <= bis && (t.bis_datum ?? t.datum) >= von;
  const monatsTermine = termine.filter((t) => sichtbar(t) && ueberschneidet(t, raster[0].tag, raster.at(-1)!.tag));
  const naechste = termine.filter((t) => sichtbar(t) && ueberschneidet(t, heute, plusTage(heute, VORSCHAU_TAGE)));

  const gewaehlt = zustand.termin
    ? (termine.find((t) => t.id === zustand.termin) ?? (einzelTermin?.id === zustand.termin ? einzelTermin : null))
    : null;
  const gewaehltV = gewaehlt ? veranstalter.get(gewaehlt.veranstalter_id) : undefined;
  const schliessenHref = kalenderHref(zustand, { termin: null });
  const beschaeftigt = laedt || !abgedeckt;
  const darfBearbeiten =
    !!gewaehlt && !!bearbeiter && (bearbeiter.istAdmin || bearbeiter.veranstalterId === gewaehlt.veranstalter_id);

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-[18px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`${sichtbarkeit(zustand.ansicht, "monat", "flex")} flex-wrap items-center gap-2`}>
          <KalenderLink
            href={kalenderHref(zustand, { monat: plusMonate(monat, -1), termin: null })}
            aria-label="Vorheriger Monat"
            className={navButton}
          >
            <ChevronLeftIcon className="size-[18px]" />
          </KalenderLink>
          <h1 className="mx-1 min-w-[150px] text-center font-display text-2xl font-bold sm:mx-1.5 sm:min-w-[210px] sm:text-[28px]" aria-live="polite">
            {monatsName(monat)}
          </h1>
          <KalenderLink
            href={kalenderHref(zustand, { monat: plusMonate(monat, 1), termin: null })}
            aria-label="Nächster Monat"
            className={navButton}
          >
            <ChevronRightIcon className="size-[18px]" />
          </KalenderLink>
          <KalenderLink
            href={kalenderHref(zustand, { monat: null, termin: null })}
            className="inline-flex min-h-11 items-center rounded-control border border-line-input bg-surface px-3 text-[15px] sm:px-4 font-semibold text-ink no-underline hover:bg-accent-hover hover:text-ink"
          >
            Heute
          </KalenderLink>
        </div>
        <h1 className={`${sichtbarkeit(zustand.ansicht, "liste")} font-display text-[28px] font-bold`}>
          Nächste Veranstaltungen
        </h1>
        {zustand.ansicht ? (
          <Umschalter aktiv={zustand.ansicht} zustand={zustand} />
        ) : (
          <>
            <div className="hidden md:block">
              <Umschalter aktiv="monat" zustand={zustand} />
            </div>
            <div className="md:hidden">
              <Umschalter aktiv="liste" zustand={zustand} />
            </div>
          </>
        )}
      </div>

      <FilterChips veranstalter={veranstalterListe} zustand={zustand} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-label="Kalender"
          aria-busy={beschaeftigt || undefined}
          className="relative min-w-0 overflow-hidden rounded-card border border-line bg-surface"
        >
          <div className={sichtbarkeit(zustand.ansicht, "monat")}>
            <Monatsansicht
              monat={monat}
              heute={heute}
              termine={monatsTermine}
              veranstalter={veranstalter}
              zustand={zustand}
            />
          </div>
          <div className={sichtbarkeit(zustand.ansicht, "liste")}>
            <Listenansicht termine={naechste} veranstalter={veranstalter} zustand={zustand} />
          </div>
          {beschaeftigt && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <span aria-hidden="true" className="size-8 animate-spin rounded-full border-[3px] border-line border-t-accent" />
              <span className="sr-only">Termine werden geladen …</span>
            </div>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          {gewaehlt && gewaehltV && (
            <DetailSheet key={gewaehlt.id} schliessenHref={schliessenHref} titelId="termin-titel">
              <TerminDetails
                termin={gewaehlt}
                veranstalter={gewaehltV}
                titelId="termin-titel"
                bearbeiten={darfBearbeiten ? { zurueck: schliessenHref } : undefined}
                schliessen={
                  <KalenderLink
                    href={schliessenHref}
                    aria-label="Details schließen"
                    className="flex size-10 shrink-0 items-center justify-center rounded-control bg-bg text-ink hover:bg-line hover:text-ink"
                  >
                    <CloseIcon className="size-4" />
                  </KalenderLink>
                }
              />
              <Link href={`/termin/${gewaehlt.id}`} className="mt-3 block text-center text-sm">
                Link zu diesem Termin
              </Link>
            </DetailSheet>
          )}

          <div className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-5">
            <h2 className="mb-2 font-display text-[19px] font-bold">Demnächst</h2>
            {naechste.length === 0 && <p className="text-sm text-muted">Keine anstehenden Termine.</p>}
            <ul className="flex flex-col gap-1.5">
              {naechste.slice(0, 5).map((t) => {
                const v = veranstalter.get(t.veranstalter_id)!;
                return (
                  <li key={t.id}>
                    <KalenderLink
                      href={kalenderHref(zustand, { termin: t.id })}
                      className="-mx-2 flex min-h-[52px] items-center gap-3 rounded-control p-2 text-ink no-underline hover:bg-accent-hover hover:text-ink"
                    >
                      <span aria-hidden="true" className="w-1 shrink-0 self-stretch rounded" style={{ background: v.farbe }} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[15px] font-semibold">{t.titel}</span>
                        <span className="text-[13px] text-muted">
                          {datumKurzBereich(t.datum, t.bis_datum)} · {beginnText(t.beginn)} · {v.name}
                        </span>
                      </span>
                    </KalenderLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <AboBox filter={zustand.filter} />
        </aside>
      </div>
    </main>
  );
}
