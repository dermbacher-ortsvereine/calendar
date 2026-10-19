import { test } from "node:test";
import assert from "node:assert/strict";
import { sichererPfad } from "./pfad.ts";

test("interne Pfade bleiben erhalten", () => {
  assert.equal(sichererPfad("/verwaltung"), "/verwaltung");
  assert.equal(sichererPfad("/raeume?raum=stueffjen&datum=2026-10-22"), "/raeume?raum=stueffjen&datum=2026-10-22");
});

test("fremde Ziele werden abgelehnt", () => {
  for (const boese of [
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r//evil.com",
    "\t//evil.com",
    "javascript:alert(1)",
    "",
    null,
    42,
  ]) {
    assert.equal(sichererPfad(boese), "/verwaltung", `abgelehnt: ${JSON.stringify(boese)}`);
  }
});
