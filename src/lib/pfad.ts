/** Nur interne Pfade als Rücksprungziel zulassen (kein Open Redirect). */
export function sichererPfad(wert: unknown, fallback = "/verwaltung"): string {
  if (typeof wert !== "string" || !wert.startsWith("/") || wert.startsWith("//") || wert.startsWith("/\\")) {
    return fallback;
  }
  return wert;
}
