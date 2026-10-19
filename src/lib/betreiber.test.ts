import { test } from "node:test";
import assert from "node:assert/strict";
import { betreiberAusEnv } from "./betreiber.ts";

test("ohne Umgebungsvariablen erscheinen Platzhalter", () => {
  const b = betreiberAusEnv({});
  assert.equal(b.name, "[Name]");
  assert.equal(b.strasse, "[Straße und Hausnummer]");
  assert.equal(b.ort, "[PLZ Ort]");
  assert.equal(b.email, "[E-Mail-Adresse]");
  assert.equal(b.telefon, null);
  assert.equal(b.vollstaendig, false);
});

test("gesetzte Werte werden übernommen und getrimmt", () => {
  const b = betreiberAusEnv({
    IMPRESSUM_NAME: " Erika Musterfrau ",
    IMPRESSUM_STRASSE: "Musterweg 1",
    IMPRESSUM_ORT: "12345 Musterstadt",
    IMPRESSUM_EMAIL: "kontakt@example.org",
    IMPRESSUM_TELEFON: "",
  });
  assert.equal(b.name, "Erika Musterfrau");
  assert.equal(b.telefon, null);
  assert.equal(b.vollstaendig, true);
});

test("leere Werte zählen als fehlend", () => {
  const b = betreiberAusEnv({
    IMPRESSUM_NAME: "Erika Musterfrau",
    IMPRESSUM_STRASSE: "   ",
    IMPRESSUM_ORT: "12345 Musterstadt",
    IMPRESSUM_EMAIL: "kontakt@example.org",
  });
  assert.equal(b.strasse, "[Straße und Hausnummer]");
  assert.equal(b.vollstaendig, false);
});
