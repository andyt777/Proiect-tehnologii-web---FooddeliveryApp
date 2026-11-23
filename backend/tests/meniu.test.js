import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

const PREPARAT = { preparat: "Pizza Capricciosa", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 50, imagine: null, disponibil: true };

test("GET /meniu: cele 9 preparate din seed; GET /meniu/p1 -> 200; /meniu/p99 -> 404", async (t) => {
  const { cerere } = await porneste(t);
  const lista = await cerere("GET", "/meniu");
  assert.equal(lista.status, 200);
  assert.equal(lista.body.length, 9);
  assert.equal((await cerere("GET", "/meniu/p1")).body.preparat, "Pizza Margherita");
  assert.deepEqual((await cerere("GET", "/meniu/p99")).body, { error: "Preparatul nu există" });
  assert.equal((await cerere("GET", "/meniu/p%201")).status, 400);
});

test("POST /meniu: serverul pune un id text nou („p10”); PATCH; DELETE -> 204", async (t) => {
  const { cerere } = await porneste(t);
  const creat = await cerere("POST", "/meniu", { ...PREPARAT, id: "p1" });
  assert.equal(creat.status, 201);
  assert.equal(creat.body.id, "p10");
  assert.deepEqual(creat.body, { id: "p10", ...PREPARAT });
  const indisponibil = await cerere("PATCH", "/meniu/p10", { disponibil: false });
  assert.equal(indisponibil.status, 200);
  assert.equal(indisponibil.body.disponibil, false);
  assert.equal(indisponibil.body.pret, 50);
  assert.equal((await cerere("DELETE", "/meniu/p10")).status, 204);
  assert.equal((await cerere("GET", "/meniu/p10")).status, 404);
  assert.equal((await cerere("POST", "/meniu", PREPARAT)).body.id, "p11");
});

test("POST /meniu: regulile din meniuAdmin.js (nume, preț, categorie, imagine, dubluri)", async (t) => {
  const { cerere } = await porneste(t);
  const gresite = [
    { ...PREPARAT, preparat: "" },
    { ...PREPARAT, preparat: "A" },
    { ...PREPARAT, preparat: "Pizza × 2" },
    { ...PREPARAT, pret: 0 },
    { ...PREPARAT, pret: 12.5 },
    { ...PREPARAT, pret: "50" },
    { ...PREPARAT, categorie: "Desert" },
    { ...PREPARAT, imagine: "javascript:alert(1)" },
    { ...PREPARAT, preparat: "pizza margherita" },
  ];
  for (const corp of gresite) assert.equal((await cerere("POST", "/meniu", corp)).status, 400, JSON.stringify(corp));
  assert.equal((await cerere("PATCH", "/meniu/p2", { preparat: "Pizza Margherita" })).status, 400);
  assert.equal((await cerere("PATCH", "/meniu/p1", { preparat: "Pizza Margherita", pret: 45 })).status, 200);
});
