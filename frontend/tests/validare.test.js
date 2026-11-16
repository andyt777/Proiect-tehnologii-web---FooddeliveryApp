// Teste pentru formularul „Comandă specială” (src/validare.js și src/constants.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PREPARAT_MAX, RESTAURANTE, TIPURI_LIVRARE, categorieRestaurant } from "../src/constants.js";
import { comandaSpecialaNoua, valideazaComandaSpeciala } from "../src/validare.js";
import { CATEGORII } from "../src/categorii.js";
import { ETICHETE_LIVRARE } from "../src/livrare.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const tw = JSON.parse(readFileSync(new URL("../../tw.json", import.meta.url), "utf8"));
const BUNE = Object.freeze({ preparat: "Pizza cu trufe", restaurant: "Pizzeria Napoli", livrare: "standard" });

// --- constants ---

test("RESTAURANTE are exact restaurantele din meniu, fiecare cu categoria preparatelor lui", () => {
  const dinMeniu = [...new Set(db.meniu.map((p) => p.restaurant))];
  assert.deepEqual(RESTAURANTE.map((r) => r.nume), dinMeniu);
  for (const p of db.meniu) assert.equal(categorieRestaurant(p.restaurant), p.categorie, p.preparat);
});

test("categoriile restaurantelor sunt cele cunoscute", () => {
  const nume = CATEGORII.map((c) => c.nume);
  for (const r of RESTAURANTE) assert.ok(nume.includes(r.categorie), r.nume);
});

test("categorieRestaurant: Napoli -> Pizza, Burger Van -> Burgers, Sushi Kyo -> Asian", () => {
  assert.equal(categorieRestaurant("Pizzeria Napoli"), "Pizza");
  assert.equal(categorieRestaurant("Burger Van"), "Burgers");
  assert.equal(categorieRestaurant("Sushi Kyo"), "Asian");
});

test("categorieRestaurant întoarce null pentru un restaurant necunoscut, scris altfel sau lipsă", () => {
  assert.equal(categorieRestaurant("McDonald's"), null);
  assert.equal(categorieRestaurant("pizzeria napoli"), null);
  assert.equal(categorieRestaurant(""), null);
  assert.equal(categorieRestaurant(undefined), null);
  assert.equal(categorieRestaurant("constructor"), null);
});

test("TIPURI_LIVRARE vin din livrare.js, nu sunt scrise a doua oară", () => {
  assert.deepEqual([...TIPURI_LIVRARE], Object.keys(ETICHETE_LIVRARE));
});

test("valorile fixe sunt înghețate", () => {
  assert.ok(Object.isFrozen(RESTAURANTE));
  assert.ok(Object.isFrozen(RESTAURANTE[0]));
  assert.ok(Object.isFrozen(TIPURI_LIVRARE));
});

test("PREPARAT_MAX e 60", () => {
  assert.equal(PREPARAT_MAX, 60);
});

// --- tw.json ---

test("tw.json indică resursa, titlul și starea din db.json, iar sample trece validarea", () => {
  assert.deepEqual(Object.keys(tw).sort(), ["done", "resource", "sample", "title"]);
  assert.equal(tw.resource, "comenzi");
  assert.ok(Array.isArray(db[tw.resource]));
  for (const c of db[tw.resource]) {
    assert.equal(typeof c[tw.title], "string");
    assert.equal(typeof c[tw.done], "boolean");
  }
  assert.equal(valideazaComandaSpeciala({ preparat: "Test", ...tw.sample }), null);
});

// --- valideazaComandaSpeciala ---

test("valideaza: date bune -> null", () => {
  assert.equal(valideazaComandaSpeciala(BUNE), null);
});

test("valideaza: toate combinațiile de restaurant și livrare valide trec", () => {
  for (const r of RESTAURANTE) for (const livrare of TIPURI_LIVRARE) assert.equal(valideazaComandaSpeciala({ ...BUNE, restaurant: r.nume, livrare }), null);
});

test("valideaza: preparatul gol sau doar cu spații e respins, pe câmpul preparat", () => {
  for (const preparat of ["", "   ", "\t\n"]) {
    const r = valideazaComandaSpeciala({ ...BUNE, preparat });
    assert.equal(r.camp, "preparat");
    assert.match(r.mesaj, /preparatului/);
  }
});

test("valideaza: preparatul lipsă sau care nu e text e respins", () => {
  for (const preparat of [undefined, null, 42, ["Pizza"]]) assert.equal(valideazaComandaSpeciala({ ...BUNE, preparat })?.camp, "preparat");
});

test("valideaza: exact 60 de caractere trece, 61 nu", () => {
  assert.equal(valideazaComandaSpeciala({ ...BUNE, preparat: "a".repeat(60) }), null);
  const r = valideazaComandaSpeciala({ ...BUNE, preparat: "a".repeat(61) });
  assert.equal(r.camp, "preparat");
  assert.equal(r.mesaj, "Numele preparatului are maximum 60 de caractere.");
});

test("valideaza: lungimea se măsoară după trim (spațiile de la margini nu contează)", () => {
  assert.equal(valideazaComandaSpeciala({ ...BUNE, preparat: `   ${"a".repeat(60)}   ` }), null);
});

test("valideaza: restaurantul trebuie să fie exact unul din listă", () => {
  for (const restaurant of ["", "Pizzeria", "pizzeria napoli", "constructor", undefined]) {
    assert.deepEqual(valideazaComandaSpeciala({ ...BUNE, restaurant }), { camp: "restaurant", mesaj: "Alege un restaurant din listă." });
  }
});

test("valideaza: livrarea trebuie să fie standard, express sau ridicare", () => {
  for (const livrare of ["", "Standard", "drona", "toString", undefined]) {
    assert.deepEqual(valideazaComandaSpeciala({ ...BUNE, livrare }), { camp: "livrare", mesaj: "Alege un tip de livrare din listă." });
  }
});

test("valideaza: raportează primul câmp greșit, în ordinea din formular", () => {
  assert.equal(valideazaComandaSpeciala({ preparat: "", restaurant: "x", livrare: "y" }).camp, "preparat");
  assert.equal(valideazaComandaSpeciala({ preparat: "ok", restaurant: "x", livrare: "y" }).camp, "restaurant");
});

// --- comandaSpecialaNoua ---

test("comandaSpecialaNoua construiește obiectul trimis: fără id, pret null, speciala, categoria din restaurant, data ISO", () => {
  const acum = new Date("2026-11-16T18:30:00.000Z");
  assert.deepEqual(comandaSpecialaNoua({ preparat: "  Burger cu trufe  ", restaurant: "Burger Van", livrare: "express" }, acum), {
    preparat: "Burger cu trufe",
    restaurant: "Burger Van",
    livrare: "express",
    categorie: "Burgers",
    livrata: false,
    pret: null,
    speciala: true,
    creata: "2026-11-16T18:30:00.000Z",
  });
});

test("comandaSpecialaNoua nu pune id și folosește data curentă când nu primește una", () => {
  const inainte = Date.now();
  const c = comandaSpecialaNoua(BUNE);
  assert.equal("id" in c, false);
  assert.ok(Date.parse(c.creata) >= inainte - 1000 && Date.parse(c.creata) <= Date.now() + 1000);
});

test("comandaSpecialaNoua nu modifică obiectul primit", () => {
  assert.doesNotThrow(() => comandaSpecialaNoua(BUNE));
  assert.equal(BUNE.preparat, "Pizza cu trufe");
});
