// Teste pentru filtrul de categorie al meniului (src/categorii.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATEGORII, potrivesteCategoria } from "../src/categorii.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));
const PIZZA = Object.freeze({ id: "p1", preparat: "Pizza Margherita", categorie: "Pizza" });

test("potrivesteCategoria: null („Toate”) potrivește orice preparat", () => {
  assert.equal(potrivesteCategoria(PIZZA, null), true);
  assert.equal(potrivesteCategoria(PIZZA, undefined), true);
});

test("potrivesteCategoria: aceeași categorie potrivește", () => {
  assert.equal(potrivesteCategoria(PIZZA, "Pizza"), true);
});

test("potrivesteCategoria: altă categorie nu potrivește (fără potriviri parțiale sau după litere mici)", () => {
  assert.equal(potrivesteCategoria(PIZZA, "Asian"), false);
  assert.equal(potrivesteCategoria(PIZZA, "pizza"), false);
  assert.equal(potrivesteCategoria(PIZZA, "Pizz"), false);
});

test("fiecare categorie are câte 3 preparate în db.json, iar împreună acoperă tot meniul", () => {
  let suma = 0;
  for (const cat of CATEGORII) {
    const numar = db.meniu.filter((p) => potrivesteCategoria(p, cat.nume)).length;
    assert.equal(numar, 3, `${cat.nume}: ${numar}`);
    suma += numar;
  }
  assert.equal(suma, db.meniu.length);
});
