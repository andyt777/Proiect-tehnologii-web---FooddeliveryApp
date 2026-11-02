// Teste pentru formatările românești (src/format.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLei, formatComenzi, formatProduse } from "../src/format.js";

// --- formatLei ---
// Valorile așteptate au fost verificate pe Node 24 (ICU complet): "ro-RO" folosește punct pentru mii și virgulă pentru zecimale

test("formatLei afișează sumele mici fără separator", () => {
  assert.equal(formatLei(0), "0 lei");
  assert.equal(formatLei(42), "42 lei");
  assert.equal(formatLei(999), "999 lei");
});

test("formatLei folosește punctul ca separator de mii", () => {
  assert.equal(formatLei(1000), "1.000 lei");
  assert.equal(formatLei(1250), "1.250 lei");
  assert.equal(formatLei(12345), "12.345 lei");
  assert.equal(formatLei(1234567), "1.234.567 lei");
});

test("formatLei folosește virgula pentru zecimale", () => {
  assert.equal(formatLei(42.5), "42,5 lei");
});

// --- formatComenzi / formatProduse ---
// Regula: „de” apare de la 20 în sus, cu excepția numerelor care se termină în 01–19 (101, 119)

const CAZURI = [
  [0, "0 comenzi", "0 produse"],
  [1, "1 comandă", "1 produs"],
  [2, "2 comenzi", "2 produse"],
  [19, "19 comenzi", "19 produse"],
  [20, "20 de comenzi", "20 de produse"],
  [21, "21 de comenzi", "21 de produse"],
  [100, "100 de comenzi", "100 de produse"],
  [101, "101 comenzi", "101 produse"],
  [119, "119 comenzi", "119 produse"],
  [120, "120 de comenzi", "120 de produse"],
];

for (const [numar, comenzi] of CAZURI) {
  test(`formatComenzi(${numar}) întoarce „${comenzi}”`, () => {
    assert.equal(formatComenzi(numar), comenzi);
  });
}

for (const [numar, , produse] of CAZURI) {
  test(`formatProduse(${numar}) întoarce „${produse}”`, () => {
    assert.equal(formatProduse(numar), produse);
  });
}
