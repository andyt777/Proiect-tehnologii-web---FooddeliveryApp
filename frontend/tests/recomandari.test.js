// Teste pentru rândul „Pentru tine” (src/recomandari.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RECOMANDARI_MAX, despartePreparat, explicatieRecomandari, recomandari } from "../src/recomandari.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const MENIU = db.meniu;
const nume = (rezultat) => rezultat.preparate.map((p) => p.preparat);

function comanda(preparat, categorie, extra = {}) {
  return { preparat, categorie, livrata: false, livrare: "standard", pret: 40, ...extra };
}

// --- despartePreparat ---

test("despartePreparat citește cantitatea din sufixul „× N”", () => {
  assert.deepEqual(despartePreparat("Pizza Diavola × 2"), { baza: "Pizza Diavola", cantitate: 2 });
  assert.deepEqual(despartePreparat("Platou sushi (12 buc.) × 10"), { baza: "Platou sushi (12 buc.)", cantitate: 10 });
});

test("despartePreparat: fără sufix, cantitatea e 1", () => {
  assert.deepEqual(despartePreparat("Ramen cu porc"), { baza: "Ramen cu porc", cantitate: 1 });
  assert.deepEqual(despartePreparat("Pizza x 2"), { baza: "Pizza x 2", cantitate: 1 });
});

test("despartePreparat: un nume care nu e text nu contează", () => {
  for (const v of [null, undefined, 5, {}]) assert.deepEqual(despartePreparat(v), { baza: "", cantitate: 0 });
});

// --- recomandari: fără istoric ---

test("RECOMANDARI_MAX este 4", () => {
  assert.equal(RECOMANDARI_MAX, 4);
});

test("recomandari fără istoric nu recomandă nimic", () => {
  const r = recomandari([], MENIU);
  assert.deepEqual(r.preparate, []);
  assert.equal(r.regula, null);
  assert.equal(r.categorie, null);
  assert.equal(explicatieRecomandari(r), "");
});

test("recomandari pe intrări invalide nu recomandă nimic și nu aruncă", () => {
  assert.equal(recomandari(null, MENIU).regula, null);
  assert.equal(recomandari([comanda("Pizza Diavola", "Pizza")], null).regula, null);
  assert.equal(recomandari([comanda("Pizza Diavola", "Pizza")], []).regula, null);
  assert.equal(recomandari([null, 5, "x", {}], MENIU).regula, null);
});

test("recomandari: comenzile anulate și respinse nu contează ca istoric", () => {
  const r = recomandari([comanda("Pizza Diavola", "Pizza", { stare: "anulata" }), comanda("Ramen cu porc", "Asian", { stare: "respinsa" })], MENIU);
  assert.equal(r.regula, null);
});

test("recomandari: cantitatea 0 nu contează", () => {
  assert.equal(recomandari([comanda("Pizza Diavola × 0", "Pizza")], MENIU).regula, null);
});

// --- regula 1: categoria favorită ---

test("recomandari regula 1: preparatele neîncercate din categoria cea mai comandată", () => {
  const r = recomandari([comanda("Pizza Margherita", "Pizza")], MENIU);
  assert.equal(r.regula, "categorie");
  assert.equal(r.categorie, "Pizza");
  assert.deepEqual(nume(r), ["Pizza Diavola", "Pizza Quattro Formaggi"]);
  assert.match(explicatieRecomandari(r), /categoria Pizza/);
});

test("recomandari numără bucățile, nu comenzile, la alegerea categoriei", () => {
  const r = recomandari([comanda("Pizza Margherita", "Pizza"), comanda("Ramen cu porc", "Asian"), comanda("Burger vegetarian × 3", "Burgers")], MENIU);
  assert.equal(r.categorie, "Burgers");
  assert.deepEqual(nume(r), ["Burger de vită cu cartofi", "Burger cu pui crocant"]);
});

test("recomandari: la egalitate câștigă prima categorie din meniu", () => {
  const r = recomandari([comanda("Ramen cu porc", "Asian"), comanda("Pizza Margherita", "Pizza")], MENIU);
  assert.equal(r.categorie, "Pizza");
});

test("recomandari ignoră istoricul anulat la numărarea categoriei", () => {
  const r = recomandari([comanda("Pizza Margherita × 5", "Pizza", { stare: "anulata" }), comanda("Ramen cu porc", "Asian")], MENIU);
  assert.equal(r.categorie, "Asian");
});

test("recomandari respectă numărul maxim cerut", () => {
  const meniuMare = Array.from({ length: 10 }, (_, i) => ({ preparat: `Pizza ${i}`, categorie: "Pizza" }));
  assert.equal(recomandari([comanda("Pizza 0", "Pizza")], meniuMare).preparate.length, RECOMANDARI_MAX);
  assert.equal(recomandari([comanda("Pizza 0", "Pizza")], meniuMare, 2).preparate.length, 2);
});

// --- regula 2: cele mai comandate ---

test("recomandari regula 2: dacă ai încercat toată categoria, arată preparatele comandate cel mai des", () => {
  const r = recomandari([
    comanda("Pizza Margherita", "Pizza"),
    comanda("Pizza Diavola × 3", "Pizza"),
    comanda("Pizza Quattro Formaggi × 2", "Pizza"),
  ], MENIU);
  assert.equal(r.regula, "populare");
  assert.equal(r.categorie, null);
  assert.deepEqual(nume(r), ["Pizza Diavola", "Pizza Quattro Formaggi", "Pizza Margherita"]);
  assert.match(explicatieRecomandari(r), /cel mai des/);
});

test("recomandari regula 2 adună aceeași bucată din mai multe comenzi și respectă maximul", () => {
  const r = recomandari([
    comanda("Pizza Margherita", "Pizza"),
    comanda("Pizza Margherita × 4", "Pizza"),
    comanda("Pizza Diavola × 3", "Pizza"),
    comanda("Pizza Quattro Formaggi", "Pizza"),
  ], MENIU, 2);
  assert.deepEqual(nume(r), ["Pizza Margherita", "Pizza Diavola"]);
});

test("recomandari: istoric doar cu preparate care nu sunt în meniu (fără categorie) nu recomandă nimic", () => {
  const r = recomandari([comanda("Tort aniversar", undefined, { speciala: true, pret: null })], MENIU);
  assert.equal(r.regula, null);
  assert.deepEqual(r.preparate, []);
});

test("recomandari pe istoricul din db.json: Pizza are 3 bucăți (Diavola × 2), mai mult decât Burgers și Asian", () => {
  const r = recomandari(db.comenzi, MENIU);
  assert.equal(r.regula, "categorie");
  assert.equal(r.categorie, "Pizza");
  assert.deepEqual(nume(r), ["Pizza Quattro Formaggi"]);
});

test("recomandari nu modifică meniul sau comenzile primite", () => {
  const meniu = Object.freeze(MENIU.map((p) => Object.freeze({ ...p })));
  const comenzi = Object.freeze([Object.freeze(comanda("Pizza Margherita", "Pizza"))]);
  assert.doesNotThrow(() => recomandari(comenzi, meniu));
});

test("explicatieRecomandari pe valori lipsă întoarce text gol", () => {
  assert.equal(explicatieRecomandari(null), "");
  assert.equal(explicatieRecomandari(undefined), "");
  assert.equal(explicatieRecomandari({ regula: "altceva" }), "");
});
