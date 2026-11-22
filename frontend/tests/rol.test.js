// Teste pentru comutatorul de roluri demo (src/rol.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { ETICHETE_ROL, ROL_IMPLICIT, RUTE_ROL, citesteRol, esteRol } from "../src/rol.js";
import { ROLURI } from "../src/stari.js";

// --- constante ---

test("rolul implicit este client", () => {
  assert.equal(ROL_IMPLICIT, "client");
});

test("fiecare rol cunoscut are etichetă și rută, fără chei în plus", () => {
  assert.deepEqual(Object.keys(ETICHETE_ROL).sort(), [...ROLURI].sort());
  assert.deepEqual(Object.keys(RUTE_ROL).sort(), [...ROLURI].sort());
  assert.equal(RUTE_ROL.client, "/");
  assert.equal(RUTE_ROL.admin, "/admin");
});

test("ETICHETE_ROL și RUTE_ROL sunt înghețate", () => {
  assert.ok(Object.isFrozen(ETICHETE_ROL));
  assert.ok(Object.isFrozen(RUTE_ROL));
});

// --- esteRol ---

test("esteRol acceptă doar cele patru roluri, scrise exact", () => {
  for (const rol of ["client", "restaurant", "livrator", "admin"]) assert.equal(esteRol(rol), true, rol);
  for (const v of ["Admin", " admin", "", null, undefined, 1, {}, ["admin"], "constructor", "toString"]) assert.equal(esteRol(v), false, String(v));
});

// --- citesteRol ---

test("citesteRol citește un rol salvat ca JSON", () => {
  assert.equal(citesteRol('"admin"'), "admin");
  assert.equal(citesteRol('"livrator"'), "livrator");
  assert.equal(citesteRol('"restaurant"'), "restaurant");
  assert.equal(citesteRol('"client"'), "client");
});

test("citesteRol întoarce clientul când nu e nimic salvat", () => {
  assert.equal(citesteRol(null), "client");
  assert.equal(citesteRol(undefined), "client");
  assert.equal(citesteRol(""), "client");
});

test("citesteRol întoarce clientul pentru text care nu e JSON", () => {
  assert.equal(citesteRol("admin"), "client");
  assert.equal(citesteRol("{"), "client");
  assert.equal(citesteRol('"admin'), "client");
});

test("citesteRol întoarce clientul pentru JSON valid, dar care nu e un rol cunoscut", () => {
  for (const text of ['"hacker"', '"ADMIN"', '{"rol":"admin"}', '["admin"]', "null", "42", "true", '"constructor"', '"__proto__"']) {
    assert.equal(citesteRol(text), "client", text);
  }
});

test("citesteRol întoarce clientul pentru valori care nu sunt text", () => {
  assert.equal(citesteRol(42), "client");
  assert.equal(citesteRol({ rol: "admin" }), "client");
  assert.equal(citesteRol(["admin"]), "client");
});
