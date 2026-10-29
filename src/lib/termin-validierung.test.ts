import { test } from "node:test";
import assert from "node:assert/strict";
import { pruefeTermin, type TerminEingabe } from "./termin-validierung.ts";

const gut: TerminEingabe = {
  titel: "  Herbstkonzert ",
  datum: "2026-11-07",
  bis_datum: "",
  ganztaegig: "",
  beginn: "19:00",
  ende: "",
  ort: " Mehrzweckhalle ",
  beschreibung: "",
  ansprechpartner: "",
  veranstalter_id: "mv",
};

test("gültige Eingabe wird bereinigt", () => {
  const r = pruefeTermin(gut);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.daten.titel, "Herbstkonzert");
    assert.equal(r.daten.ort, "Mehrzweckhalle");
    assert.equal(r.daten.ende, null);
    assert.equal(r.daten.beschreibung, null);
  }
});

test("Pflichtfelder fehlen", () => {
  const r = pruefeTermin({ ...gut, titel: " ", datum: "", beginn: "" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.fehler).sort(), ["beginn", "datum", "titel"]);
});

test("ungültiges Datum (31. Februar)", () => {
  const r = pruefeTermin({ ...gut, datum: "2026-02-31" });
  assert.equal(r.ok, false);
});

test("Uhrzeiten mit Sekunden werden gekürzt, 19:11 ist erlaubt", () => {
  const r = pruefeTermin({ ...gut, beginn: "19:11:00", ende: "23:30" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.daten.beginn, "19:11");
    assert.equal(r.daten.ende, "23:30");
  }
});

test("zu langer Titel", () => {
  assert.equal(pruefeTermin({ ...gut, titel: "x".repeat(121) }).ok, false);
});

test("ganztägig: Uhrzeiten werden ignoriert und nicht verlangt", () => {
  const r = pruefeTermin({ ...gut, ganztaegig: "ja", beginn: "", ende: "kaputt" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.daten.beginn, null);
    assert.equal(r.daten.ende, null);
  }
});

test("mehrtägig: Enddatum wird übernommen, gleicher Tag zählt als eintägig", () => {
  const r = pruefeTermin({ ...gut, bis_datum: "2026-11-09" });
  assert.equal(r.ok && r.daten.bis_datum, "2026-11-09");
  const gleich = pruefeTermin({ ...gut, bis_datum: "2026-11-07" });
  assert.equal(gleich.ok && gleich.daten.bis_datum, null);
});

test("Enddatum vor dem ersten Tag", () => {
  const r = pruefeTermin({ ...gut, bis_datum: "2026-11-06" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.fehler), ["bis_datum"]);
});
