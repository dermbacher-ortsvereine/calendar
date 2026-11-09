"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { abmelden, sitzungsInfo } from "@/app/login/actions";
import { hatAnmeldeMarker, setzeSitzung, useSitzungsInfo } from "@/components/sitzung-store";
import { useImBrowser } from "@/lib/im-browser";

/**
 * "Angemeldet: …" und "Abmelden" im Header. Wird erst im Browser ermittelt, damit öffentliche
 * Seiten für alle gleich und damit statisch bleiben. Anonyme Besucher (ohne Hinweis-Cookie) fragen nicht beim Server nach.
 */
export function Anmeldestatus() {
  return useImBrowser() ? <AnmeldestatusImBrowser /> : null;
}

function AnmeldestatusImBrowser() {
  const pathname = usePathname();
  const sitzung = useSitzungsInfo();

  useEffect(() => {
    // Nach jedem Seitenwechsel neu prüfen (Login, Abmelden, abgelaufene Sitzung).
    if (!hatAnmeldeMarker()) {
      setzeSitzung(null);
      return;
    }
    let aktiv = true;
    sitzungsInfo().then(
      (info) => aktiv && setzeSitzung(info),
      () => {},
    );
    return () => {
      aktiv = false;
    };
  }, [pathname]);

  if (!sitzung) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-1 text-sm text-muted-strong">
        Angemeldet: <strong>{sitzung.anzeigename}</strong>
      </span>
      {sitzung.istAdmin && (
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center rounded-control px-4 text-[15px] font-semibold text-ink no-underline hover:bg-accent-hover hover:text-ink"
        >
          Admin
        </Link>
      )}
      <form
        action={async () => {
          setzeSitzung(null);
          await abmelden();
        }}
      >
        <button
          type="submit"
          className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-accent-hover"
        >
          Abmelden
        </button>
      </form>
    </div>
  );
}
