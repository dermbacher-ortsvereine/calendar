import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { erfolgBox, fehlerBox, primaerKnopf } from "@/components/formular/stile";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { getBelegung, getRaeume, getVeranstalter, type Belegung, type Veranstalter } from "@/lib/daten";
import { datumKurz, heute, plusTage, tagMonat, wochentagLang } from "@/lib/datum";
import { inBerlin, parseZeitraum, wochenMontag } from "@/lib/reservierung";
import { getSitzung } from "@/lib/sitzung";
import { createSessionClient } from "@/lib/supabase/server";
import { ReservierungFormular } from "@/app/raeume/reservierung-formular";
import { StornierenKnopf } from "@/app/raeume/stornieren-knopf";

export const metadata: Metadata = { title: "Räume" };

type Params = Awaited<PageProps<"/raeume">["searchParams"]>;
const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);
const istTag = (w: string | undefined): w is string => !!w && /^\d{4}-\d{2}-\d{2}$/.test(w);

type Zustand = { raum: string; woche: string; datum: string | null };

function raeumeHref(z: Zustand, aenderung: Partial<Zustand> = {}, hash = "") {
  const n = { ...z, ...aenderung };
  const q = new URLSearchParams({ raum: n.raum, woche: n.woche });
  if (n.datum) q.set("datum", n.datum);
  return `/raeume?${q}${hash}`;
}

type Eintrag = {
  id: string;
  raumId: string;
  tag: string;
  zeit: string;
  start: number;
  v: Veranstalter | undefined;
  zweck: string | null;
};

function eintraege(belegung: Belegung[], veranstalter: Map<string, Veranstalter>, montag: string): Eintrag[] {
  return belegung
    .flatMap((b) => {
      const z = parseZeitraum(b.zeitraum);
      if (!z) return [];
      const s = inBerlin(z.start);
      const e = inBerlin(z.ende);
      return [
        {
          id: b.id,
          raumId: b.raum_id,
          tag: s.datum < montag ? montag : s.datum, // über Mitternacht in die Woche hinein: am Montag zeigen
          zeit: `${s.zeit}–${e.zeit}`,
          start: z.start.getTime(),
          v: veranstalter.get(b.veranstalter_id),
          zweck: b.zweck,
        },
      ];
    })
    .sort((a, b) => a.start - b.start);
}

const navKnopf =
  "flex size-11 items-center justify-center rounded-control border border-line-input bg-surface text-ink hover:bg-accent-hover hover:text-ink";

async function RaeumeInhalt({ searchParams }: { searchParams: PageProps<"/raeume">["searchParams"] }) {
  const params = await searchParams;
  const [raeume, veranstalterListe] = await Promise.all([getRaeume(), getVeranstalter()]);
  const veranstalter = new Map(veranstalterListe.map((v) => [v.id, v]));

  const heuteTag = heute();
  const wocheParam = erster(params.woche);
  const montag = wochenMontag(istTag(wocheParam) ? wocheParam : heuteTag);
  const raumParam = erster(params.raum);
  const raum = raeume.find((r) => r.id === raumParam) ?? raeume[0];
  const datumParam = erster(params.datum);
  const zustand: Zustand = { raum: raum.id, woche: montag, datum: istTag(datumParam) ? datumParam : null };

  const belegung = eintraege(await getBelegung(montag, plusTage(montag, 7)), veranstalter, montag);
  const proRaum = (id: string) => belegung.filter((b) => b.raumId === id);
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
  const sonntag = tage[6];

  return (
    <>
      <nav aria-label="Raum wählen" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {raeume.map((r) => {
          const an = r.id === raum.id;
          const n = proRaum(r.id).length;
          return (
            <Link
              key={r.id}
              href={raeumeHref(zustand, { raum: r.id })}
              scroll={false}
              aria-current={an ? "true" : undefined}
              className={`flex items-center gap-4 rounded-card border-2 bg-surface p-[18px] text-ink no-underline hover:text-ink ${
                an ? "border-accent shadow-[0_2px_8px_rgba(23,32,27,0.08)]" : "border-line hover:border-line-input"
              }`}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#24573A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                  <path d="M14 12h.01" />
                </svg>
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="text-[19px] font-bold">{r.name}</span>
                <span className="text-[13px] font-semibold text-accent">
                  {n === 0 ? "Diese Woche frei" : `${n} ${n === 1 ? "Belegung" : "Belegungen"} in dieser Woche`}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="belegung-titel" className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 id="belegung-titel" className="font-display text-xl font-bold">
              Belegung {raum.name}
            </h2>
            <div className="flex items-center gap-2">
              <Link href={raeumeHref(zustand, { woche: plusTage(montag, -7), datum: null })} scroll={false} aria-label="Vorherige Woche" className={navKnopf}>
                <ChevronLeftIcon className="size-[18px]" />
              </Link>
              <span className="min-w-[170px] text-center text-[15px] font-bold sm:min-w-[190px]" aria-live="polite">
                {tagMonat(montag)} – {tagMonat(sonntag)} {sonntag.slice(0, 4)}
              </span>
              <Link href={raeumeHref(zustand, { woche: plusTage(montag, 7), datum: null })} scroll={false} aria-label="Nächste Woche" className={navKnopf}>
                <ChevronRightIcon className="size-[18px]" />
              </Link>
            </div>
          </div>
          <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tage.map((tag) => {
              const items = proRaum(raum.id).filter((b) => b.tag === tag);
              const istHeute = tag === heuteTag;
              const vorbei = tag < heuteTag;
              return (
                <li
                  key={tag}
                  className={`flex min-w-0 flex-col gap-2 rounded-xl p-3 sm:min-h-[190px] ${
                    istHeute ? "border-[1.5px] border-accent bg-accent-hover" : "border border-line-soft bg-surface-muted"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-[15px] font-bold">
                      {wochentagLang(tag)}
                      {istHeute && <span className="sr-only"> (heute)</span>}
                    </span>
                    <span className="text-[13px] text-muted">{tagMonat(tag)}</span>
                  </div>
                  {items.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col gap-0.5 rounded-lg p-2 break-words"
                      style={{ background: b.v?.farbe_hg ?? "#F3F5F3", color: b.v?.farbe ?? "#17201B" }}
                    >
                      <span className="text-[13px] font-bold">{b.zeit}</span>
                      <span className="text-[13px] font-semibold">{b.v?.name ?? "Belegt"}</span>
                      {b.zweck && <span className="text-xs text-muted-strong">{b.zweck}</span>}
                    </div>
                  ))}
                  {items.length === 0 && <span className="text-[13px] text-muted">Noch frei</span>}
                  {!vorbei && (
                    <Link
                      href={raeumeHref(zustand, { datum: tag }, "#reservieren")}
                      aria-label={`${raum.name} am ${datumKurz(tag)} reservieren`}
                      className="mt-auto flex min-h-10 items-center justify-center rounded-lg border-[1.5px] border-dashed border-[#9FB3A6] text-[13px] font-semibold text-accent no-underline hover:bg-surface"
                    >
                      Reservieren
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <aside id="reservieren" className="flex min-w-0 scroll-mt-4 flex-col gap-3.5 rounded-card border border-line bg-surface p-5 sm:p-[22px]">
          <h2 className="font-display text-xl font-bold">Raum reservieren</h2>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-control bg-bg" />}>
            <ReservierungBereich zustand={zustand} params={params} raeume={raeume.map(({ id, name }) => ({ id, name }))} veranstalterListe={veranstalterListe} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

async function ReservierungBereich({
  zustand,
  params,
  raeume,
  veranstalterListe,
}: {
  zustand: Zustand;
  params: Params;
  raeume: { id: string; name: string }[];
  veranstalterListe: Veranstalter[];
}) {
  const sitzung = await getSitzung();
  const zurueck = raeumeHref(zustand);

  if (!sitzung) {
    // "Reservieren" an einem Tag geklickt: direkt zum Login und danach hierher zurück.
    if (zustand.datum) redirect(`/login?weiter=${encodeURIComponent(zurueck)}`);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[15px] leading-normal text-muted-strong">
          Die Belegung kann jeder sehen. Reservieren können die Veranstalter mit ihrem Zugang.
        </p>
        <Link href={`/login?weiter=${encodeURIComponent(zurueck)}`} className={`${primaerKnopf} no-underline hover:text-white`}>
          Anmelden und reservieren
        </Link>
      </div>
    );
  }

  const supabase = await createSessionClient();
  const { data: eigene } = await supabase
    .from("reservierungen")
    .select("id, raum_id, veranstalter_id, zeitraum, zweck")
    .overlaps("zeitraum", `[${new Date().toISOString()},)`)
    .order("zeitraum")
    .limit(sitzung.istAdmin ? 50 : 20);
  const raumName = new Map(raeume.map((r) => [r.id, r.name]));
  const vName = new Map(veranstalterListe.map((v) => [v.id, v.name]));

  const meldung = erster(params.reserviert)
    ? { ok: true, text: "Reservierung eingetragen – sie erscheint jetzt im Belegungsplan." }
    : erster(params.storniert)
      ? { ok: true, text: "Reservierung storniert." }
      : erster(params.fehler)
        ? { ok: false, text: "Die Reservierung konnte nicht storniert werden." }
        : null;

  return (
    <>
      {meldung && (
        <p role={meldung.ok ? "status" : "alert"} className={meldung.ok ? erfolgBox : fehlerBox}>
          {meldung.text}
        </p>
      )}
      <ReservierungFormular
        key={`${zustand.raum}-${zustand.datum}`}
        raeume={raeume}
        raumId={zustand.raum}
        datum={zustand.datum ?? ""}
        eigenerVeranstalter={sitzung.veranstalter}
        veranstalterAuswahl={sitzung.istAdmin ? veranstalterListe.map(({ id, name }) => ({ id, name })) : null}
      />
      <div className="mt-2 flex flex-col gap-1 border-t border-line pt-4">
        <h3 className="mb-1 text-[15px] font-bold">{sitzung.istAdmin ? "Alle kommenden Reservierungen" : "Eure Reservierungen"}</h3>
        {!eigene?.length && <p className="text-sm text-muted">Keine kommenden Reservierungen.</p>}
        <ul>
          {(eigene ?? []).map((r) => {
            const z = typeof r.zeitraum === "string" ? parseZeitraum(r.zeitraum) : null;
            if (!z) return null;
            const s = inBerlin(z.start);
            const e = inBerlin(z.ende);
            const text = `${raumName.get(r.raum_id) ?? r.raum_id}, ${datumKurz(s.datum)}, ${s.zeit}–${e.zeit} Uhr`;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-2 border-t border-[#EEF1EF] py-2.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{text}</span>
                  <span className="text-[13px] text-muted">
                    {[sitzung.istAdmin ? vName.get(r.veranstalter_id) : null, r.zweck].filter(Boolean).join(" · ") || "Ohne Angabe"}
                  </span>
                </span>
                <StornierenKnopf id={r.id} beschreibung={text} raum={zustand.raum} woche={zustand.woche} />
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default function RaeumePage(props: PageProps<"/raeume">) {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-[22px] px-4 py-7 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold sm:text-[30px]">Räume in der Turnhalle</h1>
        <p className="text-base text-muted-strong">Belegung ansehen und einen Raum für eure Veranstaltung reservieren.</p>
      </div>
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-card bg-surface" />}>
        <RaeumeInhalt searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
