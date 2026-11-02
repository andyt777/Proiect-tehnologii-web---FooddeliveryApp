// Teste de integritate pentru datele serverului mock (db.json), rulate cu `node --test`.
// Citim fișierul direct, fără server: verificăm că json-server va servi date pe care aplicația le poate afișa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATEGORII } from "../src/categorii.js"; // importul lucide-react funcționează și sub Node
import { ETICHETE_LIVRARE } from "../src/livrare.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const NUME_CATEGORII = CATEGORII.map((c) => c.nume);
const TIPURI_LIVRARE = Object.keys(ETICHETE_LIVRARE);

// „Pizza Diavola × 2” -> { baza: "Pizza Diavola", cantitate: 2 }; fără sufix, cantitatea e 1 (aceeași formă ca în cosInComenzi)
function despartePreparat(preparat) {
  const potrivire = preparat.match(/^(.*) × (\d+)$/);
  return potrivire ? { baza: potrivire[1], cantitate: Number(potrivire[2]) } : { baza: preparat, cantitate: 1 };
}

// --- structura ---

test("db.json are exact resursele comenzi și meniu, ambele liste", () => {
  assert.deepEqual(Object.keys(db).sort(), ["comenzi", "meniu"]);
  assert.ok(Array.isArray(db.comenzi));
  assert.ok(Array.isArray(db.meniu));
});

// --- comenzi ---

test("comenzi are cel puțin 5 elemente", () => {
  assert.ok(db.comenzi.length >= 5, `doar ${db.comenzi.length} comenzi`);
});

test("comenzi are id-uri numerice întregi, pozitive și unice", () => {
  for (const c of db.comenzi) assert.ok(Number.isInteger(c.id) && c.id > 0, `id invalid: ${c.id}`);
  const iduri = db.comenzi.map((c) => c.id);
  assert.equal(new Set(iduri).size, iduri.length, `id-uri duplicate: ${iduri}`);
});

test("comenzi are toate câmpurile obligatorii, cu tipurile corecte", () => {
  for (const c of db.comenzi) {
    assert.deepEqual(Object.keys(c).sort(), ["categorie", "id", "livrare", "livrata", "preparat", "pret", "restaurant"], `câmpuri greșite la ${c.id}`);
    assert.equal(typeof c.livrata, "boolean", `livrata la ${c.id}`);
    assert.ok(typeof c.preparat === "string" && c.preparat.trim().length > 0 && c.preparat.length <= 100, `preparat la ${c.id}`);
    assert.ok(typeof c.restaurant === "string" && c.restaurant.trim().length > 0, `restaurant la ${c.id}`);
  }
});

test("comenzi folosește doar tipuri de livrare și categorii cunoscute", () => {
  for (const c of db.comenzi) {
    assert.ok(TIPURI_LIVRARE.includes(c.livrare), `livrare necunoscută la ${c.id}: ${c.livrare}`);
    assert.ok(NUME_CATEGORII.includes(c.categorie), `categorie necunoscută la ${c.id}: ${c.categorie}`);
  }
});

test("comenzi are prețuri întregi pozitive", () => {
  for (const c of db.comenzi) assert.ok(Number.isInteger(c.pret) && c.pret > 0, `preț invalid la ${c.id}: ${c.pret}`);
});

test("comenzi sunt variate: ambele stări, toate tipurile de livrare, toate categoriile", () => {
  assert.deepEqual(new Set(db.comenzi.map((c) => c.livrata)), new Set([true, false]));
  assert.deepEqual(new Set(db.comenzi.map((c) => c.livrare)), new Set(TIPURI_LIVRARE));
  assert.deepEqual(new Set(db.comenzi.map((c) => c.categorie)), new Set(NUME_CATEGORII));
});

test("primele trei comenzi sunt cele din README", () => {
  assert.deepEqual(db.comenzi.slice(0, 3).map((c) => [c.id, c.preparat, c.livrata, c.livrare, c.pret]), [
    [1, "Pizza Margherita", false, "express", 42],
    [2, "Burger de vită cu cartofi", true, "standard", 48],
    [3, "Platou sushi (12 buc.)", false, "ridicare", 65],
  ]);
});

// --- meniu ---

test("meniu are 9 preparate cu id-uri text, nevide și unice", () => {
  assert.equal(db.meniu.length, 9);
  for (const p of db.meniu) assert.ok(typeof p.id === "string" && p.id.length > 0, `id invalid: ${p.id}`);
  const iduri = db.meniu.map((p) => p.id);
  assert.equal(new Set(iduri).size, iduri.length, `id-uri duplicate: ${iduri}`);
});

test("meniu are câmpurile obligatorii, prețuri întregi pozitive și categorii cunoscute", () => {
  assert.deepEqual(NUME_CATEGORII, ["Pizza", "Burgers", "Asian"]);
  for (const p of db.meniu) {
    assert.deepEqual(Object.keys(p).sort(), ["categorie", "id", "preparat", "pret", "restaurant"], `câmpuri greșite la ${p.id}`);
    assert.ok(typeof p.preparat === "string" && p.preparat.trim().length > 0, `preparat gol la ${p.id}`);
    assert.ok(typeof p.restaurant === "string" && p.restaurant.trim().length > 0, `restaurant gol la ${p.id}`);
    assert.ok(Number.isInteger(p.pret) && p.pret > 0, `preț invalid la ${p.id}: ${p.pret}`);
    assert.ok(NUME_CATEGORII.includes(p.categorie), `categorie necunoscută la ${p.id}: ${p.categorie}`);
  }
});

// --- legătura comenzi <-> meniu ---

test("fiecare comandă e un preparat din meniu, cu același restaurant, categorie și preț × cantitate", () => {
  for (const c of db.comenzi) {
    const { baza, cantitate } = despartePreparat(c.preparat);
    const produs = db.meniu.find((p) => p.preparat === baza);
    assert.ok(produs, `„${baza}” (comanda ${c.id}) nu există în meniu`);
    assert.equal(c.restaurant, produs.restaurant, `restaurant diferit la ${c.id}`);
    assert.equal(c.categorie, produs.categorie, `categorie diferită la ${c.id}`);
    assert.equal(c.pret, produs.pret * cantitate, `preț diferit la ${c.id}`);
  }
});
