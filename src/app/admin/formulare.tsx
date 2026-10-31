"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  eigenesPasswortAendern,
  logoAendern,
  passwortSetzen,
  raumAnlegen,
  raumLoeschen,
  raumSpeichern,
  veranstalterAnlegen,
  veranstalterSpeichern,
  type AdminZustand,
} from "@/app/admin/actions";
import { BestaetigungDialog, rotKnopf } from "@/components/bestaetigung-dialog";
import { erfolgBox, feldKlasse, fehlerBox, labelKlasse, primaerKnopf, sekundaerKnopf } from "@/components/formular/stile";
import type { RaumEingabe } from "@/lib/raum-validierung";
import { kontrast, MIN_KONTRAST, type VeranstalterEingabe } from "@/lib/veranstalter-validierung";

const START: AdminZustand = { version: 0 };
const feld = `${feldKlasse} min-h-11 text-[15px]`;
const kleinKnopf = `${primaerKnopf} min-h-11 px-5 text-[15px]`;

function Meldung({ z }: { z: AdminZustand }) {
  if (z.fehler) return <p role="alert" className={fehlerBox}>{z.fehler}</p>;
  if (z.erfolg) return <p role="status" className={erfolgBox}>{z.erfolg}</p>;
  return null;
}

function FeldFehler({ text }: { text?: string }) {
  return text ? <span className="text-sm font-semibold text-[#8C1D17]">{text}</span> : null;
}

type V = { id: string; name: string; kuerzel: string; farbe: string; farbe_hg: string; sortierung: number; aktiv: boolean };

/** Felder für Name, Kürzel, Farben (mit Live-Vorschau und Kontrastanzeige), Sortierung. */
function StammdatenFelder({ w, f, neu }: { w: VeranstalterEingabe; f: AdminZustand["feldFehler"]; neu: boolean }) {
  const [farbe, setFarbe] = useState(w.farbe || "#24573A");
  const [hg, setHg] = useState(w.farbe_hg || "#E6EEE8");
  const [name, setName] = useState(w.name);
  const k = kontrast(farbe, hg);
  return (
    <>
      {neu && (
        <label className={labelKlasse}>
          Kennung (für die interne Login-Adresse, nicht änderbar)
          <input name="id" defaultValue={w.id} required pattern="[a-z0-9]{2,20}" placeholder="z. B. tc" className={feld} />
          <FeldFehler text={f?.id} />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className={labelKlasse}>
          Name
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={feld} />
          <FeldFehler text={f?.name} />
        </label>
        <label className={labelKlasse}>
          Kürzel
          <input name="kuerzel" defaultValue={w.kuerzel} required maxLength={4} className={feld} />
          <FeldFehler text={f?.kuerzel} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_120px]">
        <label className={labelKlasse}>
          Textfarbe
          <input type="color" name="farbe" value={farbe} onChange={(e) => setFarbe(e.target.value)} className="h-11 w-full cursor-pointer rounded-control border border-line-input bg-surface p-1" />
        </label>
        <label className={labelKlasse}>
          Hintergrund
          <input type="color" name="farbe_hg" value={hg} onChange={(e) => setHg(e.target.value)} className="h-11 w-full cursor-pointer rounded-control border border-line-input bg-surface p-1" />
        </label>
        <label className={labelKlasse}>
          Reihenfolge
          <input type="number" name="sortierung" min={0} max={9999} defaultValue={w.sortierung} className={feld} />
          <FeldFehler text={f?.sortierung} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-semibold" style={{ background: hg, color: farbe }}>
          {name || "Vorschau"}
        </span>
        <span className={k >= MIN_KONTRAST ? "text-muted" : "font-semibold text-[#8C1D17]"}>
          Kontrast {k.toFixed(1)} : 1 {k >= MIN_KONTRAST ? "– gut lesbar" : `– zu gering (mindestens ${MIN_KONTRAST} : 1)`}
        </span>
      </div>
      <FeldFehler text={f?.farbe ?? f?.farbe_hg} />
    </>
  );
}

export function VeranstalterBearbeiten({ v }: { v: V }) {
  const [z, aktion, laeuft] = useActionState(veranstalterSpeichern, START);
  const w: VeranstalterEingabe = z.werte ?? { ...v, sortierung: String(v.sortierung) };
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3.5">
      <input type="hidden" name="id" value={v.id} />
      <Meldung z={z} />
      <StammdatenFelder w={w} f={z.feldFehler} neu={false} />
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
        <input type="checkbox" name="aktiv" defaultChecked={w.aktiv} className="size-5 accent-accent" />
        Aktiv (im Kalender und beim Login sichtbar)
      </label>
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Speichern …" : "Änderungen speichern"}
        </button>
      </div>
    </form>
  );
}

function PasswortFeld({ fehler, label }: { fehler?: string; label: string }) {
  const [wert, setWert] = useState("");
  const [sichtbar, setSichtbar] = useState(false);
  function vorschlagen() {
    // Gut vorlesbares Passwort ohne verwechselbare Zeichen (0/O, 1/l/I).
    const zeichen = "abcdefghjkmnpqrstuvwxyz23456789";
    const zufall = crypto.getRandomValues(new Uint32Array(12));
    const roh = Array.from(zufall, (n) => zeichen[n % zeichen.length]).join("");
    setWert(`${roh.slice(0, 4)}-${roh.slice(4, 8)}-${roh.slice(8)}`);
    setSichtbar(true);
  }
  return (
    <label className={labelKlasse}>
      {label}
      <div className="flex flex-wrap gap-2">
        <input
          type={sichtbar ? "text" : "password"}
          name="passwort"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          className={`${feld} min-w-0 flex-1`}
        />
        <button type="button" onClick={vorschlagen} className={`${sekundaerKnopf} min-h-11 px-3 text-sm`}>
          Vorschlagen
        </button>
        <button type="button" onClick={() => setSichtbar(!sichtbar)} aria-pressed={sichtbar} className={`${sekundaerKnopf} min-h-11 px-3 text-sm`}>
          {sichtbar ? "Verbergen" : "Anzeigen"}
        </button>
      </div>
      <FeldFehler text={fehler} />
    </label>
  );
}

export function PasswortZuruecksetzen({ id, name }: { id: string; name: string }) {
  const [z, aktion, laeuft] = useActionState(passwortSetzen, START);
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Meldung z={z} />
      <PasswortFeld label={`Neues Passwort für ${name}`} fehler={z.feldFehler?.passwort} />
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Wird gesetzt …" : "Passwort setzen"}
        </button>
      </div>
    </form>
  );
}

export function LogoVerwalten({ id, logoUrl, kuerzel, farbe }: { id: string; logoUrl: string | null; kuerzel: string; farbe: string }) {
  const [z, aktion, laeuft] = useActionState(logoAendern, START);
  return (
    <div className="flex flex-col gap-3">
      <Meldung z={z} />
      <div className="flex flex-wrap items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Aktuelles Logo" className="size-16 rounded-full border border-line bg-surface object-contain" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full border-[1.5px] border-dashed text-sm font-bold" style={{ borderColor: farbe, color: farbe }}>
            {kuerzel}
          </span>
        )}
        <form key={z.version} action={aktion} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="aktion" value="hochladen" />
          <label className="text-sm font-semibold">
            <span className="sr-only">Logo-Datei</span>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required className="max-w-[240px] text-sm" />
          </label>
          <button type="submit" disabled={laeuft} className={kleinKnopf}>
            {laeuft ? "Bitte warten …" : "Logo hochladen"}
          </button>
        </form>
        {logoUrl && (
          <form action={aktion}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="aktion" value="entfernen" />
            <button type="submit" disabled={laeuft} className={`${sekundaerKnopf} min-h-11 text-sm text-[#B3261E]`}>
              Logo entfernen
            </button>
          </form>
        )}
      </div>
      <p className="text-[13px] text-muted">PNG, JPG oder WebP, höchstens 2 MB. Am besten quadratisch.</p>
    </div>
  );
}

export function VeranstalterNeu() {
  const [z, aktion, laeuft] = useActionState(veranstalterAnlegen, START);
  const w: VeranstalterEingabe = z.werte ?? { id: "", name: "", kuerzel: "", farbe: "#24573A", farbe_hg: "#E6EEE8", sortierung: "100", aktiv: true };
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3.5">
      <Meldung z={z} />
      <StammdatenFelder w={w} f={z.feldFehler} neu />
      <PasswortFeld label="Startpasswort" fehler={z.feldFehler?.passwort} />
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Wird angelegt …" : "Veranstalter anlegen"}
        </button>
      </div>
    </form>
  );
}

export function EigenesPasswort() {
  const [z, aktion, laeuft] = useActionState(eigenesPasswortAendern, START);
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3">
      <Meldung z={z} />
      <PasswortFeld label="Neues Passwort für die Administration" fehler={z.feldFehler?.passwort} />
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Wird geändert …" : "Passwort ändern"}
        </button>
      </div>
    </form>
  );
}

function RaumFelder({ w, f, neu }: { w: RaumEingabe; f: AdminZustand["feldFehler"]; neu: boolean }) {
  return (
    <>
      {neu && (
        <label className={labelKlasse}>
          Kennung (für Links, nicht änderbar)
          <input name="id" defaultValue={w.id} required pattern="[a-z0-9]{2,30}" placeholder="z. B. kegelbahn" className={feld} />
          <FeldFehler text={f?.id} />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className={labelKlasse}>
          Name
          <input name="name" defaultValue={w.name} required maxLength={60} className={feld} />
          <FeldFehler text={f?.name} />
        </label>
        <label className={labelKlasse}>
          Reihenfolge
          <input type="number" name="sortierung" min={0} max={9999} defaultValue={w.sortierung} className={feld} />
          <FeldFehler text={f?.sortierung} />
        </label>
      </div>
    </>
  );
}

export function RaumBearbeiten({ r }: { r: { id: string; name: string; sortierung: number } }) {
  const [z, aktion, laeuft] = useActionState(raumSpeichern, START);
  const w: RaumEingabe = z.raumWerte ?? { ...r, sortierung: String(r.sortierung) };
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3.5">
      <input type="hidden" name="id" value={r.id} />
      <Meldung z={z} />
      <RaumFelder w={w} f={z.feldFehler} neu={false} />
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Speichern …" : "Änderungen speichern"}
        </button>
      </div>
    </form>
  );
}

function LoeschenBestaetigen() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={rotKnopf}>
      {pending ? "Wird gelöscht …" : "Ja, löschen"}
    </button>
  );
}

export function RaumLoeschen({ id, name }: { id: string; name: string }) {
  const [z, aktion] = useActionState(raumLoeschen, START);
  // Dialog gehört zu genau einer Antwort-Version: kommt die Antwort, schließt er sich von selbst.
  const [offenBei, setOffenBei] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Meldung z={z} />
      <div>
        <button type="button" onClick={() => setOffenBei(z.version)} className={`${sekundaerKnopf} min-h-11 text-sm text-[#B3261E]`}>
          Raum löschen
        </button>
      </div>
      <p className="text-[13px] text-muted">Nur möglich, solange es für den Raum keine Reservierungen oder Sperren gibt.</p>
      <BestaetigungDialog
        offen={offenBei === z.version}
        onSchliessen={() => setOffenBei(null)}
        titel={`„${name}“ wirklich löschen?`}
        text="Der Raum verschwindet aus Belegung und Reservierung."
        action={aktion}
        felder={{ id }}
      >
        <LoeschenBestaetigen />
      </BestaetigungDialog>
    </div>
  );
}

export function RaumNeu({ sortierung }: { sortierung: number }) {
  const [z, aktion, laeuft] = useActionState(raumAnlegen, START);
  const w: RaumEingabe = z.raumWerte ?? { id: "", name: "", sortierung: String(sortierung) };
  return (
    <form key={z.version} action={aktion} className="flex flex-col gap-3.5">
      <Meldung z={z} />
      <RaumFelder w={w} f={z.feldFehler} neu />
      <div>
        <button type="submit" disabled={laeuft} className={kleinKnopf}>
          {laeuft ? "Wird angelegt …" : "Raum anlegen"}
        </button>
      </div>
    </form>
  );
}
