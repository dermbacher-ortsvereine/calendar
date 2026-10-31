import { test } from "node:test";
import assert from "node:assert/strict";
import { darfSchreiben, veranstalterAuswahl } from "./rechte.ts";

const liste = [
  { id: "ov", name: "Ortsvereine Dermbach", gemeinsam: true },
  { id: "vfl", name: "VfL Dermbach", gemeinsam: false },
  { id: "mv", name: "Musikverein Dermbach", gemeinsam: false },
];
const mv = { istAdmin: false, schreibbar: ["mv", "ov"] };
const admin = { istAdmin: true, schreibbar: [] };

test("darfSchreiben: eigener und gemeinsamer Veranstalter, kein fremder", () => {
  assert.equal(darfSchreiben(mv, "mv"), true);
  assert.equal(darfSchreiben(mv, "ov"), true);
  assert.equal(darfSchreiben(mv, "vfl"), false);
  assert.equal(darfSchreiben(mv, null), false);
  assert.equal(darfSchreiben(null, "mv"), false);
});

test("darfSchreiben: Admin darf alles", () => {
  assert.equal(darfSchreiben(admin, "vfl"), true);
  assert.equal(darfSchreiben(admin, null), true);
});

test("veranstalterAuswahl: eigener zuerst, gemeinsame gekennzeichnet", () => {
  assert.deepEqual(veranstalterAuswahl(mv, liste), [
    { id: "mv", name: "Musikverein Dermbach" },
    { id: "ov", name: "Ortsvereine Dermbach (gemeinsam)" },
  ]);
});

test("veranstalterAuswahl: nichts zu wählen ohne gemeinsame Veranstalter", () => {
  assert.equal(veranstalterAuswahl({ istAdmin: false, schreibbar: ["mv"] }, liste), null);
});

test("veranstalterAuswahl: Admin sieht alle", () => {
  assert.equal(veranstalterAuswahl(admin, liste)?.length, 3);
});
