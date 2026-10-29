"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { terminSpeichern, type FormularZustand } from "@/app/verwaltung/actions";
import { feldKlasse, fehlerBox, labelKlasse, primaerKnopf, sekundaerKnopf } from "@/components/formular/stile";
import type { Termin } from "@/lib/daten";
import type { TerminEingabe } from "@/lib/termin-validierung";

const ORTE = ["Mehrzweckhalle", "Stüffjen", "Schulungsraum", "Dorfplatz", "Sportplatz", "Kirche", "Feuerwehrgerätehaus"];

function ausTermin(t: Termin | null, veranstalterId: string): TerminEingabe {
  return {
    titel: t?.titel ?? "",
    datum: t?.datum ?? "",
    bis_datum: t?.bis_datum ?? "",
    ganztaegig: t && !t.beginn ? "ja" : "",
    beginn: t?.beginn?.slice(0, 5) ?? "",
    ende: t?.ende?.slice(0, 5) ?? "",
    ort: t?.ort ?? "",
    beschreibung: t?.beschreibung ?? "",
    ansprechpartner: t?.ansprechpartner ?? "",
    veranstalter_id: t?.veranstalter_id ?? veranstalterId,
  };
}

function FeldFehler({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <span id={id} className="text-sm font-semibold text-[#8C1D17]">
      {text}
    </span>
  );
}

export function TerminFormular({
  termin,
  veranstalterAuswahl,
  eigenerVeranstalter,
}: {
  termin: Termin | null;
  /** nur für den Admin: alle Veranstalter zur Auswahl */
  veranstalterAuswahl: { id: string; name: string }[] | null;
  eigenerVeranstalter: string;
}) {
  const [zustand, aktion, laeuft] = useActionState<FormularZustand, FormData>(terminSpeichern, { version: 0 });
  const w = zustand.werte ?? ausTermin(termin, eigenerVeranstalter);
  const f = zustand.feldFehler ?? {};
  // Bei einem Fehler wird das Formular per key neu aufgebaut; der Startwert kommt dann aus den Eingaben.
  const [ganztaegig, setGanztaegig] = useState(w.ganztaegig === "ja");
  const fehlerProps = (feld: keyof TerminEingabe) =>
    f[feld] ? { "aria-invalid": true, "aria-describedby": `fehler-${feld}` } : {};
  const rahmen = (feld: keyof TerminEingabe) => (f[feld] ? " border-[#B3261E] border-2" : "");

  return (
    <form key={zustand.version} action={aktion} className="flex flex-col gap-4" noValidate>
      {termin && <input type="hidden" name="id" value={termin.id} />}
      {zustand.fehler && (
        <p role="alert" className={fehlerBox}>
          {zustand.fehler}
        </p>
      )}

      {veranstalterAuswahl && (
        <label className={labelKlasse}>
          Veranstalter
          <select
            name="veranstalter_id"
            defaultValue={w.veranstalter_id}
            required
            className={feldKlasse + rahmen("veranstalter_id")}
            {...fehlerProps("veranstalter_id")}
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
          <FeldFehler id="fehler-veranstalter_id" text={f.veranstalter_id} />
        </label>
      )}

      <label className={labelKlasse}>
        Titel
        <input
          type="text"
          name="titel"
          defaultValue={w.titel}
          placeholder="z. B. Herbstkonzert"
          required
          maxLength={120}
          className={feldKlasse + rahmen("titel")}
          {...fehlerProps("titel")}
        />
        <FeldFehler id="fehler-titel" text={f.titel} />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelKlasse}>
          Datum
          <input
            type="date"
            name="datum"
            defaultValue={w.datum}
            required
            className={feldKlasse + " px-2.5 text-[15px]" + rahmen("datum")}
            {...fehlerProps("datum")}
          />
          <FeldFehler id="fehler-datum" text={f.datum} />
        </label>
        <label className={labelKlasse}>
          Bis (nur bei mehrtägigen Terminen)
          <input
            type="date"
            name="bis_datum"
            defaultValue={w.bis_datum}
            min={w.datum || undefined}
            className={feldKlasse + " px-2.5 text-[15px]" + rahmen("bis_datum")}
            {...fehlerProps("bis_datum")}
          />
          <FeldFehler id="fehler-bis_datum" text={f.bis_datum} />
        </label>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold">
        <input
          type="checkbox"
          name="ganztaegig"
          value="ja"
          checked={ganztaegig}
          onChange={(e) => setGanztaegig(e.target.checked)}
          className="size-5 accent-accent"
        />
        Ganztägig (ohne Uhrzeit)
      </label>

      {!ganztaegig && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelKlasse}>
            Beginn
            <input
              type="time"
              name="beginn"
              defaultValue={w.beginn}
              required
              className={feldKlasse + " px-2.5 text-[15px]" + rahmen("beginn")}
              {...fehlerProps("beginn")}
            />
            <FeldFehler id="fehler-beginn" text={f.beginn} />
          </label>
          <label className={labelKlasse}>
            Ende (optional)
            <input
              type="time"
              name="ende"
              defaultValue={w.ende}
              className={feldKlasse + " px-2.5 text-[15px]" + rahmen("ende")}
              {...fehlerProps("ende")}
            />
            <FeldFehler id="fehler-ende" text={f.ende} />
          </label>
        </div>
      )}

      <label className={labelKlasse}>
        Ort
        <input
          type="text"
          name="ort"
          list="orte"
          defaultValue={w.ort}
          placeholder="Mehrzweckhalle, Stüffjen, Dorfplatz …"
          maxLength={120}
          className={feldKlasse + rahmen("ort")}
          {...fehlerProps("ort")}
        />
        <datalist id="orte">
          {ORTE.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <FeldFehler id="fehler-ort" text={f.ort} />
      </label>

      <label className={labelKlasse}>
        Beschreibung (optional)
        <textarea
          name="beschreibung"
          rows={3}
          defaultValue={w.beschreibung}
          maxLength={2000}
          className={feldKlasse + " resize-y py-2.5 text-[15px]" + rahmen("beschreibung")}
          {...fehlerProps("beschreibung")}
        />
        <FeldFehler id="fehler-beschreibung" text={f.beschreibung} />
      </label>

      <label className={labelKlasse}>
        Ansprechpartner (optional)
        <input
          type="text"
          name="ansprechpartner"
          defaultValue={w.ansprechpartner}
          placeholder="Name, Telefon oder E-Mail – wird öffentlich angezeigt"
          maxLength={200}
          className={feldKlasse + rahmen("ansprechpartner")}
          {...fehlerProps("ansprechpartner")}
        />
        <FeldFehler id="fehler-ansprechpartner" text={f.ansprechpartner} />
      </label>

      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={laeuft} className={primaerKnopf}>
          {laeuft ? "Wird gespeichert …" : termin ? "Änderungen speichern" : "Termin speichern"}
        </button>
        <Link href="/verwaltung" className={sekundaerKnopf}>
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
