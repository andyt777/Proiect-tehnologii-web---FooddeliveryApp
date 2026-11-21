// Teste pentru rezumatul comenzilor și textele din hero (src/rezumat.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arePret, formatFaraPret, frazaRezumat, formatPreparate, formatRestaurante, restauranteDinMeniu, rezumatComenzi, sumaPreturi } from "../src/rezumat.js";

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
    faraPret: 0,
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

test("rezumatComenzi ignoră pret: null în total, dar numără comanda peste tot (Etapa 7)", () => {
  const r = rezumatComenzi([
    { livrata: false, pret: 42, categorie: "Pizza", livrare: "express" },
    { livrata: false, pret: null, categorie: "Pizza", livrare: "standard", speciala: true },
    { livrata: true, pret: null, categorie: "Asian", livrare: "ridicare", speciala: true },
  ]);
  assert.equal(r.numar, 3);
  assert.equal(r.total, 42);
  assert.equal(r.faraPret, 2);
  assert.equal(r.peDrum, 2);
  assert.equal(r.livrate, 1);
  assert.deepEqual(r.peCategorie, { Pizza: 2, Burgers: 0, Asian: 1 });
  assert.deepEqual(r.peLivrare, { standard: 1, express: 1, ridicare: 1 });
  assert.ok(Number.isFinite(r.total));
});

test("rezumatComenzi pe db.json nu are prețuri neconfirmate", () => {
  assert.equal(rezumatComenzi(db.comenzi).faraPret, 0);
});

// --- arePret / sumaPreturi / formatFaraPret ---

test("arePret: doar numerele finite sunt prețuri", () => {
  assert.equal(arePret({ pret: 42 }), true);
  assert.equal(arePret({ pret: 0 }), true);
  assert.equal(arePret({ pret: null }), false);
  assert.equal(arePret({}), false);
  assert.equal(arePret({ pret: "42" }), false);
  assert.equal(arePret({ pret: NaN }), false);
  assert.equal(arePret({ pret: Infinity }), false);
});

test("sumaPreturi adună doar prețurile cunoscute și numără restul", () => {
  assert.deepEqual(sumaPreturi([{ pret: 10 }, { pret: null }, { pret: 5 }, {}]), { suma: 15, faraPret: 2 });
  assert.deepEqual(sumaPreturi([{ pret: null }]), { suma: 0, faraPret: 1 });
  assert.deepEqual(sumaPreturi([]), { suma: 0, faraPret: 0 });
});

test("formatFaraPret respectă acordul în română", () => {
  assert.equal(formatFaraPret(1), "+ 1 preț la confirmare");
  assert.equal(formatFaraPret(2), "+ 2 prețuri la confirmare");
  assert.equal(formatFaraPret(20), "+ 20 de prețuri la confirmare");
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

// --- frazaRezumat (redesign „Pădure”: rezumatul ca text, în locul plăcilor bento) ---

test("frazaRezumat pe db.json: 6 comenzi, 3 pe drum, 3 livrate, 331 lei", () => {
  assert.equal(frazaRezumat(db.comenzi), "6 comenzi: 3 pe drum, 3 livrate. Total: 331 lei.");
});

test("frazaRezumat întoarce text gol pentru o listă goală", () => {
  assert.equal(frazaRezumat([]), "");
});

test("frazaRezumat face acordul la singular și adaugă prețurile la confirmare", () => {
  const comenzi = [
    { livrata: true, pret: 42, categorie: "Pizza", livrare: "express" },
    { livrata: false, pret: null, speciala: true, categorie: "Pizza", livrare: "standard" },
  ];
  assert.equal(frazaRezumat(comenzi), "2 comenzi: 1 pe drum, 1 livrată. Total: 42 lei + 1 preț la confirmare.");
  assert.equal(frazaRezumat([comenzi[0]]), "1 comandă: 0 pe drum, 1 livrată. Total: 42 lei.");
});
