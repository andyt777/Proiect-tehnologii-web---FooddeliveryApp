// Teste pentru logica pură a coșului (src/cos.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANTITATE_MAXIMA,
  adaugaInCos,
  schimbaCantitate,
  scoateDinCos,
  liniiCos,
  numarProduse,
  totalCos,
  cosInComenzi,
  citesteCos,
  pastreazaDinMeniu,
} from "../src/cos.js";

// Îngheață recursiv: orice mutație a intrării aruncă TypeError (ESM rulează în strict mode)
function deepFreeze(obj) {
  for (const v of Object.values(obj)) if (v && typeof v === "object") deepFreeze(v);
  return Object.freeze(obj);
}

// Meniu mic și determinist pentru teste
const MENIU_TEST = deepFreeze([
  { id: "a", preparat: "Pizza A", restaurant: "R1", categorie: "Pizza", pret: 40 },
  { id: "b", preparat: "Burger B", restaurant: "R2", categorie: "Burgers", pret: 35 },
  { id: "c", preparat: "Sushi C", restaurant: "R3", categorie: "Asian", pret: 1250 },
]);

// --- CANTITATE_MAXIMA ---

test("CANTITATE_MAXIMA este 20", () => {
  assert.equal(CANTITATE_MAXIMA, 20);
});

// --- adaugaInCos ---

test("adaugaInCos adaugă o linie nouă cu cantitatea 1 într-un coș gol", () => {
  const cos = deepFreeze([]);
  const rezultat = adaugaInCos(cos, "a");
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 1 }]);
  assert.notEqual(rezultat, cos);
  assert.deepEqual(cos, []);
});

test("adaugaInCos adaugă linia nouă la final, fără să le schimbe pe celelalte", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }]);
  const rezultat = adaugaInCos(cos, "b");
  assert.deepEqual(rezultat, [
    { produsId: "a", cantitate: 2 },
    { produsId: "b", cantitate: 1 },
  ]);
  assert.equal(rezultat[0], cos[0]); // linia neschimbată e aceeași referință
  assert.deepEqual(cos, [{ produsId: "a", cantitate: 2 }]);
});

test("adaugaInCos crește cu 1 cantitatea unui produs existent", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }, { produsId: "b", cantitate: 1 }]);
  const rezultat = adaugaInCos(cos, "a");
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 3 }, { produsId: "b", cantitate: 1 }]);
  assert.notEqual(rezultat, cos);
  assert.notEqual(rezultat[0], cos[0]); // linia modificată e un obiect nou
  assert.equal(rezultat[1], cos[1]);
  assert.equal(cos[0].cantitate, 2);
});

test("adaugaInCos nu trece de CANTITATE_MAXIMA și întoarce același coș", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: CANTITATE_MAXIMA }]);
  const rezultat = adaugaInCos(cos, "a");
  assert.equal(rezultat, cos);
  assert.equal(rezultat[0].cantitate, CANTITATE_MAXIMA);
});

test("adaugaInCos de la 19 ajunge exact la plafon", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: CANTITATE_MAXIMA - 1 }]);
  assert.deepEqual(adaugaInCos(cos, "a"), [{ produsId: "a", cantitate: CANTITATE_MAXIMA }]);
});

test("adaugaInCos de 25 de ori se oprește la CANTITATE_MAXIMA", () => {
  let cos = [];
  for (let i = 0; i < 25; i++) cos = adaugaInCos(cos, "a");
  assert.deepEqual(cos, [{ produsId: "a", cantitate: CANTITATE_MAXIMA }]);
});

// --- schimbaCantitate ---

test("schimbaCantitate crește cantitatea cu delta pozitiv", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 1 }]);
  const rezultat = schimbaCantitate(cos, "a", 1);
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 2 }]);
  assert.notEqual(rezultat, cos);
  assert.equal(cos[0].cantitate, 1);
});

test("schimbaCantitate scade cantitatea cu delta negativ", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 3 }]);
  assert.deepEqual(schimbaCantitate(cos, "a", -1), [{ produsId: "a", cantitate: 2 }]);
});

test("schimbaCantitate plafonează un delta mare la CANTITATE_MAXIMA", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 5 }]);
  assert.deepEqual(schimbaCantitate(cos, "a", 100), [{ produsId: "a", cantitate: CANTITATE_MAXIMA }]);
});

test("schimbaCantitate la plafon cu delta pozitiv întoarce același coș", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: CANTITATE_MAXIMA }]);
  assert.equal(schimbaCantitate(cos, "a", 1), cos);
});

test("schimbaCantitate scoate linia când cantitatea ajunge la 0", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 1 }, { produsId: "b", cantitate: 2 }]);
  const rezultat = schimbaCantitate(cos, "a", -1);
  assert.deepEqual(rezultat, [{ produsId: "b", cantitate: 2 }]);
  assert.equal(cos.length, 2);
});

test("schimbaCantitate scoate linia când cantitatea devine negativă", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }]);
  assert.deepEqual(schimbaCantitate(cos, "a", -5), []);
});

test("schimbaCantitate cu produsId necunoscut întoarce același coș", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }]);
  assert.equal(schimbaCantitate(cos, "inexistent", 1), cos);
  assert.equal(schimbaCantitate(cos, "inexistent", -1), cos);
});

test("schimbaCantitate cu delta 0 întoarce același coș", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }]);
  assert.equal(schimbaCantitate(cos, "a", 0), cos);
});

test("schimbaCantitate cu delta nenumeric (NaN, Infinity, text) întoarce același coș", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }]);
  assert.equal(schimbaCantitate(cos, "a", NaN), cos);
  assert.equal(schimbaCantitate(cos, "a", Infinity), cos);
  assert.equal(schimbaCantitate(cos, "a", "1"), cos);
});

// --- scoateDinCos ---

test("scoateDinCos elimină linia și păstrează ordinea celorlalte", () => {
  const cos = deepFreeze([
    { produsId: "a", cantitate: 1 },
    { produsId: "b", cantitate: 2 },
    { produsId: "c", cantitate: 3 },
  ]);
  const rezultat = scoateDinCos(cos, "b");
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 1 }, { produsId: "c", cantitate: 3 }]);
  assert.notEqual(rezultat, cos);
  assert.equal(cos.length, 3);
});

test("scoateDinCos cu produsId necunoscut lasă conținutul neschimbat", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 1 }]);
  assert.deepEqual(scoateDinCos(cos, "x"), [{ produsId: "a", cantitate: 1 }]);
});

// --- liniiCos ---

test("liniiCos unește coșul cu meniul și calculează subtotalul", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 3 }, { produsId: "b", cantitate: 1 }]);
  assert.deepEqual(liniiCos(cos, MENIU_TEST), [
    { ...MENIU_TEST[0], cantitate: 3, subtotal: 120 },
    { ...MENIU_TEST[1], cantitate: 1, subtotal: 35 },
  ]);
});

test("liniiCos sare peste id-urile care nu există în meniu", () => {
  const cos = deepFreeze([
    { produsId: "a", cantitate: 1 },
    { produsId: "sters", cantitate: 4 },
    { produsId: "c", cantitate: 2 },
  ]);
  const linii = liniiCos(cos, MENIU_TEST);
  assert.deepEqual(linii.map((l) => l.id), ["a", "c"]);
  assert.equal(linii[1].subtotal, 2500);
});

test("liniiCos pentru coș gol întoarce listă goală", () => {
  assert.deepEqual(liniiCos(deepFreeze([]), MENIU_TEST), []);
});

// --- numarProduse / totalCos ---

test("numarProduse adună cantitățile, nu numără liniile", () => {
  assert.equal(numarProduse([{ produsId: "a", cantitate: 3 }, { produsId: "b", cantitate: 2 }]), 5);
  assert.equal(numarProduse([]), 0);
});

test("totalCos adună subtotalurile liniilor", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 2 }, { produsId: "c", cantitate: 1 }]);
  assert.equal(totalCos(liniiCos(cos, MENIU_TEST)), 80 + 1250);
  assert.equal(totalCos([]), 0);
});

// --- cosInComenzi ---

const linie = (id, cantitate) => {
  const p = MENIU_TEST.find((x) => x.id === id);
  return { ...p, cantitate, subtotal: p.pret * cantitate };
};

test("cosInComenzi pornește id-urile de la 1 când nu există comenzi", () => {
  const linii = deepFreeze([linie("a", 1), linie("b", 2)]);
  const comenzi = deepFreeze([]);
  const rezultat = cosInComenzi(linii, comenzi, "rapida");
  assert.deepEqual(rezultat.map((c) => c.id), [1, 2]);
  assert.notEqual(rezultat, comenzi);
});

test("cosInComenzi continuă de la cel mai mare id + 1, consecutiv", () => {
  const comenzi = deepFreeze([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const rezultat = cosInComenzi(deepFreeze([linie("a", 1), linie("b", 1), linie("c", 1)]), comenzi, "x");
  assert.deepEqual(rezultat.map((c) => c.id), [1, 2, 3, 4, 5, 6]);
});

test("cosInComenzi folosește maximul la id-uri necontigue și neordonate", () => {
  const comenzi = deepFreeze([{ id: 7 }, { id: 2 }, { id: 15 }, { id: 4 }]);
  const rezultat = cosInComenzi(deepFreeze([linie("a", 1), linie("b", 1)]), comenzi, "x");
  assert.deepEqual(rezultat.map((c) => c.id), [7, 2, 15, 4, 16, 17]);
});

test("cosInComenzi păstrează comenzile vechi la început, neschimbate", () => {
  const comenzi = deepFreeze([{ id: 1, preparat: "Vechi", livrata: true }]);
  const rezultat = cosInComenzi(deepFreeze([linie("a", 1)]), comenzi, "x");
  assert.equal(rezultat[0], comenzi[0]);
  assert.equal(comenzi.length, 1);
});

test("cosInComenzi adaugă sufixul „ × N” doar când cantitatea e mai mare ca 1", () => {
  const rezultat = cosInComenzi(deepFreeze([linie("a", 1), linie("b", 2), linie("c", 20)]), deepFreeze([]), "x");
  assert.deepEqual(rezultat.map((c) => c.preparat), ["Pizza A", "Burger B × 2", "Sushi C × 20"]);
});

test("cosInComenzi construiește comanda completă: pret = subtotal, livrata false, livrare transmisă", () => {
  const rezultat = cosInComenzi(deepFreeze([linie("b", 3)]), deepFreeze([{ id: 9 }]), "standard");
  assert.deepEqual(rezultat[1], {
    id: 10,
    preparat: "Burger B × 3",
    livrata: false,
    livrare: "standard",
    categorie: "Burgers",
    restaurant: "R2",
    pret: 105,
  });
});

test("cosInComenzi transmite livrarea neschimbată pe fiecare comandă nouă", () => {
  const livrare = deepFreeze({ tip: "rapida" });
  const rezultat = cosInComenzi(deepFreeze([linie("a", 1), linie("b", 1)]), deepFreeze([]), livrare);
  for (const c of rezultat) assert.equal(c.livrare, livrare);
});

test("cosInComenzi cu coș gol întoarce o copie a comenzilor existente", () => {
  const comenzi = deepFreeze([{ id: 1 }]);
  const rezultat = cosInComenzi(deepFreeze([]), comenzi, "x");
  assert.deepEqual(rezultat, [{ id: 1 }]);
  assert.notEqual(rezultat, comenzi);
});

// --- citesteCos ---

test("citesteCos întoarce coș gol pentru null", () => {
  assert.deepEqual(citesteCos(null), []);
});

test("citesteCos întoarce coș gol pentru undefined și alte tipuri ne-text", () => {
  assert.deepEqual(citesteCos(undefined), []);
  assert.deepEqual(citesteCos(42), []);
  assert.deepEqual(citesteCos([{ produsId: "a", cantitate: 1 }]), []);
});

test("citesteCos întoarce coș gol pentru text gol", () => {
  assert.deepEqual(citesteCos(""), []);
});

test("citesteCos întoarce coș gol pentru JSON invalid", () => {
  assert.deepEqual(citesteCos("{nu e json"), []);
  assert.deepEqual(citesteCos("[{\"produsId\":\"a\","), []);
});

test("citesteCos întoarce coș gol când JSON-ul e obiect, nu listă", () => {
  assert.deepEqual(citesteCos('{"produsId":"a","cantitate":1}'), []);
  assert.deepEqual(citesteCos("null"), []);
  assert.deepEqual(citesteCos('"text"'), []);
  assert.deepEqual(citesteCos("5"), []);
});

test("citesteCos păstrează un coș valid", () => {
  const text = JSON.stringify([{ produsId: "a", cantitate: 2 }, { produsId: "c", cantitate: 20 }]);
  assert.deepEqual(citesteCos(text), [
    { produsId: "a", cantitate: 2 },
    { produsId: "c", cantitate: 20 },
  ]);
});

test("citesteCos aruncă liniile invalide și le păstrează pe cele bune", () => {
  const text = JSON.stringify([
    { produsId: "a", cantitate: 1 }, // bună
    null, // nu e obiect
    "a", // nu e obiect
    7, // nu e obiect
    [], // listă, nu are câmpuri
    { cantitate: 1 }, // lipsește produsId
    { produsId: "b" }, // lipsește cantitatea
    { produsId: "b", cantitate: "2" }, // cantitate text
    { produsId: "b", cantitate: 0 }, // sub minim
    { produsId: "b", cantitate: -1 }, // negativă
    { produsId: "b", cantitate: 21 }, // peste plafon
    { produsId: "b", cantitate: 1.5 }, // nu e întreagă
    { produsId: 1, cantitate: 1 }, // id numeric
    { produsId: "", cantitate: 1 }, // id gol
    { produsId: "c", cantitate: 3 }, // bună
  ]);
  assert.deepEqual(citesteCos(text), [
    { produsId: "a", cantitate: 1 },
    { produsId: "c", cantitate: 3 },
  ]);
});

test("citesteCos verifică doar forma: păstrează id-uri care nu sunt (încă) în meniu", () => {
  const text = JSON.stringify([{ produsId: "x", cantitate: 1 }, { produsId: "a", cantitate: 2 }]);
  assert.deepEqual(citesteCos(text), [
    { produsId: "x", cantitate: 1 },
    { produsId: "a", cantitate: 2 },
  ]);
});

test("citesteCos păstrează doar prima apariție a unui produs duplicat", () => {
  const text = JSON.stringify([
    { produsId: "a", cantitate: 2 },
    { produsId: "b", cantitate: 1 },
    { produsId: "a", cantitate: 5 },
  ]);
  assert.deepEqual(citesteCos(text), [
    { produsId: "a", cantitate: 2 },
    { produsId: "b", cantitate: 1 },
  ]);
});

test("citesteCos: o primă apariție invalidă nu blochează un duplicat valid ulterior", () => {
  const text = JSON.stringify([{ produsId: "a", cantitate: 0 }, { produsId: "a", cantitate: 4 }]);
  assert.deepEqual(citesteCos(text), [{ produsId: "a", cantitate: 4 }]);
});

test("citesteCos elimină cheile în plus din linii", () => {
  const text = JSON.stringify([{ produsId: "a", cantitate: 2, pret: 1, __proto__x: "rău", extra: { y: 1 } }]);
  const rezultat = citesteCos(text);
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 2 }]);
  assert.deepEqual(Object.keys(rezultat[0]), ["produsId", "cantitate"]);
});

test("citesteCos nu e afectat de o cheie __proto__ în JSON", () => {
  const rezultat = citesteCos('[{"produsId":"a","cantitate":1,"__proto__":{"admin":true}}]');
  assert.deepEqual(rezultat, [{ produsId: "a", cantitate: 1 }]);
  assert.equal(rezultat[0].admin, undefined);
  assert.equal({}.admin, undefined);
});

test("citesteCos cu listă goală întoarce coș gol", () => {
  assert.deepEqual(citesteCos("[]"), []);
});

// --- pastreazaDinMeniu ---

test("pastreazaDinMeniu scoate produsele care nu există în meniu, păstrând ordinea", () => {
  const cos = deepFreeze([
    { produsId: "c", cantitate: 2 },
    { produsId: "sters", cantitate: 4 },
    { produsId: "a", cantitate: 1 },
  ]);
  const rezultat = pastreazaDinMeniu(cos, MENIU_TEST);
  assert.deepEqual(rezultat, [{ produsId: "c", cantitate: 2 }, { produsId: "a", cantitate: 1 }]);
  assert.notEqual(rezultat, cos);
  assert.equal(rezultat[0], cos[0]); // liniile păstrate sunt aceleași obiecte
  assert.equal(cos.length, 3);
});

test("pastreazaDinMeniu întoarce același coș când toate produsele există", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 1 }, { produsId: "b", cantitate: 3 }]);
  assert.equal(pastreazaDinMeniu(cos, MENIU_TEST), cos);
});

test("pastreazaDinMeniu cu coș gol întoarce același coș gol", () => {
  const cos = deepFreeze([]);
  assert.equal(pastreazaDinMeniu(cos, MENIU_TEST), cos);
});

test("pastreazaDinMeniu cu meniu gol golește coșul", () => {
  const cos = deepFreeze([{ produsId: "a", cantitate: 1 }]);
  assert.deepEqual(pastreazaDinMeniu(cos, deepFreeze([])), []);
});

test("citesteCos + pastreazaDinMeniu: coșul salvat, apoi filtrat după sosirea meniului", () => {
  const text = JSON.stringify([{ produsId: "a", cantitate: 2 }, { produsId: "x", cantitate: 1 }, { produsId: "a", cantitate: 9 }]);
  assert.deepEqual(pastreazaDinMeniu(citesteCos(text), MENIU_TEST), [{ produsId: "a", cantitate: 2 }]);
});
