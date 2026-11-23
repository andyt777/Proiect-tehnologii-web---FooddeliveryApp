import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

const PROGRAM = { luni: { deschide: "10:00", inchide: "22:00" }, marti: { deschide: "10:00", inchide: "22:00" }, miercuri: null, joi: { deschide: "18:00", inchide: "02:00" }, vineri: { deschide: "10:00", inchide: "23:00" }, sambata: null, duminica: null };
const PROFIL = { id: "sushi-kyo", descriere: "Sushi proaspăt.", telefon: "0722 123 456", pauzat: false, program: PROGRAM };

test("POST /restaurante creează profilul cu slug-ul ca id; PUT îl înlocuiește; GET îl citește", async (t) => {
  const { cerere } = await porneste(t);
  assert.deepEqual((await cerere("GET", "/restaurante")).body, []);
  const creat = await cerere("POST", "/restaurante", PROFIL);
  assert.equal(creat.status, 201);
  assert.deepEqual(creat.body, { ...PROFIL, telefon: "0722123456" });
  const inlocuit = await cerere("PUT", "/restaurante/sushi-kyo", { ...PROFIL, id: "alt-id", descriere: "", pauzat: true });
  assert.equal(inlocuit.status, 200);
  assert.equal(inlocuit.body.id, "sushi-kyo");
  assert.equal(inlocuit.body.pauzat, true);
  assert.equal(inlocuit.body.descriere, "");
  assert.equal((await cerere("GET", "/restaurante/sushi-kyo")).body.pauzat, true);
  assert.equal((await cerere("PATCH", "/restaurante/sushi-kyo", { pauzat: false })).body.pauzat, false);
});

test("restaurante: 409 la al doilea POST, 404 la PUT pe un profil inexistent, 400 pentru date greșite", async (t) => {
  const { cerere } = await porneste(t);
  await cerere("POST", "/restaurante", PROFIL);
  assert.equal((await cerere("POST", "/restaurante", PROFIL)).status, 409);
  const lipsa = await cerere("PUT", "/restaurante/burger-van", { ...PROFIL, id: "burger-van" });
  assert.equal(lipsa.status, 404);
  assert.deepEqual(lipsa.body, { error: "Restaurantul nu există" });
  const gresite = [
    { ...PROFIL, id: "mcdonalds" },
    { ...PROFIL, id: "Sushi Kyo" },
    { ...PROFIL, id: undefined },
    { ...PROFIL, id: "burger-van", program: undefined },
    { ...PROFIL, id: "burger-van", program: { ...PROGRAM, luni: { deschide: "25:00", inchide: "22:00" } } },
    { ...PROFIL, id: "burger-van", program: { ...PROGRAM, luni: { deschide: "10:00", inchide: "10:00" } } },
    { ...PROFIL, id: "burger-van", telefon: "123" },
    { ...PROFIL, id: "burger-van", descriere: "x".repeat(201) },
  ];
  for (const corp of gresite) assert.equal((await cerere("POST", "/restaurante", corp)).status, 400, JSON.stringify(corp));
  assert.equal((await cerere("GET", "/restaurante/..%2Fcomenzi")).status, 400);
  assert.equal((await cerere("DELETE", "/restaurante/sushi-kyo")).status, 204);
  assert.equal((await cerere("GET", "/restaurante/sushi-kyo")).status, 404);
});
