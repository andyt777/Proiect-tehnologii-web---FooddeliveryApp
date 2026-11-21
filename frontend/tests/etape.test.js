// Teste pentru pașii unei comenzi (src/etape.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { etapeComanda } from "../src/etape.js";

test("o comandă nelivrată e plasată și pe drum; livrarea urmează", () => {
  const etape = etapeComanda(false);
  assert.deepEqual(etape.map((e) => e.id), ["plasata", "pe-drum", "livrata"]);
  assert.deepEqual(etape.map((e) => e.stare), ["gata", "acum", "urmeaza"]);
  assert.deepEqual(etape.map((e) => e.curenta), [false, true, false]);
});

test("o comandă livrată are toți pașii încheiați, iar pasul curent e „Livrată”", () => {
  const etape = etapeComanda(true);
  assert.deepEqual(etape.map((e) => e.stare), ["gata", "gata", "gata"]);
  assert.deepEqual(etape.map((e) => e.curenta), [false, false, true]);
});

test("doar true înseamnă livrată: textul, numărul sau lipsa valorii contează ca nelivrată", () => {
  for (const valoare of ["true", 1, undefined, null]) {
    assert.equal(etapeComanda(valoare)[2].stare, "urmeaza");
  }
});

test("fiecare listă are exact un pas curent și textele în română", () => {
  for (const livrata of [true, false]) {
    const etape = etapeComanda(livrata);
    assert.equal(etape.filter((e) => e.curenta).length, 1);
    assert.deepEqual(etape.map((e) => e.text), ["Plasată", "Pe drum", "Livrată"]);
  }
});
