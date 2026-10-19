const BASIS = "http://intern.invalid";

/**
 * Nur interne Pfade als Rücksprungziel zulassen (kein Open Redirect).
 * Der Wert wird so geparst wie im Browser – Tricks wie "//evil", "/\evil" oder
 * "/<Tab>/evil" landen dadurch auf einem fremden Origin und werden abgelehnt.
 */
export function sichererPfad(wert: unknown, fallback = "/verwaltung"): string {
  if (typeof wert !== "string" || !wert.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(wert)) {
    return fallback;
  }
  try {
    const url = new URL(wert, BASIS);
    if (url.origin !== BASIS) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
