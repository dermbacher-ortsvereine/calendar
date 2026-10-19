import { test } from "node:test";
import assert from "node:assert/strict";
import { inBerlin, parseZeitraum, pruefeReservierung, wochenMontag, zeitraumLiteral, type ReservierungEingabe } from "./reservierung.ts";

const gut: ReservierungEingabe = {
  raum_id: "stueffjen",
  datum: "2026-10-21",
  von: "19:00",
  bis: "22:00",
  zweck: " Vorstandssitzung ",
  ansprechpartner: "",
  telefon: "",
  veranstalter_id: "mv",
};

test("Zeitraum-Literal in Berliner Zeit", () => {
  assert.equal(zeitraumLiteral("2026-10-21", "19:00", "22:00"), '["2026-10-21 19:00 Europe/Berlin","2026-10-21 22:00 Europe/Berlin")');
});

test("Bis vor Von endet am Folgetag", () => {
  assert.equal(zeitraumLiteral("2026-12-31", "20:00:00", "02:00"), '["2026-12-31 20:00 Europe/Berlin","2027-01-01 02:00 Europe/Berlin")');
});

test("Prüfung: gültig und bereinigt", () => {
  const r = pruefeReservierung(gut, ["stueffjen", "schulungsraum"]);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.daten.zweck, "Vorstandssitzung");
    assert.equal(r.daten.telefon, null);
  }
});

test("Prüfung: unbekannter Raum, fehlende Zeiten, gleiche Zeiten", () => {
  const r1 = pruefeReservierung({ ...gut, raum_id: "keller", von: "", bis: "" }, ["stueffjen"]);
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.deepEqual(Object.keys(r1.fehler).sort(), ["bis", "raum_id", "von"]);
  const r2 = pruefeReservierung({ ...gut, bis: "19:00" }, ["stueffjen"]);
  assert.equal(r2.ok, false);
});

test("Postgres-Range parsen und in Berliner Zeit umrechnen (Sommer- und Winterzeit)", () => {
  const sommer = parseZeitraum('["2026-10-21 17:00:00+00","2026-10-21 20:00:00+00")');
  assert.ok(sommer);
  assert.deepEqual(inBerlin(sommer.start), { datum: "2026-10-21", zeit: "19:00" });
  const winter = parseZeitraum('["2026-11-21 18:00:00+00","2026-11-21 23:30:00+00")');
  assert.ok(winter);
  assert.deepEqual(inBerlin(winter.ende), { datum: "2026-11-22", zeit: "00:30" });
});

test("Wochenmontag", () => {
  assert.equal(wochenMontag("2026-10-19"), "2026-10-19");
  assert.equal(wochenMontag("2026-10-25"), "2026-10-19");
  assert.equal(wochenMontag("2026-11-01"), "2026-10-26");
});
