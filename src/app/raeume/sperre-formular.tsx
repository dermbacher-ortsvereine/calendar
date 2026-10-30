"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sperren, type SperreZustand } from "@/app/raeume/actions";
import { feldKlasse, fehlerBox, labelKlasse, primaerKnopf, sekundaerKnopf } from "@/components/formular/stile";
import type { SperreEingabe } from "@/lib/reservierung";

const feld = `${feldKlasse} min-h-11 text-[15px]`;

/** Nur für den Admin: Raum für ganze Tage sperren. */
export function SperreFormular({
  raeume,
  raumId,
  datum,
  bearbeiten,
}: {
  raeume: { id: string; name: string }[];
  raumId: string;
  datum: string;
  /** bestehende Sperre ändern; `abbrechen`: Link zurück zum leeren Formular */
  bearbeiten?: { id: string; werte: SperreEingabe; abbrechen: string };
}) {
  const [zustand, aktion, laeuft] = useActionState<SperreZustand, FormData>(sperren, { version: 0 });
  const w: SperreEingabe = zustand.werte ?? bearbeiten?.werte ?? { raum_id: raumId, datum, bis_datum: "", hinweis: "" };
  const f = zustand.feldFehler ?? {};
  const fehler = (k: keyof SperreEingabe) =>
    f[k] ? (
      <span id={`sfehler-${k}`} className="text-sm font-semibold text-[#8C1D17]">
        {f[k]}
      </span>
    ) : null;
  const aria = (k: keyof SperreEingabe) => (f[k] ? { "aria-invalid": true, "aria-describedby": `sfehler-${k}` } : {});
  const rahmen = (k: keyof SperreEingabe) => (f[k] ? " border-2 border-[#B3261E]" : "");

  return (
    <form key={zustand.version} action={aktion} className="flex flex-col gap-3.5" noValidate>
      {bearbeiten && <input type="hidden" name="id" value={bearbeiten.id} />}
      {zustand.fehler && (
        <p role="alert" className={fehlerBox}>
          {zustand.fehler}
        </p>
      )}
      <label className={labelKlasse}>
        Raum
        <select name="raum_id" defaultValue={w.raum_id} className={feld + rahmen("raum_id")} {...aria("raum_id")}>
          {raeume.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {fehler("raum_id")}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelKlasse}>
          Von (Tag)
          <input type="date" name="datum" defaultValue={w.datum} required className={feld + rahmen("datum")} {...aria("datum")} />
          {fehler("datum")}
        </label>
        <label className={labelKlasse}>
          Bis (Tag)
          <input type="date" name="bis_datum" defaultValue={w.bis_datum} className={feld + rahmen("bis_datum")} {...aria("bis_datum")} />
          {fehler("bis_datum")}
        </label>
      </div>
      <label className={labelKlasse}>
        Hinweis
        <input
          type="text"
          name="hinweis"
          defaultValue={w.hinweis}
          required
          placeholder="z. B. Renovierung, Kirmes"
          maxLength={120}
          className={feld + rahmen("hinweis")}
          {...aria("hinweis")}
        />
        {fehler("hinweis")}
      </label>
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={laeuft} className={`${primaerKnopf} flex-1`}>
          {laeuft ? "Wird geprüft …" : bearbeiten ? "Speichern" : "Raum sperren"}
        </button>
        {bearbeiten && (
          <Link href={bearbeiten.abbrechen} scroll={false} className={sekundaerKnopf}>
            Abbrechen
          </Link>
        )}
      </div>
      <p className="text-[13px] leading-[1.45] text-muted">
        Der Raum ist dann ganztägig gesperrt; „Bis“ leer lassen für einen einzelnen Tag. Der Hinweis ist öffentlich sichtbar.
        An gesperrten Tagen kann niemand reservieren.
      </p>
    </form>
  );
}
