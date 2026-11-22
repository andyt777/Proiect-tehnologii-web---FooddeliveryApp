// Teste pentru administrarea meniului (src/meniuAdmin.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { esteImagineSigura, imagineProdus, preparatDinFormular, valideazaPreparat, valoriFormularPreparat } from "../src/meniuAdmin.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const BUNE = Object.freeze({ preparat: "Pizza Prosciutto", categorie: "Pizza", pret: "50", imagine: "", disponibil: true });
const CONTEXT = { meniu: db.meniu, restaurant: "Pizzeria Napoli" };

test("valideazaPreparat: date bune -> null", () => {
  assert.equal(valideazaPreparat(BUNE, CONTEXT), null);
  assert.equal(valideazaPreparat({ ...BUNE, imagine: "/img/pizza-diavola.webp" }, CONTEXT), null);
  assert.equal(valideazaPreparat({ ...BUNE, imagine: "https://exemplu.ro/poza.jpg" }, CONTEXT), null);
});

test("valideazaPreparat: numele lipsă, prea scurt, prea lung sau cu sufixul de cantitate", () => {
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "   " }).camp, "preparat");
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "A" }).camp, "preparat");
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "a".repeat(61) }).camp, "preparat");
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "a".repeat(60) }), null);
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "Pizza × 2" }).camp, "preparat");
});

test("valideazaPreparat: nume dublat în același restaurant e refuzat, dar nu la editarea lui sau în alt restaurant", () => {
  assert.deepEqual(valideazaPreparat({ ...BUNE, preparat: " pizza margherita " }, CONTEXT), { camp: "preparat", mesaj: "Restaurantul are deja un preparat cu acest nume." });
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "Pizza Margherita" }, { ...CONTEXT, idEditat: "p1" }), null);
  assert.equal(valideazaPreparat({ ...BUNE, preparat: "Pizza Margherita" }, { meniu: db.meniu, restaurant: "Burger Van" }), null);
});

test("valideazaPreparat: categoria trebuie să fie din listă", () => {
  assert.equal(valideazaPreparat({ ...BUNE, categorie: "Supe" }).camp, "categorie");
  assert.equal(valideazaPreparat({ ...BUNE, categorie: undefined }).camp, "categorie");
});

test("valideazaPreparat: prețul e un întreg între 1 și 1000", () => {
  for (const pret of ["", " ", "abc", "12,5", "12.5", "-3", "0", "1001"]) assert.equal(valideazaPreparat({ ...BUNE, pret }).camp, "pret", pret);
  for (const pret of ["1", "1000", " 42 ", 42]) assert.equal(valideazaPreparat({ ...BUNE, pret }), null, String(pret));
});

test("valideazaPreparat: imaginea e opțională, dar doar cale locală sau http(s)", () => {
  for (const imagine of ["javascript:alert(1)", "//evil.com/x.png", "data:image/png;base64,AAA", "img/fara-slash.png", "/img/cu spatiu.png", "ftp://x.ro/a.png"]) {
    assert.equal(valideazaPreparat({ ...BUNE, imagine }).camp, "imagine", imagine);
  }
});

test("esteImagineSigura și imagineProdus", () => {
  assert.equal(esteImagineSigura("/img/gyoza.webp"), true);
  assert.equal(esteImagineSigura("http://localhost:5173/a.png"), true);
  assert.equal(esteImagineSigura(""), false);
  assert.equal(esteImagineSigura(null), false);
  assert.equal(esteImagineSigura(`/${"a".repeat(300)}`), false);
  assert.equal(imagineProdus({ preparat: "Gyoza cu legume (6 buc.)" }), "/img/gyoza.webp");
  assert.equal(imagineProdus({ preparat: "Gyoza cu legume (6 buc.)", imagine: "/img/x.webp" }), "/img/x.webp");
  assert.equal(imagineProdus({ preparat: "Gyoza cu legume (6 buc.)", imagine: "javascript:x" }), "/img/gyoza.webp");
  assert.equal(imagineProdus({ preparat: "Necunoscut" }), null);
});

test("valoriFormularPreparat: gol, cu categoria restaurantului, sau din preparat (fără `disponibil` = disponibil)", () => {
  assert.deepEqual(valoriFormularPreparat(null, "Asian"), { preparat: "", categorie: "Asian", pret: "", imagine: "", disponibil: true });
  assert.deepEqual(valoriFormularPreparat(db.meniu[0]), { preparat: "Pizza Margherita", categorie: "Pizza", pret: "42", imagine: "", disponibil: true });
  assert.equal(valoriFormularPreparat({ ...db.meniu[0], disponibil: false }).disponibil, false);
});

test("preparatDinFormular: corpul trimis, fără id, cu prețul număr și imaginea null când lipsește", () => {
  assert.deepEqual(preparatDinFormular({ ...BUNE, preparat: "  Pizza Prosciutto ", pret: " 50 " }, "Pizzeria Napoli"), {
    preparat: "Pizza Prosciutto", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 50, imagine: null, disponibil: true,
  });
  assert.equal(preparatDinFormular({ ...BUNE, imagine: " /img/a.webp ", disponibil: false }, "X").imagine, "/img/a.webp");
  assert.equal(preparatDinFormular({ ...BUNE, disponibil: false }, "X").disponibil, false);
});
