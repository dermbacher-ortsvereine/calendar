/**
 * Lesbares Hinweis-Cookie „angemeldet=1“ (ohne Inhalt, keine Sitzungsdaten): Daran erkennt der Browser,
 * ob es sich lohnt, den Login-Status beim Server zu erfragen. Anonyme Besucher lösen so keine
 * Serveranfrage aus und bekommen die Seiten direkt aus dem CDN. Die eigentliche Sitzung bleibt httpOnly.
 */
export const ANMELDE_MARKER = "angemeldet";

export const ANMELDE_MARKER_OPTIONEN = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 400 * 24 * 60 * 60,
};
