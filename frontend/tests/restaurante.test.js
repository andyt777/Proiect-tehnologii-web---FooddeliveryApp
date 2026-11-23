// Teste pentru datele restaurantelor (src/restaurante.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { RESTAURANTE_INFO, preparateRestaurant, restaurantDupaNume, restaurantDupaSlug, slugDin } from "../src/restaurante.js";
import { RESTAURANTE } from "../src/constants.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));

// --- slugDin ---

test("slugDin face din nume un text de adresă, fără diacritice și spații", () => {
  assert.equal(slugDin("Pizzeria Napoli"), "pizzeria-napoli");
  assert.equal(slugDin("Burger Van"), "burger-van");
  assert.equal(slugDin("  Țară și Șură  "), "tara-si-sura");
  assert.equal(slugDin("Sushi & Co."), "sushi-co");
});

test("slugDin întoarce text gol pentru valori lipsă", () => {
  assert.equal(slugDin(""), "");
  assert.equal(slugDin(null), "");
  assert.equal(slugDin(undefined), "");
});

// --- RESTAURANTE_INFO ---

test("RESTAURANTE_INFO are câte o intrare pentru fiecare restaurant din constants.js, în aceeași ordine", () => {
  assert.deepEqual(RESTAURANTE_INFO.map((r) => r.nume), RESTAURANTE.map((r) => r.nume));
  assert.deepEqual(RESTAURANTE_INFO.map((r) => r.slug), ["pizzeria-napoli", "burger-van", "sushi-kyo"]);
});

test("fiecare restaurant are slug unic, bucătărie, descriere și o fotografie care există în public/img", () => {
  const sluguri = new Set(RESTAURANTE_INFO.map((r) => r.slug));
  assert.equal(sluguri.size, RESTAURANTE_INFO.length);
  for (const r of RESTAURANTE_INFO) {
    assert.ok(r.bucatarie, `${r.nume} nu are bucătărie`);
    assert.ok(r.descriere, `${r.nume} nu are descriere`);
    assert.ok(r.imagine, `${r.nume} nu are fotografie`);
    assert.ok(existsSync(new URL(`../public${r.imagine}`, import.meta.url)), `lipsește ${r.imagine}`);
  }
});

test("fiecare restaurant din meniul db.json are date de prezentare", () => {
  for (const p of db.meniu) assert.ok(restaurantDupaNume(p.restaurant), `${p.restaurant} lipsește`);
});

test("RESTAURANTE_INFO e înghețat", () => {
  assert.ok(Object.isFrozen(RESTAURANTE_INFO));
  assert.ok(Object.isFrozen(RESTAURANTE_INFO[0]));
});

// --- restaurantDupaSlug / restaurantDupaNume ---

test("restaurantDupaSlug găsește restaurantul din adresă", () => {
  assert.equal(restaurantDupaSlug("sushi-kyo").nume, "Sushi Kyo");
  assert.equal(restaurantDupaSlug("pizzeria-napoli").categorie, "Pizza");
});

test("restaurantDupaSlug întoarce null pentru un slug necunoscut, scris altfel sau invalid", () => {
  assert.equal(restaurantDupaSlug("nu-exista"), null);
  assert.equal(restaurantDupaSlug("Sushi-Kyo"), null);
  assert.equal(restaurantDupaSlug(""), null);
  assert.equal(restaurantDupaSlug(undefined), null);
  assert.equal(restaurantDupaSlug("constructor"), null);
});

test("restaurantDupaNume compară exact și întoarce null pentru un nume necunoscut", () => {
  assert.equal(restaurantDupaNume("Burger Van").slug, "burger-van");
  assert.equal(restaurantDupaNume("burger van"), null);
  assert.equal(restaurantDupaNume(undefined), null);
});

// --- preparateRestaurant ---

test("preparateRestaurant întoarce cele 3 preparate ale fiecărui restaurant din db.json, în ordinea din meniu", () => {
  assert.deepEqual(preparateRestaurant(db.meniu, "Sushi Kyo").map((p) => p.id), ["p7", "p8", "p9"]);
  for (const r of RESTAURANTE_INFO) assert.equal(preparateRestaurant(db.meniu, r.nume).length, 3);
});

test("preparateRestaurant întoarce o listă goală pentru un restaurant necunoscut și nu modifică meniul", () => {
  const copie = structuredClone(db.meniu);
  assert.deepEqual(preparateRestaurant(db.meniu, "Altceva"), []);
  assert.deepEqual(db.meniu, copie);
});
