import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiname, erzeugeKalender, escapeText, foldLine, type IcalTermin } from "./ical.ts";

const basis: IcalTermin = {
  id: "11111111-2222-3333-4444-555555555555",
  titel: "Herbstkonzert",
  datum: "2026-11-07",
  beginn: "19:00:00",
  ende: null,
  ort: "Turnhalle",
  beschreibung: "Einlass ab 18:30 Uhr.",
  ansprechpartner: null,
  geaendert_am: "2026-10-19T12:34:56.789+00:00",
  veranstalterName: "Musikverein Dermbach",
};

const ics = (t: Partial<IcalTermin> = {}) =>
  erzeugeKalender([{ ...basis, ...t }], { name: "Test", basisUrl: "https://example.test" });

test("escapet Sonderzeichen", () => {
  assert.equal(escapeText("a,b;c\\d\ne"), "a\\,b\;c\\\\d\\ne");
});

test("faltet lange Zeilen auf 75 Oktette ohne UTF-8-Zeichen zu zerteilen", () => {
  const zeile = "DESCRIPTION:" + "ä".repeat(100);
  const gefaltet = foldLine(zeile).split("\r\n");
  for (const teil of gefaltet) assert.ok(new TextEncoder().encode(teil).length <= 75);
  assert.equal(gefaltet.map((t, i) => (i ? t.slice(1) : t)).join(""), zeile);
});

test("Grundstruktur mit VTIMEZONE, CRLF und stabiler UID", () => {
  const out = ics();
  assert.ok(out.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(out.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(out), "nur CRLF");
  assert.ok(out.includes("BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin"));
  assert.ok(out.includes(`UID:${basis.id}@dermbacher-ortsvereine.de`));
  assert.ok(out.includes("DTSTAMP:20261019T123456Z"));
  assert.ok(out.includes("DTSTART;TZID=Europe/Berlin:20261107T190000"));
  assert.ok(out.includes("URL:https://example.test/termin/" + basis.id));
});

test("ohne Ende kein DTEND", () => {
  assert.ok(!ics().includes("DTEND"));
});

test("Ende am selben Tag", () => {
  assert.ok(ics({ ende: "21:30:00" }).includes("DTEND;TZID=Europe/Berlin:20261107T213000"));
});

test("Ende vor Beginn endet am Folgetag (auch über Monatsgrenze)", () => {
  assert.ok(
    ics({ datum: "2026-10-31", beginn: "20:00", ende: "02:00" }).includes(
      "DTEND;TZID=Europe/Berlin:20261101T020000",
    ),
  );
});

test("Dateiname mit Umlauten", () => {
  assert.equal(dateiname({ titel: "Herbst-Frühschoppen & Grillen!", datum: "2026-10-11" }), "herbst-fruehschoppen-grillen-2026-10-11.ics");
});
