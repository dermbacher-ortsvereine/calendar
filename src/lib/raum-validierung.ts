// Prüfung der Admin-Eingaben für Räume. Ohne Laufzeit-Imports (testbar).

export type RaumEingabe = {
  id: string;
  name: string;
  sortierung: string;
};

export type RaumDaten = {
  name: string;
  sortierung: number;
};

export function pruefeRaum(
  e: RaumEingabe,
  { neu }: { neu: boolean },
): { ok: true; daten: RaumDaten } | { ok: false; fehler: Partial<Record<keyof RaumEingabe, string>> } {
  const fehler: Partial<Record<keyof RaumEingabe, string>> = {};
  if (neu && !/^[a-z0-9]{2,30}$/.test(e.id)) {
    fehler.id = "Nur Kleinbuchstaben und Ziffern, 2–30 Zeichen (z. B. „kegelbahn“).";
  }
  if (!e.name.trim()) fehler.name = "Bitte einen Namen eingeben.";
  else if (e.name.trim().length > 60) fehler.name = "Höchstens 60 Zeichen.";
  const sortierung = Number(e.sortierung || "0");
  if (!Number.isInteger(sortierung) || sortierung < 0 || sortierung > 9999) fehler.sortierung = "Ganze Zahl von 0 bis 9999.";

  if (Object.keys(fehler).length) return { ok: false, fehler };
  return { ok: true, daten: { name: e.name.trim(), sortierung } };
}
