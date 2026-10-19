import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTermin, getVeranstalter } from "@/lib/daten";
import { datumLang, zeitraumText } from "@/lib/datum";
import { ChevronLeftIcon } from "@/components/icons";
import { TerminDetails } from "@/components/kalender/termin-details";

export async function generateMetadata(props: PageProps<"/termin/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const termin = await getTermin(id);
  if (!termin) return { title: "Termin nicht gefunden" };
  return {
    title: termin.titel,
    description: `${datumLang(termin.datum)}, ${zeitraumText(termin.beginn, termin.ende)}${
      termin.ort ? ` · ${termin.ort}` : ""
    }`,
  };
}

async function TerminInhalt({ params }: { params: PageProps<"/termin/[id]">["params"] }) {
  const { id } = await params;
  const [termin, veranstalter] = await Promise.all([getTermin(id), getVeranstalter()]);
  const v = termin && veranstalter.find((x) => x.id === termin.veranstalter_id);
  if (!termin || !v) notFound();
  return (
    <div className="rounded-card border border-line bg-surface p-[22px]">
      <TerminDetails termin={termin} veranstalter={v} ueberschrift="h1" />
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
