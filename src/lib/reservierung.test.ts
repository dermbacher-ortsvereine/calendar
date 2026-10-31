import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inBerlin,
  parseZeitraum,
  pruefeReservierung,
  pruefeSperre,
  sperrTage,
  sperrZeitraumLiteral,
  ueberschneiden,
  wiederholungsTage,
  wiederholungsText,
  wochenMontag,
  wochentagImMonat,
  zeitraumGrenzen,
  zeitraumLiteral,
  type ReservierungEingabe,
} from "./reservierung.ts";

const gut: ReservierungEingabe = {
  raum_id: "stueffjen",
  datum: "2026-10-21",
  von: "19:00",
  bis: "22:00",
  zweck: " Vorstandssitzung ",
  ansprechpartner: "",
  telefon: "",
  veranstalter_id: "mv",
  wiederholung: "",
  wiederholen_bis: "",
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

test("Sperre: ganze Tage in Berliner Zeit, ohne Bis-Datum nur ein Tag", () => {
  assert.equal(sperrZeitraumLiteral("2026-10-24", ""), '["2026-10-24 00:00 Europe/Berlin","2026-10-25 00:00 Europe/Berlin")');
  assert.equal(sperrZeitraumLiteral("2026-12-30", "2027-01-02"), '["2026-12-30 00:00 Europe/Berlin","2027-01-03 00:00 Europe/Berlin")');
});

test("Sperre: Prüfung", () => {
  const gutS = { raum_id: "stueffjen", datum: "2026-11-06", bis_datum: "2026-11-08", hinweis: " Kirmes " };
  const r = pruefeSperre(gutS, ["stueffjen"]);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.daten.zweck, "Kirmes");
  const r2 = pruefeSperre({ ...gutS, bis_datum: "2026-11-05", hinweis: "  " }, ["stueffjen"]);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.deepEqual(Object.keys(r2.fehler).sort(), ["bis_datum", "hinweis"]);
  const r3 = pruefeSperre({ ...gutS, bis_datum: "2027-11-08" }, ["stueffjen"]);
  assert.equal(r3.ok, false);
});

test("Sperre: gesperrte Tage aus dem Zeitraum (über die Zeitumstellung)", () => {
  // 24.10. 00:00 MESZ bis 26.10. 00:00 MEZ (Zeitumstellung am 25.10.)
  const z = parseZeitraum('["2026-10-23 22:00:00+00","2026-10-25 23:00:00+00")');
  assert.ok(z);
  assert.deepEqual(sperrTage(z), { von: "2026-10-24", bis: "2026-10-25" });
});

test("Wiederholung: wöchentlich und alle 2 Wochen bis einschließlich Enddatum", () => {
  assert.deepEqual(wiederholungsTage("2026-11-03", "woechentlich", "2026-11-24"), ["2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24"]);
  assert.deepEqual(wiederholungsTage("2026-11-03", "zweiwoechentlich", "2026-11-30"), ["2026-11-03", "2026-11-17"]);
  assert.deepEqual(wiederholungsTage("2026-12-29", "woechentlich", "2027-01-05"), ["2026-12-29", "2027-01-05"]);
});

test("Wiederholung: monatlich am n-ten bzw. letzten Wochentag", () => {
  // Di, 3. Nov. 2026 = 1. Dienstag
  assert.deepEqual(wiederholungsTage("2026-11-03", "monatlich", "2027-02-28"), ["2026-11-03", "2026-12-01", "2027-01-05", "2027-02-02"]);
  // Mo, 30. Nov. 2026 = letzter Montag
  assert.equal(wochentagImMonat("2026-11-30"), -1);
  assert.deepEqual(wiederholungsTage("2026-11-30", "monatlich", "2027-01-31"), ["2026-11-30", "2026-12-28", "2027-01-25"]);
});

test("Wiederholung: Texte zum gewählten Datum", () => {
  assert.equal(wiederholungsText("woechentlich", "2026-11-03"), "Jede Woche (dienstags)");
  assert.equal(wiederholungsText("monatlich", "2026-11-03"), "Jeden Monat am 1. Dienstag");
  assert.equal(wiederholungsText("monatlich", "2026-11-30"), "Jeden Monat am letzten Montag");
  assert.equal(wiederholungsText("woechentlich", ""), "Jede Woche");
});

test("Wiederholung: Prüfung des Enddatums", () => {
  const raeume = ["stueffjen"];
  const reihe = { ...gut, datum: "2026-11-03", wiederholung: "woechentlich" };
  const fehlt = pruefeReservierung({ ...reihe, wiederholen_bis: "" }, raeume);
  assert.equal(fehlt.ok, false);
  const zuWeit = pruefeReservierung({ ...reihe, wiederholen_bis: "2027-12-01" }, raeume);
  assert.equal(zuWeit.ok, false);
  const ok = pruefeReservierung({ ...reihe, wiederholen_bis: "2026-11-17" }, raeume);
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.tage, ["2026-11-03", "2026-11-10", "2026-11-17"]);
  assert.equal(pruefeReservierung({ ...reihe, wiederholung: "taeglich", wiederholen_bis: "2026-11-17" }, raeume).ok, false);
});

test("Zeitraum-Grenzen in Berliner Zeit (Winter, Sommer, über Mitternacht)", () => {
  const w = zeitraumGrenzen("2026-11-03", "19:00", "22:00");
  assert.equal(w.start.toISOString(), "2026-11-03T18:00:00.000Z");
  assert.equal(w.ende.toISOString(), "2026-11-03T21:00:00.000Z");
  const s = zeitraumGrenzen("2026-07-01", "19:00", "01:00");
  assert.equal(s.start.toISOString(), "2026-07-01T17:00:00.000Z");
  assert.equal(s.ende.toISOString(), "2026-07-01T23:00:00.000Z");
  const belegt = parseZeitraum('["2026-11-03 20:00:00+00","2026-11-03 23:00:00+00")')!;
  assert.equal(ueberschneiden(w, belegt), true);
  assert.equal(ueberschneiden(zeitraumGrenzen("2026-11-03", "17:00", "19:00"), parseZeitraum('["2026-11-03 18:00:00+00","2026-11-03 19:00:00+00")')!), false);
});
