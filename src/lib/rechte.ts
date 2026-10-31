/** Rechte einer Sitzung; ohne Server-Abhängigkeiten, damit auch Client-Komponenten sie nutzen können. */
export type Schreibrechte = {
  istAdmin: boolean;
  /** Für diese Veranstalter darf ein normaler Zugang schreiben: der eigene und die gemeinsamen (Admin: leer, darf alles) */
  schreibbar: string[];
};

/** Darf die Sitzung Termine/Reservierungen dieses Veranstalters ändern? (Die Datenbank prüft dasselbe per RLS.) */
export const darfSchreiben = (rechte: Schreibrechte | null, veranstalterId: string | null | undefined) =>
  !!rechte && (rechte.istAdmin || (!!veranstalterId && rechte.schreibbar.includes(veranstalterId)));

/**
 * Auswahl „Veranstalter“ im Termin- und Reservierungsformular.
 * Admin: alle. Normaler Zugang: der eigene (zuerst) und die gemeinsamen; null, wenn es nichts zu wählen gibt.
 */
export function veranstalterAuswahl(
  rechte: Schreibrechte,
  liste: { id: string; name: string; gemeinsam: boolean }[],
): { id: string; name: string }[] | null {
  if (rechte.istAdmin) return liste.map(({ id, name }) => ({ id, name }));
  const auswahl = rechte.schreibbar.flatMap((id) => {
    const v = liste.find((x) => x.id === id);
    return v ? [{ id, name: v.gemeinsam ? `${v.name} (gemeinsam)` : v.name }] : [];
  });
  return auswahl.length > 1 ? auswahl : null;
}
