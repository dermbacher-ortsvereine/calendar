/**
 * Angaben zum Betreiber für Impressum und Datenschutzerklärung.
 *
 * Die Werte stehen bewusst nicht im (öffentlichen) Repository, sondern in
 * Umgebungsvariablen (lokal `.env.local`, in Produktion Vercel). Fehlt ein Wert,
 * erscheint ein Platzhalter in eckigen Klammern.
 */
export type Betreiber = {
  name: string;
  strasse: string;
  ort: string;
  email: string;
  telefon: string | null;
  vollstaendig: boolean;
};

type Env = Record<string, string | undefined>;

export function betreiberAusEnv(env: Env = process.env): Betreiber {
  const wert = (schluessel: string) => env[schluessel]?.trim() || null;

  const name = wert("IMPRESSUM_NAME");
  const strasse = wert("IMPRESSUM_STRASSE");
  const ort = wert("IMPRESSUM_ORT");
  const email = wert("IMPRESSUM_EMAIL");

  return {
    name: name ?? "[Name]",
    strasse: strasse ?? "[Straße und Hausnummer]",
    ort: ort ?? "[PLZ Ort]",
    email: email ?? "[E-Mail-Adresse]",
    telefon: wert("IMPRESSUM_TELEFON"),
    vollstaendig: Boolean(name && strasse && ort && email),
  };
}
