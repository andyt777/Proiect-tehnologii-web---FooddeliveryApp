import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

test("GET /livratori: cei 3 livratori demo; POST cu sufixul demo; PATCH online/activ", async (t) => {
  const { cerere } = await porneste(t);
  assert.equal((await cerere("GET", "/livratori")).body.length, 3);
  const creat = await cerere("POST", "/livratori", { nume: "Ana (livrator demo)", online: false, activ: true });
  assert.equal(creat.status, 201);
  assert.deepEqual(creat.body, { id: 4, nume: "Ana (livrator demo)", online: false, activ: true });
  const fara = await cerere("POST", "/livratori", { nume: "Dan" });
  assert.deepEqual(fara.body, { id: 5, nume: "Dan (livrator demo)", online: false, activ: true });
  const tura = await cerere("PATCH", "/livratori/1", { online: true });
  assert.equal(tura.body.online, true);
  const inactiv = await cerere("PATCH", "/livratori/1", { activ: false, online: false });
  assert.deepEqual(inactiv.body, { id: 1, nume: "Andrei (livrator demo)", online: false, activ: false });
});

test("livratori: 400 pentru nume greșit sau dublură, 404 pentru id inexistent", async (t) => {
  const { cerere } = await porneste(t);
  for (const corp of [{}, { nume: "" }, { nume: "A" }, { nume: "x".repeat(41) }, { nume: "Ioana (livrator demo)" }, { nume: "Ion", online: "da" }]) {
    assert.equal((await cerere("POST", "/livratori", corp)).status, 400, JSON.stringify(corp));
  }
  assert.deepEqual((await cerere("GET", "/livratori/9")).body, { error: "Livratorul nu există" });
  assert.equal((await cerere("DELETE", "/livratori/9")).status, 404);
});

test("DELETE /livratori/:id -> 204; refuzat (409) dacă livratorul are o cursă în lucru", async (t) => {
  const { cerere } = await porneste(t);
  await cerere("PATCH", "/comenzi/1", { livratorId: 2, livrareStare: "asignata" });
  const refuzat = await cerere("DELETE", "/livratori/2");
  assert.equal(refuzat.status, 409);
  assert.equal(typeof refuzat.body.error, "string");
  assert.equal((await cerere("DELETE", "/livratori/3")).status, 204);
  assert.equal((await cerere("GET", "/livratori/3")).status, 404);
});
