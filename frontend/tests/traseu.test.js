// Teste pentru traseul simulat al livratorului (src/traseu.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { DURATA_ETAPA_S, INALTIME_TRASEU, LATIME_TRASEU, PUNCTE_TRASEU, etapaInMiscare, pozitieTraseu, progresUrmator } from "../src/traseu.js";

const { start, restaurant, client } = PUNCTE_TRASEU;

// --- constante ---

test("punctele traseului sunt înghețate și se află în interiorul planului", () => {
  assert.ok(Object.isFrozen(PUNCTE_TRASEU));
  for (const [nume, p] of Object.entries(PUNCTE_TRASEU)) {
    assert.ok(Object.isFrozen(p), nume);
    assert.ok(p.x >= 0 && p.x <= LATIME_TRASEU && p.y >= 0 && p.y <= INALTIME_TRASEU, nume);
  }
});

// --- etapaInMiscare ---

test("etapaInMiscare e true doar pe cele două drumuri", () => {
  assert.equal(etapaInMiscare("spre_restaurant"), true);
  assert.equal(etapaInMiscare("spre_client"), true);
  for (const pas of ["neasignata", "asignata", "preluata", "livrata", null, undefined, ""]) assert.equal(etapaInMiscare(pas), false, String(pas));
});

// --- progresUrmator ---

test("progresUrmator înaintează cu secunde / durată", () => {
  assert.equal(progresUrmator(0), 1 / DURATA_ETAPA_S);
  assert.equal(progresUrmator(0.5, 2, 10), 0.7);
});

test("progresUrmator nu trece de 1", () => {
  assert.equal(progresUrmator(0.99), 1);
  assert.equal(progresUrmator(1), 1);
  assert.equal(progresUrmator(0.5, 1000), 1);
});

test("progresUrmator limitează progresul primit între 0 și 1 și tratează valorile ciudate ca 0", () => {
  assert.equal(progresUrmator(5), 1);
  assert.equal(progresUrmator(-3), 1 / DURATA_ETAPA_S);
  for (const v of [NaN, undefined, null, "0.5", Infinity]) assert.equal(progresUrmator(v), 1 / DURATA_ETAPA_S, String(v));
});

test("progresUrmator ajunge la 1 după exact DURATA_ETAPA_S bătăi", () => {
  let p = 0;
  for (let i = 0; i < DURATA_ETAPA_S - 1; i += 1) p = progresUrmator(p);
  assert.ok(p < 1);
  assert.equal(progresUrmator(p), 1);
});

// --- pozitieTraseu ---

test("pozitieTraseu spre restaurant: la 0 e la start, la 1 e la restaurant, la 0,5 la mijloc", () => {
  assert.deepEqual(pozitieTraseu("spre_restaurant", 0), { x: start.x, y: start.y });
  assert.deepEqual(pozitieTraseu("spre_restaurant", 1), { x: restaurant.x, y: restaurant.y });
  assert.deepEqual(pozitieTraseu("spre_restaurant", 0.5), { x: (start.x + restaurant.x) / 2, y: (start.y + restaurant.y) / 2 });
});

test("pozitieTraseu spre client: la 0 e la restaurant, la 1 e la client", () => {
  assert.deepEqual(pozitieTraseu("spre_client", 0), { x: restaurant.x, y: restaurant.y });
  assert.deepEqual(pozitieTraseu("spre_client", 1), { x: client.x, y: client.y });
  assert.deepEqual(pozitieTraseu("spre_client", 0.5), { x: (restaurant.x + client.x) / 2, y: (restaurant.y + client.y) / 2 });
});

test("pozitieTraseu limitează progresul în afara intervalului", () => {
  assert.deepEqual(pozitieTraseu("spre_client", 7), pozitieTraseu("spre_client", 1));
  assert.deepEqual(pozitieTraseu("spre_client", -2), pozitieTraseu("spre_client", 0));
  assert.deepEqual(pozitieTraseu("spre_restaurant", NaN), pozitieTraseu("spre_restaurant", 0));
  assert.deepEqual(pozitieTraseu("spre_restaurant", undefined), pozitieTraseu("spre_restaurant", 0));
});

test("pozitieTraseu rotunjește la două zecimale", () => {
  const p = pozitieTraseu("spre_restaurant", 1 / 3);
  assert.equal(p.x, Math.round((start.x + (restaurant.x - start.x) / 3) * 100) / 100);
  assert.equal(p.y, Math.round((start.y + (restaurant.y - start.y) / 3) * 100) / 100);
});

test("pozitieTraseu pe pașii fără mișcare ignoră progresul", () => {
  assert.deepEqual(pozitieTraseu("preluata", 0.3), { x: restaurant.x, y: restaurant.y });
  assert.deepEqual(pozitieTraseu("livrata", 0), { x: client.x, y: client.y });
  assert.deepEqual(pozitieTraseu("asignata", 0.8), { x: start.x, y: start.y });
  assert.deepEqual(pozitieTraseu("neasignata", 1), { x: start.x, y: start.y });
  assert.deepEqual(pozitieTraseu(null, 0.5), { x: start.x, y: start.y });
});

test("pozitieTraseu întoarce copii: modificarea rezultatului nu schimbă punctele fixe", () => {
  const p = pozitieTraseu("preluata", 0);
  p.x = 9999;
  assert.equal(PUNCTE_TRASEU.restaurant.x, restaurant.x);
  assert.notEqual(pozitieTraseu("preluata", 0).x, 9999);
});

test("pozitieTraseu e continuă la trecerea dintre etape (spre restaurant -> preluată -> spre client)", () => {
  assert.deepEqual(pozitieTraseu("spre_restaurant", 1), pozitieTraseu("preluata", 0));
  assert.deepEqual(pozitieTraseu("preluata", 0), pozitieTraseu("spre_client", 0));
  assert.deepEqual(pozitieTraseu("spre_client", 1), pozitieTraseu("livrata", 0));
});
