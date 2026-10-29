import type { ReactNode } from "react";
import type { Termin, Veranstalter } from "@/lib/daten";
import { datumLangBereich, zeitraumText } from "@/lib/datum";
import { CalendarIcon, ClockIcon, DownloadIcon, PinIcon } from "@/components/icons";
import { VeranstalterLogo, VeranstalterTag } from "@/components/kalender/veranstalter-tag";

function Zeile({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

/** Inhalt der Detailansicht (rechte Spalte, Bottom-Sheet und /termin/[id]). */
export function TerminDetails({
  termin,
  veranstalter,
  titelId,
  schliessen,
  ueberschrift = "h2",
}: {
  termin: Termin;
  veranstalter: Veranstalter;
  titelId?: string;
  schliessen?: ReactNode;
  ueberschrift?: "h1" | "h2";
}) {
  const Titel = ueberschrift;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <VeranstalterLogo v={veranstalter} />
          <VeranstalterTag v={veranstalter} />
        </span>
        {schliessen}
      </div>
      <Titel id={titelId} className="font-display text-2xl leading-tight font-bold">
        {termin.titel}
      </Titel>
      <div className="flex flex-col gap-2.5 text-[15px]">
        <Zeile icon={<CalendarIcon className="size-[18px]" />}>{datumLangBereich(termin.datum, termin.bis_datum)}</Zeile>
        <Zeile icon={<ClockIcon className="size-[18px]" />}>
          {zeitraumText(termin.beginn, termin.ende)}
        </Zeile>
        {termin.ort && <Zeile icon={<PinIcon className="size-[18px]" />}>{termin.ort}</Zeile>}
      </div>
      {termin.beschreibung && (
        <p className="text-[15px] leading-normal whitespace-pre-line text-ink-soft">
          {termin.beschreibung}
        </p>
      )}
      {termin.ansprechpartner && (
        <div className="border-t border-line-soft pt-3 text-sm text-muted">
          Ansprechpartner: {termin.ansprechpartner}
        </div>
      )}
      <a
        href={`/api/ical/${termin.id}`}
        download
        className="flex min-h-11 items-center justify-center gap-2 rounded-control border border-accent bg-surface text-[15px] font-semibold text-accent no-underline hover:bg-accent-hover"
      >
        <DownloadIcon className="size-[18px]" />
        In meinen Kalender (.ics)
      </a>
    </div>
  );
}
