// Teste pentru fotografiile preparatelor (src/imagini.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { IMAGINI_CATEGORIE, imagineComanda, imaginePreparat } from "../src/imagini.js";
import { CATEGORII } from "../src/categorii.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));

// „/img/x.webp” -> fișierul din frontend/public/img (Vite servește public/ de la rădăcină)
function fisierPublic(cale) {
  return new URL(`../public${cale}`, import.meta.url);
}

// --- imaginePreparat ---

test("imaginePreparat întoarce fotografia unui preparat din meniu", () => {
  assert.equal(imaginePreparat("Pizza Margherita"), "/img/pizza-margherita.webp");
  assert.equal(imaginePreparat("Gyoza cu legume (6 buc.)"), "/img/gyoza.webp");
});

test("imaginePreparat ignoră sufixul de cantitate al comenzilor („ × 2”)", () => {
  assert.equal(imaginePreparat("Pizza Diavola × 2"), "/img/pizza-diavola.webp");
  assert.equal(imaginePreparat("Platou sushi (12 buc.) × 10"), "/img/sushi-platou.webp");
});

test("imaginePreparat întoarce null pentru un preparat necunoscut, gol sau lipsă", () => {
  assert.equal(imaginePreparat("Sarmale"), null);
  assert.equal(imaginePreparat(""), null);
  assert.equal(imaginePreparat(undefined), null);
  assert.equal(imaginePreparat("constructor"), null); // nicio cheie moștenită
});

test("fiecare preparat din db.json are o fotografie, iar fișierul există în public/img", () => {
  for (const p of db.meniu) {
    const cale = imaginePreparat(p.preparat);
    assert.ok(cale, `„${p.preparat}” nu are fotografie`);
    assert.ok(existsSync(fisierPublic(cale)), `lipsește fișierul ${cale}`);
  }
});

test("fiecare comandă din meniu (nu cele speciale, Etapa 7) din db.json are fotografia preparatului ei", () => {
  for (const c of db.comenzi.filter((c) => !c.speciala)) assert.ok(imaginePreparat(c.preparat), `comanda ${c.id} nu are fotografie`);
});

// --- IMAGINI_CATEGORIE ---

test("IMAGINI_CATEGORIE are o fotografie existentă pentru fiecare categorie", () => {
  assert.deepEqual(Object.keys(IMAGINI_CATEGORIE), CATEGORII.map((c) => c.nume));
  assert.deepEqual(IMAGINI_CATEGORIE, { Pizza: "/img/pizza-diavola.webp", Burgers: "/img/burger-vita.webp", Asian: "/img/sushi-platou.webp" });
  for (const cale of Object.values(IMAGINI_CATEGORIE)) assert.ok(existsSync(fisierPublic(cale)), `lipsește fișierul ${cale}`);
});

test("IMAGINI_CATEGORIE e înghețat", () => {
  assert.ok(Object.isFrozen(IMAGINI_CATEGORIE));
});

// --- imagineComanda ---

test("imagineComanda folosește întâi fotografia preparatului", () => {
  assert.equal(imagineComanda({ preparat: "Ramen cu porc", categorie: "Asian" }), "/img/ramen-porc.webp");
  assert.equal(imagineComanda({ preparat: "Pizza Diavola × 2", categorie: "Pizza" }), "/img/pizza-diavola.webp");
});

test("imagineComanda cade pe fotografia categoriei pentru un preparat necunoscut", () => {
  assert.equal(imagineComanda({ preparat: "X", categorie: "Asian" }), "/img/sushi-platou.webp");
  assert.equal(imagineComanda({ preparat: "Burger dublu", categorie: "Burgers" }), "/img/burger-vita.webp");
});

test("imagineComanda întoarce null când nu știe nici preparatul, nici categoria", () => {
  assert.equal(imagineComanda({ preparat: "X", categorie: "Desert" }), null);
  assert.equal(imagineComanda({ preparat: "X", categorie: "toString" }), null); // nicio cheie moștenită
  assert.equal(imagineComanda({ preparat: "X" }), null);
});
