import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { erfolgBox, fehlerBox } from "@/components/formular/stile";
import { PencilIcon } from "@/components/icons";
import { VeranstalterTag } from "@/components/kalender/veranstalter-tag";
import { getTermin, getTermineZwischen, getVeranstalter } from "@/lib/daten";
import { beginnText, datumKurzBereich, heute, plusTage } from "@/lib/datum";
import { getSitzung } from "@/lib/sitzung";
import { LoeschenKnopf } from "@/app/verwaltung/loeschen-knopf";
import { TerminFormular } from "@/app/verwaltung/termin-formular";

export const metadata: Metadata = { title: "Termine pflegen" };

const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);

async function VerwaltungInhalt({ searchParams }: { searchParams: PageProps<"/verwaltung">["searchParams"] }) {
  const sitzung = await getSitzung();
  if (!sitzung) redirect("/login?weiter=/verwaltung");

  const params = await searchParams;
  const bearbeitenId = erster(params.bearbeiten);
  const [veranstalterListe, bearbeiten] = await Promise.all([
    getVeranstalter(),
    bearbeitenId ? getTermin(bearbeitenId) : Promise.resolve(null),
  ]);
  const veranstalter = new Map(veranstalterListe.map((v) => [v.id, v]));

  const darfBearbeiten = (veranstalterId: string) =>
    sitzung.istAdmin || sitzung.veranstalter?.id === veranstalterId;
  const termin = bearbeiten && darfBearbeiten(bearbeiten.veranstalter_id) ? bearbeiten : null;

  const ab = heute();
  const termine = (await getTermineZwischen(ab, plusTage(ab, 730))).filter((t) => darfBearbeiten(t.veranstalter_id));

  const meldung = erster(params.gespeichert)
    ? { art: "ok", text: "Termin gespeichert – er ist ab sofort im öffentlichen Kalender sichtbar." }
    : erster(params.geloescht)
      ? { art: "ok", text: "Termin gelöscht." }
      : erster(params.fehler)
        ? { art: "fehler", text: "Der Termin konnte nicht gelöscht werden." }
        : bearbeitenId && !termin
          ? { art: "fehler", text: "Dieser Termin kann hier nicht bearbeitet werden." }
          : null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[26px] font-bold sm:text-[30px]">Termine – {sitzung.anzeigename}</h1>
      {meldung && (
        <p role={meldung.art === "ok" ? "status" : "alert"} className={meldung.art === "ok" ? erfolgBox : fehlerBox}>
          {meldung.text}
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-labelledby="formular-titel"
          className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="formular-titel" className="font-display text-[21px] font-bold">
            {termin ? "Termin bearbeiten" : "Neuer Termin"}
          </h2>
          <TerminFormular
            key={termin?.id ?? "neu"}
            termin={termin}
            eigenerVeranstalter={sitzung.veranstalter?.id ?? ""}
            veranstalterAuswahl={
              sitzung.istAdmin ? veranstalterListe.map(({ id, name }) => ({ id, name })) : null
            }
          />
        </section>

        <aside className="flex min-w-0 flex-col gap-1 rounded-card border border-line bg-surface p-5 sm:p-[22px]">
          <h2 className="mb-2.5 font-display text-[19px] font-bold">
            {sitzung.istAdmin ? "Alle Termine" : "Eure Termine"}
          </h2>
          {termine.length === 0 ? (
            <div className="flex flex-col gap-0.5 border-t border-[#EEF1EF] py-2.5">
              <span className="text-[15px] font-semibold">Noch keine Termine</span>
              <span className="text-[13px] text-muted">Leg oben deinen ersten Termin an.</span>
            </div>
          ) : (
            <ul>
              {termine.map((t) => {
                const v = veranstalter.get(t.veranstalter_id);
                return (
                  <li
                    key={t.id}
                    className={`flex flex-wrap items-center gap-3 border-t border-[#EEF1EF] py-2.5 ${
                      termin?.id === t.id ? "bg-accent-hover" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{t.titel}</span>
                      <span className="text-[13px] text-muted">
                        {datumKurzBereich(t.datum, t.bis_datum)} · {beginnText(t.beginn)}{t.ort ? ` · ${t.ort}` : ""}
                      </span>
                      {sitzung.istAdmin && v && (
                        <span className="mt-1">
                          <VeranstalterTag v={v} />
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/verwaltung?bearbeiten=${t.id}`}
                      aria-label={`„${t.titel}“ bearbeiten`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink hover:bg-accent-hover hover:text-ink"
                    >
                      <PencilIcon className="size-[18px]" />
                    </Link>
                    <LoeschenKnopf id={t.id} titel={t.titel} />
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function VerwaltungPage(props: PageProps<"/verwaltung">) {
  return (
    <main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-card bg-surface" />}>
        <VerwaltungInhalt searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
