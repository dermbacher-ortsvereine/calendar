import { test } from "node:test";
import assert from "node:assert/strict";
import { kontrast, pruefePasswort, pruefeVeranstalter, type VeranstalterEingabe } from "./veranstalter-validierung.ts";

const gut: VeranstalterEingabe = {
  id: "tc",
  name: " Tennisclub Dermbach ",
  kuerzel: "TC",
  farbe: "#1d5fa8",
  farbe_hg: "#E4EEF9",
  sortierung: "80",
  aktiv: true,
};

test("Kontrast: Schwarz/Weiß = 21, gleiche Farbe = 1", () => {
  assert.equal(Math.round(kontrast("#000000", "#FFFFFF")), 21);
  assert.equal(kontrast("#24573A", "#24573A"), 1);
});

test("alle Farbpaare aus der Vorgabe erfüllen WCAG AA", () => {
  const paare = [
    ["#1D5FA8", "#E4EEF9"], ["#0B6670", "#DDF1F2"], ["#3B6E12", "#E6F2D5"], ["#B3261E", "#FAE6E4"],
    ["#6B3FA0", "#EFE8F8"], ["#6B3A1E", "#F1E2D6"], ["#6E5000", "#FFE58A"],
  ];
  for (const [a, b] of paare) assert.ok(kontrast(a, b) >= 4.5, `${a} auf ${b}: ${kontrast(a, b)}`);
});

test("gültiger neuer Veranstalter wird normalisiert", () => {
  const r = pruefeVeranstalter(gut, { neu: true });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.daten.name, "Tennisclub Dermbach");
    assert.equal(r.daten.farbe, "#1D5FA8");
    assert.equal(r.daten.sortierung, 80);
  }
});

test("ungültige ID, zu langes Kürzel, zu wenig Kontrast", () => {
  const r = pruefeVeranstalter({ ...gut, id: "Tennis Club", kuerzel: "TCDER", farbe: "#DDDDDD", farbe_hg: "#FFFFFF" }, { neu: true });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.fehler).sort(), ["farbe", "id", "kuerzel"]);
});

test("ID wird beim Bearbeiten nicht geprüft", () => {
  assert.equal(pruefeVeranstalter({ ...gut, id: "" }, { neu: false }).ok, true);
});

test("Passwortregeln", () => {
  assert.ok(pruefePasswort("kurz"));
  assert.equal(pruefePasswort("lang-genug"), null);
});
