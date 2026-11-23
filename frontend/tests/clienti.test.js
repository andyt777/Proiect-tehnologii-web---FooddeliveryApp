// Teste pentru lista de clienți din /admin (src/clienti.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clientiDinComenzi } from "../src/clienti.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));

test("clientiDinComenzi: comenzile fără contact (seed, comenzi speciale) nu creează clienți", () => {
  assert.deepEqual(clientiDinComenzi(db.comenzi), []);
  assert.deepEqual(clientiDinComenzi(null), []);
});

test("clientiDinComenzi grupează după telefon, numără comenzile și adună doar ce e plătit", () => {
  const comenzi = [
    { id: 10, preparat: "A", pret: 50, contact: { nume: "Ana", telefon: "0722123456" }, plata: { metoda: "card_simulat", stare: "platita" } },
    { id: 11, preparat: "B", pret: 30, reducere: 5, contact: { nume: "Ana Pop", telefon: "0722123456" }, plata: { metoda: "card_simulat", stare: "platita" } },
    { id: 12, preparat: "C", pret: 40, contact: { nume: "Ana", telefon: "0722123456" }, plata: { metoda: "numerar", stare: "neplatita" } },
    { id: 13, preparat: "D", pret: 20, contact: { nume: "Bogdan", telefon: "0733000000" }, plata: { metoda: "card_simulat", stare: "rambursata" } },
    { id: 14, preparat: "E", pret: 20, contact: { nume: "X", telefon: "  " } },
    { id: 15, preparat: "F", pret: 20, contact: { nume: "Y" } },
  ];
  assert.deepEqual(clientiDinComenzi(comenzi), [
    { cheie: "0722123456", nume: "Ana", telefon: "0722123456", numar: 3, totalPlatit: 75 },
    { cheie: "0733000000", nume: "Bogdan", telefon: "0733000000", numar: 1, totalPlatit: 0 },
  ]);
});

test("clientiDinComenzi păstrează numele din cea mai recentă comandă", () => {
  const clienti = clientiDinComenzi([
    { id: 3, pret: 10, contact: { nume: "Nou", telefon: "0700000000" } },
    { id: 1, pret: 10, contact: { nume: "Vechi", telefon: "0700000000" } },
  ]);
  assert.equal(clienti[0].nume, "Nou");
});
