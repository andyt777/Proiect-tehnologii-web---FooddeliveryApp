import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

test("POST /recenzii pentru o comandă livrată -> 201; restaurantul vine din comandă", async (t) => {
  const { cerere } = await porneste(t);
  assert.deepEqual((await cerere("GET", "/recenzii")).body, []);
  const creata = await cerere("POST", "/recenzii", { comandaId: 2, restaurant: "Sushi Kyo", nota: 5, text: "  Foarte bun  ", creata: "2026-11-23T10:00:00.000Z", id: 50 });
  assert.equal(creata.status, 201);
  assert.deepEqual(creata.body, { id: 1, comandaId: 2, restaurant: "Burger Van", nota: 5, text: "Foarte bun", creata: "2026-11-23T10:00:00.000Z" });
  assert.equal((await cerere("GET", "/recenzii/1")).status, 200);
  assert.equal((await cerere("GET", "/recenzii")).body.length, 1);
});

test("recenzii: o singură recenzie pe comandă (409), doar pentru comenzi livrate și existente (400)", async (t) => {
  const { cerere } = await porneste(t);
  assert.equal((await cerere("POST", "/recenzii", { comandaId: 4, nota: 4 })).status, 201);
  assert.equal((await cerere("POST", "/recenzii", { comandaId: 4, nota: 3 })).status, 409);
  assert.equal((await cerere("POST", "/recenzii", { comandaId: 1, nota: 3 })).status, 400);
  assert.equal((await cerere("POST", "/recenzii", { comandaId: 999, nota: 3 })).status, 400);
  for (const corp of [{}, { comandaId: 6 }, { comandaId: 6, nota: 6 }, { comandaId: 6, nota: 4.5 }, { comandaId: 6, nota: 4, text: "x".repeat(501) }]) {
    assert.equal((await cerere("POST", "/recenzii", corp)).status, 400, JSON.stringify(corp));
  }
});

test("PATCH /recenzii/:id schimbă doar nota și textul; DELETE -> 204; id inexistent -> 404", async (t) => {
  const { cerere } = await porneste(t);
  await cerere("POST", "/recenzii", { comandaId: 6, nota: 3 });
  const patch = await cerere("PATCH", "/recenzii/1", { nota: 4, comandaId: 2 });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.nota, 4);
  assert.equal(patch.body.comandaId, 6);
  assert.equal((await cerere("PATCH", "/recenzii/1", { comandaId: 2 })).status, 400);
  assert.equal((await cerere("DELETE", "/recenzii/1")).status, 204);
  assert.deepEqual((await cerere("GET", "/recenzii/1")).body, { error: "Recenzia nu există" });
});
