import { test } from "node:test";
import assert from "node:assert/strict";
import { BLAETTERN_MONATE, imBlaetterBereich, leseZustand } from "./kalender-url.ts";

const IDS = ["vfl", "mv", "ff"];
const HEUTE = "2026-11-09";

test("Blätterbereich: 24 Monate zurück und voraus", () => {
  assert.equal(BLAETTERN_MONATE, 24);
  assert.ok(imBlaetterBereich("2024-11", HEUTE));
  assert.ok(imBlaetterBereich("2028-11", HEUTE));
  assert.ok(!imBlaetterBereich("2024-10", HEUTE));
  assert.ok(!imBlaetterBereich("2028-12", HEUTE));
});

test("Monat außerhalb des Blätterbereichs fällt auf den aktuellen Monat zurück", () => {
  assert.equal(leseZustand({ m: "2027-03" }, IDS, HEUTE).monat, "2027-03");
  assert.equal(leseZustand({ m: "2001-01" }, IDS, HEUTE).monat, null);
  assert.equal(leseZustand({ m: "2099-12" }, IDS, HEUTE).monat, null);
  assert.equal(leseZustand({ m: "quatsch" }, IDS, HEUTE).monat, null);
});

test("Filter: unbekannte IDs fallen weg, alle gewählt = kein Filter", () => {
  assert.deepEqual(leseZustand({ v: "mv,xx,ff" }, IDS, HEUTE).filter, ["mv", "ff"]);
  assert.deepEqual(leseZustand({ v: "vfl,mv,ff" }, IDS, HEUTE).filter, []);
});
