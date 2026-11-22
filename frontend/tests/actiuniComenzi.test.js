// Teste pentru corpurile PATCH cu verificarea rolului (src/actiuniComenzi.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { patchPasLivrare, patchTranzitie } from "../src/actiuniComenzi.js";
import { aplicaPasLivrare, aplicaTranzitie, campuriInitiale } from "../src/stari.js";

const ACUM = new Date("2026-11-22T18:00:00.000Z");
const MAI_TARZIU = new Date("2026-11-22T18:10:00.000Z");

function comandaIn(stari, { livrare = "standard", metodaPlata = "numerar", extra = {} } = {}) {
  let c = { id: 1, preparat: "Pizza Diavola", livrata: false, livrare, categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 48, ...campuriInitiale({ livrare, metodaPlata }, ACUM), ...extra };
  for (const stare of stari) c = { ...c, ...aplicaTranzitie(c, stare, ACUM) };
  return c;
}

// --- patchTranzitie ---

test("patchTranzitie: restaurantul acceptă o comandă plasată, cu timpul de preparare", () => {
  const c = comandaIn([]);
  const patch = patchTranzitie(c, "acceptata", "restaurant", MAI_TARZIU, { timpPreparare: 25 });
  assert.deepEqual(patch, aplicaTranzitie(c, "acceptata", MAI_TARZIU, { timpPreparare: 25 }));
  assert.equal(patch.stare, "acceptata");
  assert.equal(patch.timpPreparare, 25);
  assert.equal(patch.istoric.at(-1).la, MAI_TARZIU.toISOString());
});

test("patchTranzitie: clientul nu poate accepta o comandă (rol nepermis)", () => {
  assert.throws(() => patchTranzitie(comandaIn([]), "acceptata", "client", MAI_TARZIU), /nu mai poate trece în „Acceptată”/);
});

test("patchTranzitie: un rol necunoscut e refuzat", () => {
  for (const rol of ["hacker", "", null, undefined, "Admin"]) assert.throws(() => patchTranzitie(comandaIn([]), "acceptata", rol, MAI_TARZIU), Error, String(rol));
});

test("patchTranzitie: clientul poate anula până începe prepararea, apoi doar adminul", () => {
  assert.equal(patchTranzitie(comandaIn(["acceptata"]), "anulata", "client", MAI_TARZIU, { motiv: "M-am răzgândit" }).motiv, "M-am răzgândit");
  const inPreparare = comandaIn(["acceptata", "in_preparare"]);
  assert.throws(() => patchTranzitie(inPreparare, "anulata", "client", MAI_TARZIU), /„În preparare”/);
  assert.equal(patchTranzitie(inPreparare, "anulata", "admin", MAI_TARZIU).stare, "anulata");
});

test("patchTranzitie: comanda schimbată între timp (anulată de client) dă eroare clară pentru restaurant", () => {
  const anulata = comandaIn(["anulata"]);
  assert.throws(() => patchTranzitie(anulata, "acceptata", "restaurant", MAI_TARZIU), (e) => e.message === "Comanda e acum „Anulată” și nu mai poate trece în „Acceptată”. Lista arată starea nouă.");
});

test("patchTranzitie: o stare necunoscută apare în mesaj ca atare", () => {
  assert.throws(() => patchTranzitie(comandaIn([]), "teleportata", "admin", MAI_TARZIU), /„teleportata”/);
});

test("patchTranzitie: la ridicare, restaurantul predă o comandă gata; livratorul nu o poate lua", () => {
  const gata = comandaIn(["acceptata", "in_preparare", "gata"], { livrare: "ridicare" });
  assert.equal(patchTranzitie(gata, "livrata", "restaurant", MAI_TARZIU).livrata, true);
  assert.throws(() => patchTranzitie(gata, "in_livrare", "livrator", MAI_TARZIU));
});

test("patchTranzitie: o comandă cu livrare nu poate fi marcată livrată direct de restaurant", () => {
  const gata = comandaIn(["acceptata", "in_preparare", "gata"]);
  assert.throws(() => patchTranzitie(gata, "livrata", "restaurant", MAI_TARZIU));
});

test("patchTranzitie: respingerea unei comenzi plătite cu card o rambursează", () => {
  const patch = patchTranzitie(comandaIn([], { metodaPlata: "card_simulat" }), "respinsa", "restaurant", MAI_TARZIU, { motiv: "Închis" });
  assert.deepEqual(patch.plata, { metoda: "card_simulat", stare: "rambursata" });
  assert.equal(patch.motiv, "Închis");
});

test("patchTranzitie nu modifică comanda primită", () => {
  const c = comandaIn([]);
  const copie = structuredClone(c);
  patchTranzitie(c, "acceptata", "restaurant", MAI_TARZIU, { timpPreparare: 25 });
  assert.deepEqual(c, copie);
});

// --- patchPasLivrare ---

test("patchPasLivrare: un livrator acceptă o cursă gata", () => {
  const gata = comandaIn(["acceptata", "in_preparare", "gata"]);
  assert.deepEqual(patchPasLivrare(gata, "asignata", MAI_TARZIU, { livratorId: 2 }), { livrareStare: "asignata", livratorId: 2 });
});

test("patchPasLivrare: asignarea fără livrator aruncă", () => {
  const gata = comandaIn(["acceptata", "in_preparare", "gata"]);
  assert.throws(() => patchPasLivrare(gata, "asignata", MAI_TARZIU, {}), /Alege un livrator/);
});

test("patchPasLivrare: preluarea mută comanda în livrare", () => {
  let c = comandaIn(["acceptata", "in_preparare", "gata"]);
  c = { ...c, ...aplicaPasLivrare(c, "asignata", ACUM, { livratorId: 1 }) };
  c = { ...c, ...aplicaPasLivrare(c, "spre_restaurant", ACUM) };
  const patch = patchPasLivrare(c, "preluata", MAI_TARZIU);
  assert.equal(patch.stare, "in_livrare");
  assert.equal(patch.livrareStare, "preluata");
});

test("patchPasLivrare: preluarea înainte ca restaurantul să termine dă eroare clară", () => {
  let c = comandaIn(["acceptata", "in_preparare"]);
  c = { ...c, ...aplicaPasLivrare(c, "asignata", ACUM, { livratorId: 1 }) };
  c = { ...c, ...aplicaPasLivrare(c, "spre_restaurant", ACUM) };
  assert.throws(() => patchPasLivrare(c, "preluata", MAI_TARZIU), (e) => e.message === "Livrarea nu mai poate trece la „Preluată de livrator”: comanda e acum „În preparare”. Lista arată starea nouă.");
});

test("patchPasLivrare: o cursă anulată între timp nu mai poate avansa", () => {
  let c = comandaIn(["acceptata", "in_preparare", "gata"]);
  c = { ...c, ...aplicaPasLivrare(c, "asignata", ACUM, { livratorId: 1 }) };
  c = { ...c, ...aplicaTranzitie(c, "anulata", ACUM) };
  assert.throws(() => patchPasLivrare(c, "spre_restaurant", MAI_TARZIU), /„Anulată”/);
});

test("patchPasLivrare: o comandă la ridicare nu are pașii livrării", () => {
  const gata = comandaIn(["acceptata", "in_preparare", "gata"], { livrare: "ridicare" });
  assert.throws(() => patchPasLivrare(gata, "asignata", MAI_TARZIU, { livratorId: 1 }));
});

test("patchPasLivrare: un pas necunoscut apare în mesaj ca atare", () => {
  assert.throws(() => patchPasLivrare(comandaIn(["acceptata"]), "zbor", MAI_TARZIU), /„zbor”/);
});
