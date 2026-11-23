// Funcțiile pure din src/reguli/: alegerea livratorului la dispatch, programul restaurantului, plata.
import { test } from "node:test";
import assert from "node:assert/strict";
import { alegeLivrator } from "../src/reguli/livrare.js";
import { plataDupa, plataInitiala } from "../src/reguli/plata.js";
import { esteDeschis } from "../src/reguli/restaurant.js";

test("alegeLivrator: doar online și activi, fără cursă în lucru; cel cu mai puține livrări, apoi id-ul mai mic", () => {
  const livratori = [
    { id: 1, nume: "A", online: true, activ: true },
    { id: 2, nume: "B", online: true, activ: true },
    { id: 3, nume: "C", online: true, activ: false },
    { id: 4, nume: "D", online: false, activ: true },
    { id: 10, nume: "E", online: true, activ: true },
  ];
  const livrata = (livratorId) => ({ livrare: "standard", stare: "livrata", livrata: true, livratorId });
  assert.equal(alegeLivrator(livratori, []).id, 1);
  assert.equal(alegeLivrator(livratori, [livrata(1)]).id, 2);
  assert.equal(alegeLivrator(livratori, [livrata(1), livrata(2)]).id, 10);
  const inLucru = { livrare: "standard", stare: "gata", livrareStare: "asignata", livratorId: 1 };
  assert.equal(alegeLivrator(livratori, [inLucru]).id, 2);
  assert.equal(alegeLivrator(livratori.slice(2, 4), []), null);
});

test("esteDeschis: fără profil sau fără program e deschis la orice oră; pauza închide oricând", () => {
  const start = new Date(2026, 10, 23, 0, 0).getTime();
  for (let m = 0; m < 24 * 60; m += 15) {
    const ms = start + m * 60000;
    assert.equal(esteDeschis(null, ms), true);
    assert.equal(esteDeschis({ pauzat: false, program: null }, ms), true);
    assert.equal(esteDeschis({ pauzat: true, program: null }, ms), false);
  }
});

test("esteDeschis: intervalul de peste miezul nopții continuă a doua zi", () => {
  const zile = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"];
  const program = Object.fromEntries(zile.map((z) => [z, null]));
  program.luni = { deschide: "18:00", inchide: "02:00" };
  const luni = (h, m) => new Date(2026, 10, 23, h, m);
  const marti = (h, m) => new Date(2026, 10, 24, h, m);
  assert.equal(esteDeschis({ program }, luni(17, 59)), false);
  assert.equal(esteDeschis({ program }, luni(23, 0)), true);
  assert.equal(esteDeschis({ program }, marti(1, 59)), true);
  assert.equal(esteDeschis({ program }, marti(2, 0)), false);
});

test("plata: cardul simulat e plătit la plasare, numerarul la predare; anularea rambursează doar ce e plătit", () => {
  assert.deepEqual(plataInitiala("card_simulat"), { metoda: "card_simulat", stare: "platita" });
  assert.deepEqual(plataInitiala("numerar"), { metoda: "numerar", stare: "neplatita" });
  assert.deepEqual(plataInitiala(undefined, true), { metoda: "numerar", stare: "platita" });
  assert.deepEqual(plataDupa({ metoda: "numerar", stare: "neplatita" }, "livrata"), { metoda: "numerar", stare: "platita" });
  assert.deepEqual(plataDupa({ metoda: "numerar", stare: "neplatita" }, "anulata"), { metoda: "numerar", stare: "neplatita" });
  assert.deepEqual(plataDupa({ metoda: "card_simulat", stare: "platita" }, "respinsa"), { metoda: "card_simulat", stare: "rambursata" });
});
