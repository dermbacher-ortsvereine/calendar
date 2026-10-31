import { test } from "node:test";
import assert from "node:assert/strict";
import { pruefeRaum, type RaumEingabe } from "./raum-validierung.ts";

const gut: RaumEingabe = { id: "kegelbahn", name: " Kegelbahn ", sortierung: "30" };

test("gültiger neuer Raum wird normalisiert", () => {
  const r = pruefeRaum(gut, { neu: true });
  assert.deepEqual(r, { ok: true, daten: { name: "Kegelbahn", sortierung: 30 } });
});

test("ungültige Kennung, leerer Name, falsche Reihenfolge", () => {
  const r = pruefeRaum({ id: "Kegel Bahn", name: "  ", sortierung: "1.5" }, { neu: true });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.fehler).sort(), ["id", "name", "sortierung"]);
});

test("beim Bearbeiten wird die Kennung nicht geprüft", () => {
  assert.equal(pruefeRaum({ ...gut, id: "" }, { neu: false }).ok, true);
});

test("leere Reihenfolge = 0, zu langer Name", () => {
  const r = pruefeRaum({ ...gut, sortierung: "" }, { neu: true });
  assert.equal(r.ok && r.daten.sortierung, 0);
  assert.equal(pruefeRaum({ ...gut, name: "x".repeat(61) }, { neu: true }).ok, false);
});
