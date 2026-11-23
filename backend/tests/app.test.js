import { test } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { porneste } from "./helpers.js";

test("app.js exportă implicit aplicația Express", () => {
  assert.equal(typeof app, "function");
  assert.equal(typeof app.listen, "function");
});

test("GET /health -> 200 { status: \"ok\" }", async (t) => {
  const { cerere } = await porneste(t);
  const r = await cerere("GET", "/health");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { status: "ok" });
});

test("o rută necunoscută -> 404 { error: \"Ruta nu există\" }", async (t) => {
  const { cerere } = await porneste(t);
  for (const [metoda, cale] of [["GET", "/ceva"], ["POST", "/utilizatori"], ["GET", "/comenzi/1/extra"]]) {
    const r = await cerere(metoda, cale, metoda === "POST" ? {} : undefined);
    assert.equal(r.status, 404, `${metoda} ${cale}`);
    assert.deepEqual(r.body, { error: "Ruta nu există" });
  }
});

test("JSON stricat în corp -> 400 cu mesaj românesc, nu 500", async (t) => {
  const { cerere } = await porneste(t);
  for (const cale of ["/comenzi", "/meniu", "/livratori", "/recenzii", "/restaurante"]) {
    const r = await cerere("POST", cale, undefined, { brut: "{\"preparat\": " });
    assert.equal(r.status, 400, cale);
    assert.deepEqual(r.body, { error: "Corpul cererii nu este JSON valid" });
  }
});

test("un corp care nu e obiect (listă, text) -> 400", async (t) => {
  const { cerere } = await porneste(t);
  for (const corp of [[], [{ preparat: "X" }], "text", 5, null]) {
    const r = await cerere("POST", "/comenzi", corp);
    assert.equal(r.status, 400, JSON.stringify(corp));
    assert.equal(typeof r.body.error, "string");
  }
});

test("CORS: răspunsul permite originea http://localhost:5173", async (t) => {
  const { cerere, baza } = await porneste(t);
  const r = await cerere("GET", "/comenzi", undefined, { antete: { Origin: "http://localhost:5173" } });
  assert.equal(r.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const preflight = await fetch(`${baza}/comenzi/1`, { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "PATCH", "Access-Control-Request-Headers": "content-type" } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.match(preflight.headers.get("access-control-allow-methods"), /PATCH/);
});

test("fiecare aplicație pornește de la seed: modificările dintr-una nu apar în alta", async (t) => {
  const a = await porneste(t);
  const b = await porneste(t);
  assert.equal((await a.cerere("DELETE", "/comenzi/1")).status, 204);
  assert.equal((await a.cerere("GET", "/comenzi/1")).status, 404);
  assert.equal((await b.cerere("GET", "/comenzi/1")).status, 200);
});
