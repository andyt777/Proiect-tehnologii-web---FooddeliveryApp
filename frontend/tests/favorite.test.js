// Teste pentru preparatele favorite (src/favorite.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAVORITE_MAXIME, citesteFavorite, comutaFavorit, esteFavorit, pastreazaFavoriteDinMeniu, preparateFavorite } from "../src/favorite.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));

// --- citesteFavorite ---

test("citesteFavorite citește o listă validă de id-uri", () => {
  assert.deepEqual(citesteFavorite('["p2","p7"]'), ["p2", "p7"]);
});

test("citesteFavorite întoarce o listă goală pentru null, text invalid sau altceva decât o listă", () => {
  assert.deepEqual(citesteFavorite(null), []);
  assert.deepEqual(citesteFavorite(undefined), []);
  assert.deepEqual(citesteFavorite("{nu e json"), []);
  assert.deepEqual(citesteFavorite('{"p1": true}'), []);
  assert.deepEqual(citesteFavorite('"p1"'), []);
  assert.deepEqual(citesteFavorite("null"), []);
});

test("citesteFavorite aruncă elementele care nu sunt id-uri text și dublurile", () => {
  assert.deepEqual(citesteFavorite('["p1", 2, null, "", {"id":"p3"}, "p1", "p4"]'), ["p1", "p4"]);
});

test("citesteFavorite păstrează cel mult FAVORITE_MAXIME id-uri", () => {
  const multe = Array.from({ length: FAVORITE_MAXIME + 20 }, (_, i) => `p${i}`);
  assert.equal(citesteFavorite(JSON.stringify(multe)).length, FAVORITE_MAXIME);
});

// --- esteFavorit / comutaFavorit ---

test("comutaFavorit adaugă un preparat nou la final și îl scoate la al doilea apel", () => {
  const una = comutaFavorit(["p1"], "p5");
  assert.deepEqual(una, ["p1", "p5"]);
  assert.ok(esteFavorit(una, "p5"));
  const doua = comutaFavorit(una, "p5");
  assert.deepEqual(doua, ["p1"]);
  assert.equal(esteFavorit(doua, "p5"), false);
});

test("comutaFavorit nu modifică lista primită", () => {
  const lista = ["p1"];
  comutaFavorit(lista, "p2");
  comutaFavorit(lista, "p1");
  assert.deepEqual(lista, ["p1"]);
});

test("comutaFavorit întoarce aceeași listă pentru un id invalid sau când plafonul e atins", () => {
  const lista = ["p1"];
  assert.equal(comutaFavorit(lista, ""), lista);
  assert.equal(comutaFavorit(lista, 3), lista);
  const plina = Array.from({ length: FAVORITE_MAXIME }, (_, i) => `p${i}`);
  assert.equal(comutaFavorit(plina, "nou"), plina);
  assert.equal(comutaFavorit(plina, "p0").length, FAVORITE_MAXIME - 1);
});

// --- pastreazaFavoriteDinMeniu / preparateFavorite ---

test("pastreazaFavoriteDinMeniu scoate id-urile care nu mai sunt în meniu", () => {
  assert.deepEqual(pastreazaFavoriteDinMeniu(["p1", "x9", "p9"], db.meniu), ["p1", "p9"]);
});

test("pastreazaFavoriteDinMeniu întoarce aceeași referință când nu se scoate nimic", () => {
  const lista = ["p1", "p2"];
  assert.equal(pastreazaFavoriteDinMeniu(lista, db.meniu), lista);
});

test("preparateFavorite întoarce preparatele în ordinea adăugării și sare peste id-urile necunoscute", () => {
  const rezultat = preparateFavorite(["p9", "x1", "p1"], db.meniu);
  assert.deepEqual(rezultat.map((p) => p.preparat), ["Gyoza cu legume (6 buc.)", "Pizza Margherita"]);
  assert.deepEqual(preparateFavorite([], db.meniu), []);
});
