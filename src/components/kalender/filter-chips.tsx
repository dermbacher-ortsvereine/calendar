import Link from "next/link";
import type { Veranstalter } from "@/lib/daten";
import { filterUmschalten, istAktiv, kalenderHref, type KalenderZustand } from "@/lib/kalender-url";

export function FilterChips({
  veranstalter,
  zustand,
}: {
  veranstalter: Veranstalter[];
  zustand: KalenderZustand;
}) {
  const alleIds = veranstalter.map((v) => v.id);
  return (
    <div role="group" aria-labelledby="filter-label" className="flex flex-wrap items-center gap-2">
      <span id="filter-label" className="mr-1 text-sm font-semibold text-muted">
        Veranstalter:
      </span>
      {veranstalter.map((v) => {
        const an = istAktiv(zustand.filter, v.id);
        return (
          <Link
            key={v.id}
            href={kalenderHref(zustand, { filter: filterUmschalten(zustand.filter, v.id, alleIds), termin: null })}
            scroll={false}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm font-semibold no-underline"
            style={
              an
                ? { background: v.farbe_hg, color: v.farbe, borderColor: v.farbe }
                : { background: "#FFFFFF", color: "#56615A", borderColor: "#CBD3CE" }
            }
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ background: an ? v.farbe : "#AEB7B1" }}
            />
            {v.name}
            <span className="sr-only">{an ? " (wird angezeigt)" : " (ausgeblendet)"}</span>
          </Link>
        );
      })}
      {zustand.filter.length > 0 && (
        <Link
          href={kalenderHref(zustand, { filter: [], termin: null })}
          scroll={false}
          className="inline-flex min-h-10 items-center px-3 text-sm font-semibold text-accent underline"
        >
          Alle anzeigen
        </Link>
      )}
    </div>
  );
}
