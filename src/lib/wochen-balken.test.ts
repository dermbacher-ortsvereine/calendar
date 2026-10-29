import { test } from "node:test";
import assert from "node:assert/strict";
import { wochenBalken } from "./wochen-balken.ts";

// Mo 9. – So 15. November 2026
const woche = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
const t = (id: string, datum: string, bis_datum: string | null = null) => ({ id, datum, bis_datum });

test("mehrtägiger Termin wird ein Balken über seine Tage", () => {
  const { balken } = wochenBalken(woche, [t("probe", "2026-11-13", "2026-11-15")], 3);
  assert.deepEqual(
    balken.map(({ termin, ...b }) => ({ id: termin.id, ...b })),
    [{ id: "probe", start: 4, spanne: 3, spur: 0, weiterVorher: false, weiterNachher: false }],
  );
});

test("Balken über die Wochengrenze werden abgeschnitten und markiert", () => {
  const { balken } = wochenBalken(woche, [t("lang", "2026-11-05", "2026-11-20")], 3);
  assert.equal(balken[0].start, 0);
  assert.equal(balken[0].spanne, 7);
  assert.equal(balken[0].weiterVorher, true);
  assert.equal(balken[0].weiterNachher, true);
});

test("Termine außerhalb der Woche fehlen", () => {
  const { balken } = wochenBalken(woche, [t("vorher", "2026-11-08"), t("nachher", "2026-11-16", "2026-11-18")], 3);
  assert.deepEqual(balken, []);
});

test("Spuren: mehrtägig oben, eintägige weichen aus und füllen Lücken", () => {
  const { balken } = wochenBalken(
    woche,
    [t("martin", "2026-11-13"), t("probe", "2026-11-13", "2026-11-15"), t("mo", "2026-11-09")],
    3,
  );
  const spur = Object.fromEntries(balken.map((b) => [b.termin.id, b.spur]));
  assert.deepEqual(spur, { mo: 0, probe: 0, martin: 1 });
});

test("zu viele Termine landen pro Tag in „weitere“", () => {
  const termine = ["a", "b", "c", "d"].map((id) => t(id, "2026-11-10"));
  const { balken, weitere } = wochenBalken(woche, [...termine, t("lang", "2026-11-09", "2026-11-11")], 3);
  assert.equal(balken.length, 3);
  assert.deepEqual(weitere, [0, 2, 0, 0, 0, 0, 0]);
});
