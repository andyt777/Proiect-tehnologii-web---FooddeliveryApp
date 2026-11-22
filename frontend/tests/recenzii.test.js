// Teste pentru recenziile de după livrare (src/recenzii.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ETICHETE_NOTA, NOTA_MAX, NOTA_MIN, TEXT_RECENZIE_MAX, curataRecenzii, formatNota, formatRecenzii, medieRecenzii, poateLasaRecenzie, recenziaComenzii, recenzieNoua, recenziiRestaurant, valideazaRecenzie,
} from "../src/recenzii.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const ACUM = new Date("2026-11-22T18:00:00.000Z");

function recenzie(extra = {}) {
  return { id: 1, comandaId: 10, restaurant: "Pizzeria Napoli", nota: 5, text: "Foarte bună", creata: "2026-11-22T18:00:00.000Z", ...extra };
}

// --- constante ---

test("notele sunt de la 1 la 5, fiecare cu etichetă, iar textul are maximum 500 de caractere", () => {
  assert.equal(NOTA_MIN, 1);
  assert.equal(NOTA_MAX, 5);
  assert.equal(TEXT_RECENZIE_MAX, 500);
  for (let n = NOTA_MIN; n <= NOTA_MAX; n += 1) assert.equal(typeof ETICHETE_NOTA[n], "string", String(n));
});

test("db.json pornește fără recenzii", () => {
  assert.deepEqual(db.recenzii, []);
});

// --- valideazaRecenzie ---

test("valideazaRecenzie acceptă notele de la capete (1 și 5) și textul lipsă", () => {
  assert.equal(valideazaRecenzie({ nota: 1 }), null);
  assert.equal(valideazaRecenzie({ nota: 5, text: "" }), null);
  assert.equal(valideazaRecenzie({ nota: 3, text: "   " }), null);
});

test("valideazaRecenzie respinge notele în afara intervalului sau care nu sunt întregi", () => {
  for (const nota of [0, 6, -1, 3.5, "5", null, undefined, NaN, Infinity]) {
    const r = valideazaRecenzie({ nota, text: "ok" });
    assert.equal(r?.camp, "nota", String(nota));
    assert.equal(r.mesaj, "Alege o notă de la 1 la 5.");
  }
});

test("valideazaRecenzie: textul de exact 500 de caractere e acceptat, 501 nu", () => {
  assert.equal(valideazaRecenzie({ nota: 4, text: "a".repeat(500) }), null);
  assert.deepEqual(valideazaRecenzie({ nota: 4, text: "a".repeat(501) }), { camp: "text", mesaj: "Recenzia are maximum 500 de caractere." });
});

test("valideazaRecenzie măsoară lungimea textului fără spațiile de la margini", () => {
  assert.equal(valideazaRecenzie({ nota: 4, text: `   ${"a".repeat(500)}   ` }), null);
});

test("valideazaRecenzie raportează întâi nota când ambele câmpuri sunt greșite", () => {
  assert.equal(valideazaRecenzie({ nota: 0, text: "a".repeat(600) }).camp, "nota");
});

test("valideazaRecenzie ignoră un text care nu e text (îl tratează ca lipsă)", () => {
  assert.equal(valideazaRecenzie({ nota: 4, text: 12345 }), null);
});

// --- recenzieNoua ---

test("recenzieNoua construiește corpul POST, fără id, cu textul curățat și data ISO", () => {
  const r = recenzieNoua({ comanda: { id: 7, restaurant: "Sushi Kyo", pret: 65 }, nota: 4, text: "  Gustos  " }, ACUM);
  assert.deepEqual(r, { comandaId: 7, restaurant: "Sushi Kyo", nota: 4, text: "Gustos", creata: "2026-11-22T18:00:00.000Z" });
  assert.equal("id" in r, false);
});

test("recenzieNoua pune text gol când textul lipsește", () => {
  assert.equal(recenzieNoua({ comanda: { id: 7, restaurant: "Sushi Kyo" }, nota: 4 }, ACUM).text, "");
});

// --- curataRecenzii ---

test("curataRecenzii întoarce [] pentru un răspuns care nu e listă", () => {
  for (const v of [null, undefined, {}, "[]", 42, JSON.stringify([recenzie()])]) assert.deepEqual(curataRecenzii(v), []);
});

test("curataRecenzii păstrează o recenzie validă, doar cu câmpurile cunoscute", () => {
  const curate = curataRecenzii([{ ...recenzie(), admin: true, __proto__x: 1 }]);
  assert.deepEqual(curate, [recenzie()]);
});

test("curataRecenzii scoate intrările stricate", () => {
  const lista = [
    null,
    "recenzie",
    7,
    [],
    recenzie({ id: 0 }),
    recenzie({ id: "  " }),
    recenzie({ comandaId: null }),
    recenzie({ restaurant: "" }),
    recenzie({ restaurant: 5 }),
    recenzie({ nota: 0 }),
    recenzie({ nota: 6 }),
    recenzie({ nota: 4.5 }),
    recenzie({ nota: "5" }),
    recenzie({ id: 2 }),
  ];
  const curate = curataRecenzii(lista);
  assert.equal(curate.length, 1);
  assert.equal(curate[0].id, 2);
});

test("curataRecenzii acceptă id-uri text", () => {
  assert.equal(curataRecenzii([recenzie({ id: "abc", comandaId: "10" })]).length, 1);
});

test("curataRecenzii taie textul prea lung și pune text gol când lipsește", () => {
  const [lung, lipsa] = curataRecenzii([recenzie({ text: "x".repeat(800) }), recenzie({ id: 2, text: { html: "<b>" } })]);
  assert.equal(lung.text.length, 500);
  assert.equal(lipsa.text, "");
});

test("curataRecenzii pune creata: null pentru o dată invalidă", () => {
  for (const creata of ["ieri", "", 12345, null]) assert.equal(curataRecenzii([recenzie({ creata })])[0].creata, null, String(creata));
});

// --- recenziaComenzii / poateLasaRecenzie ---

test("recenziaComenzii compară id-urile ca text (adresa dă text, serverul număr)", () => {
  const lista = [recenzie({ id: 1, comandaId: 10 }), recenzie({ id: 2, comandaId: 11 })];
  assert.equal(recenziaComenzii(lista, "11").id, 2);
  assert.equal(recenziaComenzii(lista, 10).id, 1);
  assert.equal(recenziaComenzii(lista, 99), null);
  assert.equal(recenziaComenzii([], 10), null);
});

test("poateLasaRecenzie: doar o comandă livrată, fără recenzie", () => {
  const livrata = { id: 10, livrata: true, stare: "livrata" };
  assert.equal(poateLasaRecenzie(livrata, []), true);
  assert.equal(poateLasaRecenzie(livrata, [recenzie({ comandaId: 10 })]), false);
  assert.equal(poateLasaRecenzie(livrata, [recenzie({ comandaId: 11 })]), true);
});

test("poateLasaRecenzie: comenzile nelivrate, anulate sau respinse nu pot primi recenzie", () => {
  for (const stare of ["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "anulata", "respinsa"]) {
    assert.equal(poateLasaRecenzie({ id: 10, livrata: false, stare }, []), false, stare);
  }
});

test("poateLasaRecenzie funcționează pe comenzile vechi din db.json (doar bifa livrata)", () => {
  assert.equal(poateLasaRecenzie(db.comenzi.find((c) => c.livrata), []), true);
  assert.equal(poateLasaRecenzie(db.comenzi.find((c) => !c.livrata), []), false);
});

// --- recenziiRestaurant / medieRecenzii ---

test("recenziiRestaurant: doar restaurantul cerut, cele mai noi primele, cele fără dată la final", () => {
  const lista = curataRecenzii([
    recenzie({ id: 1, creata: "2026-11-20T10:00:00.000Z" }),
    recenzie({ id: 2, creata: null }),
    recenzie({ id: 3, creata: "2026-11-22T10:00:00.000Z" }),
    recenzie({ id: 4, restaurant: "Sushi Kyo", creata: "2026-11-23T10:00:00.000Z" }),
    recenzie({ id: 5, creata: "2026-11-21T10:00:00.000Z" }),
  ]);
  assert.deepEqual(recenziiRestaurant(lista, "Pizzeria Napoli").map((r) => r.id), [3, 5, 1, 2]);
  assert.deepEqual(recenziiRestaurant(lista, "Burger Van"), []);
});

test("recenziiRestaurant nu modifică lista primită", () => {
  const lista = Object.freeze([recenzie({ id: 1, creata: "2026-11-20T10:00:00.000Z" }), recenzie({ id: 2, creata: "2026-11-22T10:00:00.000Z" })]);
  assert.doesNotThrow(() => recenziiRestaurant(lista, "Pizzeria Napoli"));
});

test("medieRecenzii întoarce null fără recenzii (nu inventăm o notă)", () => {
  assert.equal(medieRecenzii([]), null);
  assert.equal(medieRecenzii(null), null);
  assert.equal(medieRecenzii(undefined), null);
});

test("medieRecenzii rotunjește la o zecimală și numără recenziile", () => {
  assert.deepEqual(medieRecenzii([{ nota: 5 }, { nota: 4 }, { nota: 4 }]), { medie: 4.3, numar: 3 });
  assert.deepEqual(medieRecenzii([{ nota: 5 }, { nota: 4 }]), { medie: 4.5, numar: 2 });
  assert.deepEqual(medieRecenzii([{ nota: 1 }]), { medie: 1, numar: 1 });
});

// --- formatNota / formatRecenzii ---

test("formatNota folosește virgula și mereu o zecimală", () => {
  assert.equal(formatNota(4.5), "4,5");
  assert.equal(formatNota(4), "4,0");
  assert.equal(formatNota(5), "5,0");
});

test("formatRecenzii respectă acordul în română", () => {
  assert.equal(formatRecenzii(0), "0 recenzii");
  assert.equal(formatRecenzii(1), "1 recenzie");
  assert.equal(formatRecenzii(3), "3 recenzii");
  assert.equal(formatRecenzii(19), "19 recenzii");
  assert.equal(formatRecenzii(20), "20 de recenzii");
  assert.equal(formatRecenzii(101), "101 recenzii");
  assert.equal(formatRecenzii(120), "120 de recenzii");
});
