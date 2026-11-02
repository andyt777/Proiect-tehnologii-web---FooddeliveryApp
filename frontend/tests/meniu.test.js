// Teste de integritate pentru datele meniului (src/meniu.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { MENIU } from "../src/meniu.js";
import { CATEGORII } from "../src/categorii.js"; // importul lucide-react funcționează și sub Node

const NUME_CATEGORII = CATEGORII.map((c) => c.nume);

test("MENIU nu e gol", () => {
  assert.ok(Array.isArray(MENIU));
  assert.ok(MENIU.length > 0);
});

test("MENIU are id-uri text, nevide și unice", () => {
  for (const p of MENIU) {
    assert.equal(typeof p.id, "string", `id invalid: ${p.id}`);
    assert.ok(p.id.length > 0);
  }
  const iduri = MENIU.map((p) => p.id);
  assert.equal(new Set(iduri).size, iduri.length, `id-uri duplicate: ${iduri}`);
});

test("MENIU are prețuri întregi pozitive", () => {
  for (const p of MENIU) {
    assert.ok(Number.isInteger(p.pret) && p.pret > 0, `preț invalid la ${p.id}: ${p.pret}`);
  }
});

test("MENIU folosește doar categorii existente în CATEGORII", () => {
  assert.deepEqual(NUME_CATEGORII, ["Pizza", "Burgers", "Asian"]);
  for (const p of MENIU) {
    assert.ok(NUME_CATEGORII.includes(p.categorie), `categorie necunoscută la ${p.id}: ${p.categorie}`);
  }
});

test("MENIU are preparat și restaurant completate", () => {
  for (const p of MENIU) {
    assert.equal(typeof p.preparat, "string");
    assert.ok(p.preparat.trim().length > 0, `preparat gol la ${p.id}`);
    assert.equal(typeof p.restaurant, "string");
    assert.ok(p.restaurant.trim().length > 0, `restaurant gol la ${p.id}`);
  }
});
