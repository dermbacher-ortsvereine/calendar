// Prüfung der Formulareingaben für Termine. Ohne Laufzeit-Imports (mit `node --test` testbar).

export type TerminEingabe = {
  titel: string;
  datum: string;
  bis_datum: string;
  /** "ja" = ganztägig (Uhrzeiten werden ignoriert) */
  ganztaegig: string;
  beginn: string;
  ende: string;
  ort: string;
  beschreibung: string;
  ansprechpartner: string;
  veranstalter_id: string;
};

export type TerminDaten = {
  titel: string;
  datum: string;
  bis_datum: string | null;
  beginn: string | null;
  ende: string | null;
  ort: string | null;
  beschreibung: string | null;
  ansprechpartner: string | null;
};

export type Ergebnis =
  | { ok: true; daten: TerminDaten }
  | { ok: false; fehler: Partial<Record<keyof TerminEingabe, string>> };

const GRENZEN = { titel: 120, ort: 120, beschreibung: 2000, ansprechpartner: 200 } as const;

const leerZuNull = (s: string) => (s.trim() === "" ? null : s.trim());

function gueltigesDatum(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && y >= 2000 && y <= 2100;
}

const gueltigeZeit = (s: string) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s);

export function eingabeAusFormData(formData: FormData): TerminEingabe {
  const wert = (k: string) => String(formData.get(k) ?? "");
  return {
    titel: wert("titel"),
    datum: wert("datum"),
    bis_datum: wert("bis_datum"),
    ganztaegig: wert("ganztaegig"),
    beginn: wert("beginn"),
    ende: wert("ende"),
    ort: wert("ort"),
    beschreibung: wert("beschreibung"),
    ansprechpartner: wert("ansprechpartner"),
    veranstalter_id: wert("veranstalter_id"),
  };
}

export function pruefeTermin(e: TerminEingabe): Ergebnis {
  const fehler: Partial<Record<keyof TerminEingabe, string>> = {};
  const titel = e.titel.trim();

  if (!titel) fehler.titel = "Bitte einen Titel eingeben.";
  else if (titel.length > GRENZEN.titel) fehler.titel = `Der Titel darf höchstens ${GRENZEN.titel} Zeichen haben.`;

  if (!gueltigesDatum(e.datum)) fehler.datum = "Bitte ein gültiges Datum wählen.";
  const bis = e.bis_datum.trim();
  if (bis && !gueltigesDatum(bis)) fehler.bis_datum = "Bitte ein gültiges Datum wählen oder das Feld leer lassen.";
  else if (bis && !fehler.datum && bis < e.datum) fehler.bis_datum = "Das Enddatum liegt vor dem ersten Tag.";

  const ganztaegig = e.ganztaegig === "ja";
  if (!ganztaegig) {
    if (!gueltigeZeit(e.beginn)) fehler.beginn = "Bitte eine Uhrzeit für den Beginn wählen oder „Ganztägig“ ankreuzen.";
    if (e.ende.trim() && !gueltigeZeit(e.ende)) fehler.ende = "Bitte eine gültige Uhrzeit wählen oder das Feld leer lassen.";
  }

  for (const feld of ["ort", "beschreibung", "ansprechpartner"] as const) {
    if (e[feld].trim().length > GRENZEN[feld]) fehler[feld] = `Höchstens ${GRENZEN[feld]} Zeichen.`;
  }

  if (Object.keys(fehler).length) return { ok: false, fehler };
  return {
    ok: true,
    daten: {
      titel,
      datum: e.datum,
      bis_datum: bis && bis > e.datum ? bis : null,
      beginn: ganztaegig ? null : e.beginn.slice(0, 5),
      ende: ganztaegig ? null : (leerZuNull(e.ende)?.slice(0, 5) ?? null),
      ort: leerZuNull(e.ort),
      beschreibung: leerZuNull(e.beschreibung),
      ansprechpartner: leerZuNull(e.ansprechpartner),
    },
  };
}
