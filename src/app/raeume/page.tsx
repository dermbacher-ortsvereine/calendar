import type { Metadata } from "next";
import { io } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { erfolgBox, fehlerBox, primaerKnopf } from "@/components/formular/stile";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, PencilIcon } from "@/components/icons";
import { getBelegung, getRaeume, getVeranstalter, type Belegung, type Veranstalter } from "@/lib/daten";
import { datumKurz, heute, plusTage, tagMonat, wochentagLang } from "@/lib/datum";
import { inBerlin, parseZeitraum, sperrTage, wochenMontag } from "@/lib/reservierung";
import { darfSchreiben, veranstalterAuswahl } from "@/lib/rechte";
import { getSitzung, type Sitzung } from "@/lib/sitzung";
import { createSessionClient } from "@/lib/supabase/server";
import { ReservierungFormular } from "@/app/raeume/reservierung-formular";
import { SperreFormular } from "@/app/raeume/sperre-formular";
import { StornierenKnopf } from "@/app/raeume/stornieren-knopf";

export const metadata: Metadata = { title: "Räume" };

const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);
const istTag = (w: string | undefined): w is string => !!w && /^\d{4}-\d{2}-\d{2}$/.test(w);

/** `sperre`: Admin hat im Formularbereich „Sperren“ gewählt */
type Zustand = { raum: string; woche: string; datum: string | null; bearbeiten: string | null; sperre: boolean };

function raeumeHref(z: Zustand, aenderung: Partial<Zustand> = {}, hash = "") {
  const n = { ...z, ...aenderung };
  const q = new URLSearchParams({ raum: n.raum, woche: n.woche });
  if (n.datum) q.set("datum", n.datum);
  if (n.bearbeiten) q.set("bearbeiten", n.bearbeiten);
  if (n.sperre) q.set("sperre", "1");
  return `/raeume?${q}${hash}`;
}

type Eintrag = {
  id: string;
  raumId: string;
  tag: string;
  zeit: string;
  start: number;
  v: Veranstalter | undefined;
  /** wer eingetragen hat, falls nicht der Veranstalter selbst (z. B. bei „Ortsvereine Dermbach“) */
  eingetragenVon: Veranstalter | undefined;
  /** Sperre durch den Admin; `zweck` ist der Hinweis, `zeit` beschreibt die gesperrten Tage */
  gesperrt: boolean;
  zweck: string | null;
};

function eintraege(belegung: Belegung[], veranstalter: Map<string, Veranstalter>, montag: string): Eintrag[] {
  const sonntag = plusTage(montag, 6);
  return belegung
    .flatMap((b) => {
      const z = parseZeitraum(b.zeitraum);
      if (!z) return [];
      if (b.gesperrt) {
        // An jedem gesperrten Tag dieser Woche zeigen
        const t = sperrTage(z);
        const zeit = t.von === t.bis ? "Ganztägig" : `${tagMonat(t.von)} – ${tagMonat(t.bis)}`;
        const tage: string[] = [];
        for (let tag = t.von < montag ? montag : t.von; tag <= t.bis && tag <= sonntag; tag = plusTage(tag, 1)) tage.push(tag);
        return tage.map((tag) => ({
          id: b.id,
          raumId: b.raum_id,
          tag,
          zeit,
          start: z.start.getTime(),
          v: undefined,
          eingetragenVon: undefined,
          gesperrt: true,
          zweck: b.zweck,
        }));
      }
      const s = inBerlin(z.start);
      const e = inBerlin(z.ende);
      return [
        {
          id: b.id,
          raumId: b.raum_id,
          tag: s.datum < montag ? montag : s.datum, // über Mitternacht in die Woche hinein: am Montag zeigen
          zeit: `${s.zeit}–${e.zeit}`,
          start: z.start.getTime(),
          v: veranstalter.get(b.veranstalter_id ?? ""),
          eingetragenVon: b.eingetragen_von && b.eingetragen_von !== b.veranstalter_id ? veranstalter.get(b.eingetragen_von) : undefined,
          gesperrt: false,
          zweck: b.zweck,
        },
      ];
    })
    .sort((a, b) => a.start - b.start);
}

// 32 px sichtbar, Klickfläche per ::after auf 44 px vergrößert
const eintragKnopf =
  "relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface/70 after:absolute after:-inset-1.5 hover:bg-surface";

const darfAendern = (sitzung: Sitzung | null, b: Eintrag) =>
  !!sitzung && (sitzung.istAdmin || (!b.gesperrt && darfSchreiben(sitzung, b.v?.id)));

const navKnopf =
  "flex size-11 items-center justify-center rounded-control border border-line-input bg-surface text-ink hover:bg-accent-hover hover:text-ink";

async function RaeumeInhalt({ searchParams }: { searchParams: PageProps<"/raeume">["searchParams"] }) {
  const params = await searchParams;
  const [raeume, veranstalterListe, sitzung] = await Promise.all([getRaeume(), getVeranstalter(), getSitzung()]);
  const veranstalter = new Map(veranstalterListe.map((v) => [v.id, v]));

  await io(); // "heute" erst zur Anfragezeit bestimmen, nicht beim Prerendern
  const heuteTag = heute();
  const wocheParam = erster(params.woche);
  const montag = wochenMontag(istTag(wocheParam) ? wocheParam : heuteTag);
  const raumParam = erster(params.raum);
  const raum = raeume.find((r) => r.id === raumParam) ?? raeume[0];
  const datumParam = erster(params.datum);
  const bearbeitenParam = erster(params.bearbeiten);
  const zustand: Zustand = {
    raum: raum.id,
    woche: montag,
    datum: istTag(datumParam) ? datumParam : null,
    bearbeiten: sitzung && bearbeitenParam ? bearbeitenParam : null,
    sperre: !!sitzung?.istAdmin && erster(params.sperre) === "1",
  };
  const meldung = erster(params.reserviert)
    ? { ok: true, text: "Reservierung eingetragen – sie erscheint jetzt im Belegungsplan." }
    : erster(params.geaendert)
      ? { ok: true, text: "Reservierung geändert." }
      : erster(params.storniert)
        ? { ok: true, text: "Reservierung storniert." }
        : erster(params.gesperrt)
          ? { ok: true, text: "Raum gesperrt – an diesen Tagen kann niemand mehr reservieren." }
          : erster(params.entsperrt)
            ? { ok: true, text: "Sperre aufgehoben." }
        : erster(params.fehler)
          ? { ok: false, text: "Die Reservierung konnte nicht storniert werden." }
          : null;

  const belegung = eintraege(await getBelegung(montag, plusTage(montag, 7)), veranstalter, montag);
  const proRaum = (id: string) => belegung.filter((b) => b.raumId === id);
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
  const sonntag = tage[6];

  return (
    <>
      <nav aria-label="Raum wählen" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {raeume.map((r) => {
          const an = r.id === raum.id;
          const n = new Set(proRaum(r.id).map((b) => b.id)).size;
          return (
            <Link
              key={r.id}
              href={raeumeHref(zustand, { raum: r.id, bearbeiten: null })}
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
        <section id="belegung" aria-labelledby="belegung-titel" className="flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 id="belegung-titel" className="font-display text-xl font-bold">
              Belegung {raum.name}
            </h2>
            <div className="flex items-center gap-2">
              <Link href={raeumeHref(zustand, { woche: plusTage(montag, -7), datum: null, bearbeiten: null })} scroll={false} aria-label="Vorherige Woche" className={navKnopf}>
                <ChevronLeftIcon className="size-[18px]" />
              </Link>
              <span className="min-w-[170px] text-center text-[15px] font-bold sm:min-w-[190px]" aria-live="polite">
                {tagMonat(montag)} – {tagMonat(sonntag)} {sonntag.slice(0, 4)}
              </span>
              <Link href={raeumeHref(zustand, { woche: plusTage(montag, 7), datum: null, bearbeiten: null })} scroll={false} aria-label="Nächste Woche" className={navKnopf}>
                <ChevronRightIcon className="size-[18px]" />
              </Link>
            </div>
          </div>
          {meldung && (
            <p role={meldung.ok ? "status" : "alert"} className={meldung.ok ? erfolgBox : fehlerBox}>
              {meldung.text}
            </p>
          )}
          <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tage.map((tag) => {
              const items = proRaum(raum.id).filter((b) => b.tag === tag);
              const istHeute = tag === heuteTag;
              const vorbei = tag < heuteTag;
              const gesperrt = items.some((b) => b.gesperrt);
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
                  {items.map((b) => {
                    const beschreibung = b.gesperrt ? `Sperre ${b.zeit === "Ganztägig" ? datumKurz(b.tag) : b.zeit}` : `Reservierung ${datumKurz(b.tag)}, ${b.zeit} Uhr`;
                    return (
                      <div
                        key={b.id}
                        className={`flex flex-col gap-0.5 rounded-lg p-2 break-words ${
                          zustand.bearbeiten === b.id ? "outline-2 outline-offset-1 outline-current" : ""
                        } ${b.gesperrt ? "border border-[#B9C2BC] bg-[repeating-linear-gradient(135deg,#ECEFED_0_8px,#E2E6E3_8px_16px)] text-ink" : ""}`}
                        style={b.gesperrt ? undefined : { background: b.v?.farbe_hg ?? "#F3F5F3", color: b.v?.farbe ?? "#17201B" }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-x-1.5 gap-y-1">
                          {b.gesperrt ? (
                            <span className="flex items-center gap-1 text-[13px] font-bold">
                              <LockIcon className="size-3.5" />
                              Gesperrt
                            </span>
                          ) : (
                            <span className="text-[13px] font-bold">{b.zeit}</span>
                          )}
                          {darfAendern(sitzung, b) && (
                            <span className="-mt-0.5 -mr-0.5 ml-auto flex gap-1.5">
                              <Link
                                href={raeumeHref(zustand, { bearbeiten: b.id, datum: null, sperre: b.gesperrt }, "#reservieren")}
                                aria-label={`${beschreibung} bearbeiten`}
                                className={`${eintragKnopf} text-current hover:text-current`}
                              >
                                <PencilIcon className="size-4" />
                              </Link>
                              <StornierenKnopf
                                id={b.id}
                                beschreibung={beschreibung}
                                sperre={b.gesperrt}
                                raum={zustand.raum}
                                woche={zustand.woche}
                                className={`${eintragKnopf} text-[#B3261E]`}
                              />
                            </span>
                          )}
                        </div>
                        {b.gesperrt ? (
                          <>
                            {b.zweck && <span className="text-[13px] font-semibold">{b.zweck}</span>}
                            <span className="text-xs text-muted-strong">{b.zeit === "Ganztägig" ? "Ganztägig, keine Reservierung möglich" : `${b.zeit}, keine Reservierung möglich`}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[13px] font-semibold">{b.v?.name ?? "Belegt"}</span>
                            {b.zweck && <span className="text-xs text-muted-strong">{b.zweck}</span>}
                            {b.eingetragenVon && <span className="text-xs text-muted-strong">eingetragen von {b.eingetragenVon.name}</span>}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && <span className="text-[13px] text-muted">Noch frei</span>}
                  {!vorbei && !gesperrt && (
                    <Link
                      href={raeumeHref(zustand, { datum: tag, bearbeiten: null }, "#reservieren")}
                      aria-label={`${raum.name} am ${datumKurz(tag)} ${zustand.sperre ? "sperren" : "reservieren"}`}
                      className="mt-auto flex min-h-10 items-center justify-center rounded-lg border-[1.5px] border-dashed border-[#9FB3A6] text-[13px] font-semibold text-accent no-underline hover:bg-surface"
                    >
                      {zustand.sperre ? "Sperren" : "Reservieren"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <aside id="reservieren" className="flex min-w-0 scroll-mt-4 flex-col gap-3.5 rounded-card border border-line bg-surface p-5 sm:p-[22px]">
          <h2 className="font-display text-xl font-bold">{zustand.sperre
              ? zustand.bearbeiten
                ? "Sperre bearbeiten"
                : "Raum sperren"
              : zustand.bearbeiten
                ? "Reservierung bearbeiten"
                : "Raum reservieren"}</h2>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-control bg-bg" />}>
            <ReservierungBereich zustand={zustand} raeume={raeume.map(({ id, name }) => ({ id, name }))} veranstalterListe={veranstalterListe} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

async function ReservierungBereich({
  zustand,
  raeume,
  veranstalterListe,
}: {
  zustand: Zustand;
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

  // RLS liefert nur eigene und gemeinsame Reservierungen (Admin: alle) – fremde IDs ergeben hier nichts.
  const { data: r } = zustand.bearbeiten
    ? await (await createSessionClient())
        .from("reservierungen")
        .select("id, raum_id, veranstalter_id, zeitraum, zweck, ansprechpartner, telefon, gesperrt")
        .eq("id", zustand.bearbeiten)
        .eq("gesperrt", zustand.sperre)
        .maybeSingle()
    : { data: null };
  const z = r && typeof r.zeitraum === "string" ? parseZeitraum(r.zeitraum) : null;
  const abbrechen = raeumeHref(zustand, { bearbeiten: null }, "#belegung");

  if (zustand.sperre) {
    const t = z && sperrTage(z);
    const sperreBearbeiten =
      r && t ? { id: r.id, abbrechen, werte: { raum_id: r.raum_id, datum: t.von, bis_datum: t.bis === t.von ? "" : t.bis, hinweis: r.zweck ?? "" } } : undefined;
    return (
      <>
        {!zustand.bearbeiten && <FormularWahl zustand={zustand} />}
        {zustand.bearbeiten && !sperreBearbeiten && (
          <p role="alert" className={fehlerBox}>
            Diese Sperre kann hier nicht bearbeitet werden.
          </p>
        )}
        <SperreFormular
          key={`${zustand.raum}-${zustand.datum}-${sperreBearbeiten?.id}`}
          raeume={raeume}
          raumId={zustand.raum}
          datum={zustand.datum ?? ""}
          bearbeiten={sperreBearbeiten}
        />
      </>
    );
  }

  const bearbeiten =
    r && z
      ? {
          id: r.id,
          abbrechen,
          werte: {
            raum_id: r.raum_id,
            datum: inBerlin(z.start).datum,
            von: inBerlin(z.start).zeit,
            bis: inBerlin(z.ende).zeit,
            zweck: r.zweck ?? "",
            ansprechpartner: r.ansprechpartner ?? "",
            telefon: r.telefon ?? "",
            veranstalter_id: r.veranstalter_id ?? "",
          },
        }
      : undefined;

  return (
    <>
      {sitzung.istAdmin && !zustand.bearbeiten && <FormularWahl zustand={zustand} />}
      {zustand.bearbeiten && !bearbeiten && (
        <p role="alert" className={fehlerBox}>
          Diese Reservierung kann hier nicht bearbeitet werden.
        </p>
      )}
      <ReservierungFormular
        key={`${zustand.raum}-${zustand.datum}-${bearbeiten?.id}`}
        raeume={raeume}
        raumId={zustand.raum}
        datum={zustand.datum ?? ""}
        eigenerVeranstalter={sitzung.veranstalter}
        veranstalterAuswahl={veranstalterAuswahl(sitzung, veranstalterListe)}
        bearbeiten={bearbeiten}
      />
    </>
  );
}

/** Nur Admin: zwischen Reservieren und Sperren umschalten. */
function FormularWahl({ zustand }: { zustand: Zustand }) {
  const knopf = (an: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold no-underline ${
      an ? "bg-surface text-ink shadow-[0_1px_3px_rgba(23,32,27,0.12)] hover:text-ink" : "text-muted-strong hover:text-ink"
    }`;
  return (
    <nav aria-label="Reservieren oder sperren" className="flex gap-1 rounded-control bg-bg p-1">
      <Link href={raeumeHref(zustand, { sperre: false }, "#reservieren")} scroll={false} aria-current={!zustand.sperre ? "true" : undefined} className={knopf(!zustand.sperre)}>
        Reservieren
      </Link>
      <Link href={raeumeHref(zustand, { sperre: true }, "#reservieren")} scroll={false} aria-current={zustand.sperre ? "true" : undefined} className={knopf(zustand.sperre)}>
        <LockIcon className="size-4" />
        Sperren
      </Link>
    </nav>
  );
}

export default function RaeumePage(props: PageProps<"/raeume">) {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-[22px] px-4 py-7 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold sm:text-[30px]">Räume in der Mehrzweckhalle</h1>
        <p className="text-base text-muted-strong">Belegung ansehen und einen Raum für eure Veranstaltung reservieren.</p>
      </div>
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-card bg-surface" />}>
        <RaeumeInhalt searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
