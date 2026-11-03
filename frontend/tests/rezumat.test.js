// Teste pentru rezumatul comenzilor și textele din hero (src/rezumat.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatPreparate, formatRestaurante, restauranteDinMeniu, rezumatComenzi } from "../src/rezumat.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));

// --- rezumatComenzi ---

test("rezumatComenzi pe datele din db.json: 6 comenzi, 331 lei, 3 pe drum, 3 livrate", () => {
  const r = rezumatComenzi(db.comenzi);
  assert.equal(r.numar, 6);
  assert.equal(r.total, 331);
  assert.equal(r.peDrum, 3);
  assert.equal(r.livrate, 3);
});

test("rezumatComenzi numără câte 2 comenzi pe categorie și pe tip de livrare în db.json", () => {
  const r = rezumatComenzi(db.comenzi);
  assert.deepEqual(r.peCategorie, { Pizza: 2, Burgers: 2, Asian: 2 });
  assert.deepEqual(r.peLivrare, { standard: 2, express: 2, ridicare: 2 });
});

test("rezumatComenzi pe o listă goală: doar zerouri, cu toate cheile, fără NaN", () => {
  assert.deepEqual(rezumatComenzi([]), {
    numar: 0,
    total: 0,
    peDrum: 0,
    livrate: 0,
    peCategorie: { Pizza: 0, Burgers: 0, Asian: 0 },
    peLivrare: { standard: 0, express: 0, ridicare: 0 },
  });
});

test("rezumatComenzi ignoră categoriile și livrările necunoscute, dar le numără în total", () => {
  const r = rezumatComenzi([
    { livrata: false, pret: 10, categorie: "Desert", livrare: "drona" },
    { livrata: true, pret: 5, categorie: "constructor", livrare: "toString" },
  ]);
  assert.equal(r.numar, 2);
  assert.equal(r.total, 15);
  assert.equal(r.peDrum, 1);
  assert.equal(r.livrate, 1);
  assert.deepEqual(r.peCategorie, { Pizza: 0, Burgers: 0, Asian: 0 });
  assert.deepEqual(r.peLivrare, { standard: 0, express: 0, ridicare: 0 });
});

test("rezumatComenzi nu modifică lista primită", () => {
  const lista = Object.freeze([Object.freeze({ livrata: false, pret: 42, categorie: "Pizza", livrare: "express" })]);
  assert.doesNotThrow(() => rezumatComenzi(lista));
});

// --- restauranteDinMeniu ---

test("restauranteDinMeniu întoarce restaurantele unice, în ordinea din meniu", () => {
  assert.deepEqual(restauranteDinMeniu(db.meniu), ["Pizzeria Napoli", "Burger Van", "Sushi Kyo"]);
});

test("restauranteDinMeniu pe un meniu gol întoarce o listă goală", () => {
  assert.deepEqual(restauranteDinMeniu([]), []);
});

// --- formatRestaurante / formatPreparate ---

const CAZURI = [
  [0, "0 restaurante", "0 preparate"],
  [1, "1 restaurant", "1 preparat"],
  [3, "3 restaurante", "3 preparate"],
  [19, "19 restaurante", "19 preparate"],
  [20, "20 de restaurante", "20 de preparate"],
  [101, "101 restaurante", "101 preparate"],
  [120, "120 de restaurante", "120 de preparate"],
];

for (const [numar, restaurante, preparate] of CAZURI) {
  test(`formatRestaurante(${numar}) = „${restaurante}”, formatPreparate(${numar}) = „${preparate}”`, () => {
    assert.equal(formatRestaurante(numar), restaurante);
    assert.equal(formatPreparate(numar), preparate);
  });
}
