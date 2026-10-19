// Prüfung der Admin-Eingaben für Veranstalter und Passwörter. Ohne Laufzeit-Imports (testbar).

export type VeranstalterEingabe = {
  id: string;
  name: string;
  kuerzel: string;
  farbe: string;
  farbe_hg: string;
  sortierung: string;
  aktiv: boolean;
};

export type VeranstalterDaten = {
  name: string;
  kuerzel: string;
  farbe: string;
  farbe_hg: string;
  sortierung: number;
  aktiv: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Kennungen, die nicht vergeben werden dürfen (z. B. Login-Adresse der Administration). */
export const RESERVIERTE_IDS = ["admin", "administration", "root", "system", "support"];

function kanal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminanz(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * kanal((n >> 16) & 255) + 0.7152 * kanal((n >> 8) & 255) + 0.0722 * kanal(n & 255);
}

/** WCAG-Kontrastverhältnis zweier Farben (1 … 21). */
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [luminanz(a), luminanz(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}

/** Mindestkontrast für normalen Text (WCAG AA). */
export const MIN_KONTRAST = 4.5;

export function pruefeVeranstalter(
  e: VeranstalterEingabe,
  { neu }: { neu: boolean },
): { ok: true; daten: VeranstalterDaten } | { ok: false; fehler: Partial<Record<keyof VeranstalterEingabe, string>> } {
  const fehler: Partial<Record<keyof VeranstalterEingabe, string>> = {};
  if (neu && !/^[a-z0-9]{2,20}$/.test(e.id)) {
    fehler.id = "Nur Kleinbuchstaben und Ziffern, 2–20 Zeichen (z. B. „tc“).";
  } else if (neu && RESERVIERTE_IDS.includes(e.id)) {
    fehler.id = `„${e.id}“ ist reserviert. Bitte eine andere Kennung wählen.`;
  }
  if (!e.name.trim()) fehler.name = "Bitte einen Namen eingeben.";
  else if (e.name.trim().length > 80) fehler.name = "Höchstens 80 Zeichen.";
  if (!e.kuerzel.trim()) fehler.kuerzel = "Bitte ein Kürzel eingeben.";
  else if (e.kuerzel.trim().length > 4) fehler.kuerzel = "Höchstens 4 Zeichen.";
  if (!HEX.test(e.farbe)) fehler.farbe = "Bitte eine Farbe wählen.";
  if (!HEX.test(e.farbe_hg)) fehler.farbe_hg = "Bitte eine Farbe wählen.";
  if (!fehler.farbe && !fehler.farbe_hg && kontrast(e.farbe, e.farbe_hg) < MIN_KONTRAST) {
    fehler.farbe = `Zu wenig Kontrast zwischen Text- und Hintergrundfarbe (${kontrast(e.farbe, e.farbe_hg).toFixed(1)} : 1, nötig ${MIN_KONTRAST} : 1).`;
  }
  const sortierung = Number(e.sortierung || "0");
  if (!Number.isInteger(sortierung) || sortierung < 0 || sortierung > 9999) fehler.sortierung = "Ganze Zahl von 0 bis 9999.";

  if (Object.keys(fehler).length) return { ok: false, fehler };
  return {
    ok: true,
    daten: {
      name: e.name.trim(),
      kuerzel: e.kuerzel.trim(),
      farbe: e.farbe.toUpperCase(),
      farbe_hg: e.farbe_hg.toUpperCase(),
      sortierung,
      aktiv: e.aktiv,
    },
  };
}

export function pruefePasswort(p: string): string | null {
  if (p.length < 8) return "Das Passwort muss mindestens 8 Zeichen haben.";
  if (p.length > 72) return "Das Passwort darf höchstens 72 Zeichen haben.";
  return null;
}
