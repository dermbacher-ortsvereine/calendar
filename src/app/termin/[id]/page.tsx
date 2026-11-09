import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTermin, getVeranstalter, TAG_TERMINE, TAG_VERANSTALTER } from "@/lib/daten";
import { datumLangBereich, zeitraumText } from "@/lib/datum";
import { ChevronLeftIcon } from "@/components/icons";
import { TerminDetailsSeite } from "@/components/kalender/termin-details-seite";

/**
 * Mindestens ein Parameter ist mit Cache Components Pflicht. Termine werden beim ersten Aufruf
 * erzeugt und danach aus dem Cache ausgeliefert (ISR); der Platzhalter ergibt nur „nicht gefunden“.
 */
export function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

/** Für alle Besucher gleich (ohne Login), damit die Seite gecacht werden kann. */
async function terminSeite(id: string) {
  "use cache";
  cacheLife("seiten");
  cacheTag(TAG_TERMINE, TAG_VERANSTALTER);
  const [termin, veranstalter] = await Promise.all([getTermin(id), getVeranstalter()]);
  const v = termin && veranstalter.find((x) => x.id === termin.veranstalter_id);
  return termin && v ? { termin, veranstalter: v } : null;
}

export async function generateMetadata(props: PageProps<"/termin/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const daten = await terminSeite(id);
  if (!daten) return { title: "Termin nicht gefunden" };
  const { termin } = daten;
  return {
    title: termin.titel,
    description: `${datumLangBereich(termin.datum, termin.bis_datum)}, ${zeitraumText(termin.beginn, termin.ende)}${
      termin.ort ? ` · ${termin.ort}` : ""
    }`,
  };
}

async function TerminInhalt({ params }: { params: PageProps<"/termin/[id]">["params"] }) {
  const { id } = await params;
  const daten = await terminSeite(id);
  if (!daten) notFound();
  return (
    <div className="rounded-card border border-line bg-surface p-[22px]">
      <TerminDetailsSeite termin={daten.termin} veranstalter={daten.veranstalter} />
    </div>
  );
}

export default function TerminPage(props: PageProps<"/termin/[id]">) {
  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 py-6 sm:px-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold">
        <ChevronLeftIcon className="size-[18px]" />
        Zum Kalender
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface" />}>
        <TerminInhalt params={props.params} />
      </Suspense>
    </main>
  );
}
