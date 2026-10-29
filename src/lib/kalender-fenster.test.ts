import { test } from "node:test";
import assert from "node:assert/strict";
import { ladeFenster, monatImFenster, VORSCHAU_TAGE } from "./kalender-fenster.ts";
import { plusTage } from "./datum.ts";

test("Standardfenster: 3 Monate zurück bis über die Vorschau hinaus", () => {
  const f = ladeFenster("2026-10-29", null);
  // Raster Juli 2026 beginnt am Montag, 29. Juni
  assert.equal(f.von, "2026-06-29");
  assert.ok(f.bis >= plusTage("2026-10-29", VORSCHAU_TAGE));
  assert.ok(monatImFenster("2026-07", f));
  assert.ok(monatImFenster("2027-10", f));
  assert.ok(!monatImFenster("2026-06", f));
  assert.ok(!monatImFenster("2028-01", f));
});

test("Monat aus der URL erweitert das Fenster", () => {
  const frueh = ladeFenster("2026-10-29", "2025-01");
  assert.ok(monatImFenster("2025-01", frueh));
  assert.ok(monatImFenster("2026-10", frueh));

  const spaet = ladeFenster("2026-10-29", "2028-05");
  assert.ok(monatImFenster("2028-05", spaet));
  assert.equal(spaet.von, ladeFenster("2026-10-29", null).von);
});
