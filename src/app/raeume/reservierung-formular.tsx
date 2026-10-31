"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reservieren, type ReservierungZustand } from "@/app/raeume/actions";
import { feldKlasse, fehlerBox, labelKlasse, primaerKnopf, sekundaerKnopf } from "@/components/formular/stile";
import type { ReservierungEingabe } from "@/lib/reservierung";

const feld = `${feldKlasse} min-h-11 text-[15px]`;

export function ReservierungFormular({
  raeume,
  raumId,
  datum,
  veranstalterAuswahl,
  eigenerVeranstalter,
  bearbeiten,
}: {
  raeume: { id: string; name: string }[];
  raumId: string;
  datum: string;
  /** Admin: alle; sonst eigener und gemeinsame Veranstalter (null, wenn es nichts zu wählen gibt) */
  veranstalterAuswahl: { id: string; name: string }[] | null;
  eigenerVeranstalter: { id: string; name: string } | null;
  /** bestehende Reservierung ändern; `abbrechen`: Link zurück zum leeren Formular */
  bearbeiten?: { id: string; werte: ReservierungEingabe; abbrechen: string };
}) {
  const [zustand, aktion, laeuft] = useActionState<ReservierungZustand, FormData>(reservieren, { version: 0 });
  const w: ReservierungEingabe = zustand.werte ?? bearbeiten?.werte ?? {
    raum_id: raumId,
    datum,
    von: "",
    bis: "",
    zweck: "",
    ansprechpartner: "",
    telefon: "",
    veranstalter_id: eigenerVeranstalter?.id ?? "",
  };
  const f = zustand.feldFehler ?? {};
  const fehler = (k: keyof ReservierungEingabe) =>
    f[k] ? (
      <span id={`rfehler-${k}`} className="text-sm font-semibold text-[#8C1D17]">
        {f[k]}
      </span>
    ) : null;
  const aria = (k: keyof ReservierungEingabe) =>
    f[k] ? { "aria-invalid": true, "aria-describedby": `rfehler-${k}` } : {};
  const rahmen = (k: keyof ReservierungEingabe) => (f[k] ? " border-2 border-[#B3261E]" : "");

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
      <label className={labelKlasse}>
        Datum
        <input type="date" name="datum" defaultValue={w.datum} required className={feld + rahmen("datum")} {...aria("datum")} />
        {fehler("datum")}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelKlasse}>
          Von
          <input type="time" name="von" defaultValue={w.von} required className={feld + rahmen("von")} {...aria("von")} />
          {fehler("von")}
        </label>
        <label className={labelKlasse}>
          Bis
          <input type="time" name="bis" defaultValue={w.bis} required className={feld + rahmen("bis")} {...aria("bis")} />
          {fehler("bis")}
        </label>
      </div>
      {veranstalterAuswahl ? (
        <label className={labelKlasse}>
          Veranstalter
          <select
            name="veranstalter_id"
            defaultValue={w.veranstalter_id}
            className={feld + rahmen("veranstalter_id")}
            {...aria("veranstalter_id")}
          >
            <option value="" disabled>
              Bitte auswählen …
            </option>
            {veranstalterAuswahl.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {fehler("veranstalter_id")}
        </label>
      ) : (
        <div className={labelKlasse}>
          Veranstalter
          <span className="flex min-h-11 items-center rounded-control bg-bg px-3 text-[15px] font-normal">
            {eigenerVeranstalter?.name}
          </span>
        </div>
      )}
      <label className={labelKlasse}>
        Wofür?
        <input type="text" name="zweck" defaultValue={w.zweck} placeholder="z. B. Vorstandssitzung" maxLength={120} className={feld + rahmen("zweck")} {...aria("zweck")} />
        {fehler("zweck")}
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className={labelKlasse}>
          Ansprechpartner
          <input type="text" name="ansprechpartner" defaultValue={w.ansprechpartner} autoComplete="name" maxLength={120} className={feld + rahmen("ansprechpartner")} {...aria("ansprechpartner")} />
          {fehler("ansprechpartner")}
        </label>
        <label className={labelKlasse}>
          Telefon
          <input type="tel" name="telefon" defaultValue={w.telefon} autoComplete="tel" maxLength={40} className={feld + rahmen("telefon")} {...aria("telefon")} />
          {fehler("telefon")}
        </label>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={laeuft} className={`${primaerKnopf} flex-1`}>
          {laeuft ? "Wird geprüft …" : bearbeiten ? "Speichern" : "Reservieren"}
        </button>
        {bearbeiten && (
          <Link href={bearbeiten.abbrechen} scroll={false} className={sekundaerKnopf}>
            Abbrechen
          </Link>
        )}
      </div>
      <p className="text-[13px] leading-[1.45] text-muted">
        Überschneidungen werden automatisch geprüft. Ansprechpartner und Telefon sind nicht öffentlich sichtbar.
      </p>
    </form>
  );
}
