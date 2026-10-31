"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { reservieren, type ReservierungZustand } from "@/app/raeume/actions";
import { feldKlasse, fehlerBox, labelKlasse, primaerKnopf, sekundaerKnopf } from "@/components/formular/stile";
import { datumKurz } from "@/lib/datum";
import { WIEDERHOLUNGEN, wiederholungsText, type ReservierungEingabe } from "@/lib/reservierung";

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
  /**
   * bestehende Reservierung ändern; `abbrechen`: Link zurück zum leeren Formular;
   * `folgende`: Teil einer Reihe – Zahl der Termine ab diesem (inklusive)
   */
  bearbeiten?: { id: string; werte: ReservierungEingabe; abbrechen: string; folgende?: number };
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
    wiederholung: "",
    wiederholen_bis: "",
    umfang: "",
  };
  // Datum und Rhythmus steuern die Texte im Auswahlfeld und das Feld „bis“
  const [tag, setTag] = useState(w.datum);
  const [wiederholung, setWiederholung] = useState(w.wiederholung);
  // Reihe bearbeiten: „Nur diesen Termin“ ist vorausgewählt
  const [umfang, setUmfang] = useState(w.umfang === "folgende" ? "folgende" : "einzeln");
  const reihe = !!bearbeiten?.folgende && umfang === "folgende";
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
      {bearbeiten?.folgende && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">Was ändern?</legend>
          {[
            { wert: "einzeln", text: `Nur diesen Termin (${datumKurz(bearbeiten.werte.datum)})` },
            { wert: "folgende", text: `Diesen und alle folgenden (${bearbeiten.folgende} Termine)` },
          ].map((o) => (
            <label
              key={o.wert}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-control border px-3 text-[15px] ${
                umfang === o.wert ? "border-accent bg-accent-soft font-semibold" : "border-line-input bg-surface"
              }`}
            >
              <input
                type="radio"
                name="umfang"
                value={o.wert}
                checked={umfang === o.wert}
                onChange={() => setUmfang(o.wert)}
                className="size-4 accent-[#24573A]"
              />
              {o.text}
            </label>
          ))}
        </fieldset>
      )}
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
      {reihe ? (
        <div className={labelKlasse}>
          Datum
          <input type="hidden" name="datum" value={bearbeiten!.werte.datum} />
          <span className="flex min-h-11 items-center rounded-control bg-bg px-3 text-[15px] font-normal">
            Jeder Termin behält sein Datum.
          </span>
        </div>
      ) : (
        <label className={labelKlasse}>
          Datum
          <input type="date" name="datum" defaultValue={w.datum} onChange={(e) => setTag(e.target.value)} required className={feld + rahmen("datum")} {...aria("datum")} />
          {fehler("datum")}
        </label>
      )}
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
      {!bearbeiten && (
        <div className="flex flex-col gap-3.5">
          <label className={labelKlasse}>
            Wiederholen
            <select
              name="wiederholung"
              value={wiederholung}
              onChange={(e) => setWiederholung(e.target.value)}
              className={feld + rahmen("wiederholung")}
              {...aria("wiederholung")}
            >
              <option value="">Nicht wiederholen</option>
              {WIEDERHOLUNGEN.map((art) => (
                <option key={art} value={art}>
                  {wiederholungsText(art, tag)}
                </option>
              ))}
            </select>
            {fehler("wiederholung")}
          </label>
          {wiederholung !== "" && (
            <label className={labelKlasse}>
              bis einschließlich
              <input
                type="date"
                name="wiederholen_bis"
                defaultValue={w.wiederholen_bis}
                min={tag || undefined}
                required
                className={feld + rahmen("wiederholen_bis")}
                {...aria("wiederholen_bis")}
              />
              {fehler("wiederholen_bis")}
            </label>
          )}
        </div>
      )}
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
      {zustand.konflikte && (
        <div role="alert" className="flex flex-col gap-2.5 rounded-control border border-[#E8C468] bg-[#FFF6DB] p-3.5 text-[15px] leading-normal text-ink">
          <p className="font-semibold">
            {zustand.konflikte.belegt.length} von {zustand.konflikte.belegt.length + zustand.konflikte.frei} Terminen{" "}
            {zustand.konflikte.belegt.length === 1 ? "ist" : "sind"} schon belegt:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {zustand.konflikte.belegt.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <button type="submit" name="belegte_auslassen" value="1" disabled={laeuft} className={primaerKnopf}>
            {laeuft
              ? "Wird geprüft …"
              : `${zustand.konflikte.frei === 1 ? "Den übrigen Termin" : `Die übrigen ${zustand.konflikte.frei}`} ${bearbeiten ? "ändern" : "reservieren"}`}
          </button>
          <p className="text-[13px] text-muted-strong">
            {bearbeiten
              ? "Die belegten Tage bleiben wie bisher. Oder oben die Uhrzeit ändern und erneut prüfen."
              : "Oder oben Datum, Uhrzeit oder Rhythmus ändern und erneut prüfen."}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={laeuft} className={`${zustand.konflikte ? sekundaerKnopf : primaerKnopf} flex-1`}>
          {laeuft
            ? "Wird geprüft …"
            : zustand.konflikte
              ? "Erneut prüfen"
              : reihe
                ? `Alle ${bearbeiten!.folgende} speichern`
                : bearbeiten
                  ? "Speichern"
                  : "Reservieren"}
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
