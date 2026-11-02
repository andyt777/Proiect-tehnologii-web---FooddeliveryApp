// Teste pentru căutare (src/cautare.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeaza, potrivesteCautarea } from "../src/cautare.js";

// --- normalizeaza ---

test("normalizeaza transformă în litere mici", () => {
  assert.equal(normalizeaza("Pizza MARGHERITA"), "pizza margherita");
});

test("normalizeaza scoate diacriticele românești (ă â î ș ț, cu virgulă și cu sedilă)", () => {
  assert.equal(normalizeaza("ăâîșț ĂÂÎȘȚ"), "aaist aaist");
  assert.equal(normalizeaza("şţ ŞŢ"), "st st"); // varianta veche, cu sedilă
  assert.equal(normalizeaza("Burger de vită"), "burger de vita");
});

test("normalizeaza scoate spațiile de la margini și le comprimă pe cele din interior", () => {
  assert.equal(normalizeaza("  sushi   kyo \t"), "sushi kyo");
});

test("normalizeaza tratează null, undefined și numere", () => {
  assert.equal(normalizeaza(null), "");
  assert.equal(normalizeaza(undefined), "");
  assert.equal(normalizeaza(42), "42");
});

// --- potrivesteCautarea ---

const COMANDA = Object.freeze({ id: 2, preparat: "Burger de vită cu cartofi", restaurant: "Burger Van", pret: 48 });
const PRODUS = Object.freeze({ id: "p7", preparat: "Platou sushi (12 buc.)", restaurant: "Sushi Kyo", pret: 65 });

test("potrivesteCautarea: o căutare goală sau doar cu spații potrivește orice", () => {
  assert.equal(potrivesteCautarea(COMANDA, ""), true);
  assert.equal(potrivesteCautarea(COMANDA, "   "), true);
});

test("potrivesteCautarea găsește după numele preparatului, oriunde în text", () => {
  assert.equal(potrivesteCautarea(COMANDA, "cartofi"), true);
  assert.equal(potrivesteCautarea(PRODUS, "12 buc"), true);
});

test("potrivesteCautarea găsește după restaurant", () => {
  assert.equal(potrivesteCautarea(PRODUS, "kyo"), true);
  assert.equal(potrivesteCautarea(COMANDA, "VAN"), true);
});

test("potrivesteCautarea ignoră diacriticele în ambele sensuri", () => {
  assert.equal(potrivesteCautarea(COMANDA, "vita"), true); // fără diacritice în căutare
  assert.equal(potrivesteCautarea({ preparat: "Pizza Diavola", restaurant: "Napoli" }, "nâpoli"), true); // cu diacritice în căutare
});

test("potrivesteCautarea ignoră spațiile de la margini ale căutării", () => {
  assert.equal(potrivesteCautarea(PRODUS, "  sushi  "), true);
});

test("potrivesteCautarea întoarce false când nimic nu se potrivește", () => {
  assert.equal(potrivesteCautarea(COMANDA, "sarmale"), false);
  assert.equal(potrivesteCautarea(PRODUS, "pizza"), false);
});

test("potrivesteCautarea nu caută în alte câmpuri (preț, id)", () => {
  assert.equal(potrivesteCautarea(COMANDA, "48"), false);
  assert.equal(potrivesteCautarea(PRODUS, "p7"), false);
});

test("potrivesteCautarea nu modifică obiectul primit", () => {
  assert.doesNotThrow(() => potrivesteCautarea(COMANDA, "Burger")); // obiect înghețat: orice scriere ar arunca
});
