// Teste pentru logica paginii /livrator (src/livrator.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURSE_ACTIVE_MAX, ETICHETE_ACTIUNE, STARI_CURSA_DISPONIBILA, acelasiId, actiuneUrmatoare, curataLivratori, curseDisponibile, curseLivrator, motivFaraAcceptare, numarLivrate, numeLivrator, poateRenunta,
} from "../src/livrator.js";
import { aplicaPasLivrare, aplicaTranzitie, campuriInitiale } from "../src/stari.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const T0 = Date.parse("2026-11-22T18:00:00.000Z");
const minut = (n) => new Date(T0 + n * 60000);

// O comandă plasată la `plasataLaMin`, dusă prin stările cerute (câte un minut între ele)
function comandaIn(stari, { id = 1, livrare = "standard", plasataLaMin = 0 } = {}) {
  let c = { id, preparat: `Comanda ${id}`, livrata: false, livrare, categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 40, ...campuriInitiale({ livrare, metodaPlata: "numerar" }, minut(plasataLaMin)) };
  stari.forEach((stare, i) => { c = { ...c, ...aplicaTranzitie(c, stare, minut(plasataLaMin + i + 1)) }; });
  return c;
}

function cuPas(comanda, pas, extra) {
  return { ...comanda, ...aplicaPasLivrare(comanda, pas, minut(100), extra) };
}

const PREGATITA = ["acceptata", "in_preparare"];
const GATA = ["acceptata", "in_preparare", "gata"];

// --- constante ---

test("o cursă e disponibilă în preparare sau gata, iar un livrator are cel mult o cursă activă", () => {
  assert.deepEqual([...STARI_CURSA_DISPONIBILA], ["in_preparare", "gata"]);
  assert.equal(CURSE_ACTIVE_MAX, 1);
});

// --- acelasiId ---

test("acelasiId compară numere și texte ca text", () => {
  assert.equal(acelasiId(1, "1"), true);
  assert.equal(acelasiId("2", 2), true);
  assert.equal(acelasiId(1, 2), false);
});

test("acelasiId respinge id-urile invalide, chiar dacă sunt egale", () => {
  for (const id of [0, -1, null, undefined, "", "  ", 1.5, NaN]) assert.equal(acelasiId(id, id), false, String(id));
});

// --- curataLivratori ---

test("curataLivratori pe db.json: trei livratori demo, toți offline", () => {
  const l = curataLivratori(db.livratori);
  assert.equal(l.length, 3);
  assert.ok(l.every((x) => x.online === false));
  assert.ok(l.every((x) => /demo/.test(x.nume)));
});

test("curataLivratori întoarce [] pentru un răspuns care nu e listă", () => {
  for (const v of [null, undefined, {}, "[]", 5, JSON.stringify(db.livratori)]) assert.deepEqual(curataLivratori(v), []);
});

test("curataLivratori scoate intrările stricate și păstrează doar câmpurile cunoscute", () => {
  const curate = curataLivratori([
    null,
    "Andrei",
    { id: 0, nume: "Zero" },
    { id: 1, nume: "" },
    { id: 2, nume: "   " },
    { id: 3 },
    { id: 4, nume: 7 },
    { id: 5, nume: "Ioana", online: true, parola: "x" },
    { id: "6", nume: "Mihai", online: "true" },
  ]);
  assert.deepEqual(curate, [{ id: 5, nume: "Ioana", online: true, activ: true }, { id: "6", nume: "Mihai", online: false, activ: true }]);
});

// --- curseDisponibile ---

test("curseDisponibile: comenzile din db.json (fără stare nouă) nu sunt disponibile", () => {
  assert.deepEqual(curseDisponibile(db.comenzi), []);
});

test("curseDisponibile întoarce [] pentru un răspuns care nu e listă", () => {
  for (const v of [null, undefined, {}, "x"]) assert.deepEqual(curseDisponibile(v), []);
});

test("curseDisponibile include doar comenzile cu livrare, neasignate, în preparare sau gata", () => {
  const inPreparare = comandaIn(PREGATITA, { id: 1 });
  const gata = comandaIn(GATA, { id: 2 });
  const comenzi = [
    inPreparare,
    gata,
    comandaIn([], { id: 3 }),
    comandaIn(["acceptata"], { id: 4 }),
    comandaIn(GATA, { id: 5, livrare: "ridicare" }),
    comandaIn(PREGATITA, { id: 6, livrare: "ridicare" }),
    cuPas(comandaIn(GATA, { id: 7 }), "asignata", { livratorId: 1 }),
    comandaIn([...GATA, "in_livrare"], { id: 8 }),
    comandaIn([...GATA, "in_livrare", "livrata"], { id: 9 }),
    comandaIn(["anulata"], { id: 10 }),
    comandaIn(["respinsa"], { id: 11 }),
  ];
  assert.deepEqual(curseDisponibile(comenzi).map((c) => c.id).sort(), [1, 2]);
});

test("curseDisponibile exclude o comandă la ridicare chiar dacă are livrareStare: neasignata din date", () => {
  const ridicare = { ...comandaIn(GATA, { id: 1, livrare: "ridicare" }), livrareStare: "neasignata" };
  assert.deepEqual(curseDisponibile([ridicare]), []);
});

test("curseDisponibile pune cursele gata primele, apoi cele mai vechi", () => {
  const comenzi = [
    comandaIn(PREGATITA, { id: 1, plasataLaMin: 0 }),
    comandaIn(GATA, { id: 2, plasataLaMin: 20 }),
    comandaIn(PREGATITA, { id: 3, plasataLaMin: -10 }),
    comandaIn(GATA, { id: 4, plasataLaMin: 5 }),
  ];
  assert.deepEqual(curseDisponibile(comenzi).map((c) => c.id), [4, 2, 3, 1]);
});

test("curseDisponibile întoarce obiectele primite și nu modifică lista", () => {
  const c = comandaIn(GATA, { id: 1 });
  const lista = Object.freeze([c]);
  const rezultat = curseDisponibile(lista);
  assert.equal(rezultat[0], c);
});

// --- curseLivrator / limita de curse active ---

test("curseLivrator: doar cursele neîncheiate asignate acelui livrator (id număr sau text)", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  const b = cuPas(comandaIn(PREGATITA, { id: 2 }), "asignata", { livratorId: 2 });
  const livrata = { ...a, id: 3, ...aplicaTranzitie({ ...a, ...aplicaPasLivrare(a, "spre_restaurant", minut(50)) }, "in_livrare", minut(51)) };
  const finalizata = { ...livrata, ...aplicaTranzitie(livrata, "livrata", minut(60)) };
  const comenzi = [a, b, finalizata, comandaIn(GATA, { id: 4 })];
  assert.deepEqual(curseLivrator(comenzi, 1).map((c) => c.id), [1]);
  assert.deepEqual(curseLivrator(comenzi, "1").map((c) => c.id), [1]);
  assert.deepEqual(curseLivrator(comenzi, 2).map((c) => c.id), [2]);
  assert.deepEqual(curseLivrator(comenzi, 3), []);
});

test("curseLivrator întoarce [] pentru id invalid sau listă invalidă", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  assert.deepEqual(curseLivrator([a], null), []);
  assert.deepEqual(curseLivrator([a], 0), []);
  assert.deepEqual(curseLivrator(null, 1), []);
});

test("curseLivrator nu numără o comandă anulată de admin în timpul cursei", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  const anulata = { ...a, ...aplicaTranzitie(a, "anulata", minut(70)) };
  assert.deepEqual(curseLivrator([anulata], 1), []);
});

test("motivFaraAcceptare: limita de curse active", () => {
  const online = { id: 1, nume: "Ioana", online: true };
  assert.equal(motivFaraAcceptare(online, 0), null);
  assert.equal(motivFaraAcceptare(online, CURSE_ACTIVE_MAX), "Termină cursa în lucru înainte să accepți alta.");
  assert.equal(motivFaraAcceptare(online, CURSE_ACTIVE_MAX + 1), "Termină cursa în lucru înainte să accepți alta.");
});

test("motivFaraAcceptare: fără livrator ales sau offline", () => {
  assert.equal(motivFaraAcceptare(null, 0), "Alege un livrator demo.");
  assert.equal(motivFaraAcceptare(undefined, 0), "Alege un livrator demo.");
  assert.equal(motivFaraAcceptare({ id: 1, online: false }, 0), "Intră online ca să poți accepta curse.");
  assert.equal(motivFaraAcceptare({ id: 1, online: "true" }, 0), "Intră online ca să poți accepta curse.");
});

test("limita de curse active, din date: după ce acceptă o cursă, livratorul nu mai poate lua alta", () => {
  const livrator = { id: 1, nume: "Ioana", online: true };
  const comenzi = [comandaIn(GATA, { id: 1 }), comandaIn(GATA, { id: 2 })];
  assert.equal(motivFaraAcceptare(livrator, curseLivrator(comenzi, 1).length), null);
  comenzi[0] = cuPas(comenzi[0], "asignata", { livratorId: 1 });
  assert.equal(curseLivrator(comenzi, 1).length, 1);
  assert.notEqual(motivFaraAcceptare(livrator, curseLivrator(comenzi, 1).length), null);
  assert.deepEqual(curseDisponibile(comenzi).map((c) => c.id), [2]);
});

// --- numarLivrate ---

test("numarLivrate numără doar comenzile livrate de acel livrator", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  const peDrum = cuPas(cuPas(a, "spre_restaurant"), "preluata");
  const predata = cuPas(cuPas(peDrum, "spre_client"), "livrata");
  assert.equal(numarLivrate([predata, peDrum, { ...predata, id: 2, livratorId: 2 }], 1), 1);
  assert.equal(numarLivrate([predata], "1"), 1);
  assert.equal(numarLivrate(db.comenzi, 1), 0);
  assert.equal(numarLivrate(null, 1), 0);
  assert.equal(numarLivrate([predata], null), 0);
});

// --- actiuneUrmatoare / poateRenunta ---

test("actiuneUrmatoare: după asignare, pornește spre restaurant", () => {
  const a = cuPas(comandaIn(PREGATITA, { id: 1 }), "asignata", { livratorId: 1 });
  assert.deepEqual(actiuneUrmatoare(a), { pas: "spre_restaurant", text: ETICHETE_ACTIUNE.spre_restaurant, permis: true, motiv: null });
});

test("actiuneUrmatoare: preluarea e blocată până când comanda e gata, cu motiv explicat", () => {
  const peDrum = cuPas(cuPas(comandaIn(PREGATITA, { id: 1 }), "asignata", { livratorId: 1 }), "spre_restaurant");
  const r = actiuneUrmatoare(peDrum);
  assert.equal(r.pas, "preluata");
  assert.equal(r.permis, false);
  assert.match(r.motiv, /nu e gata/);
});

test("actiuneUrmatoare: drumul complet al unei curse gata", () => {
  let c = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  const pasi = [];
  for (let i = 0; i < 10; i += 1) {
    const a = actiuneUrmatoare(c);
    if (a === null) break;
    assert.equal(a.permis, true, a.pas);
    pasi.push(a.pas);
    c = cuPas(c, a.pas);
  }
  assert.deepEqual(pasi, ["spre_restaurant", "preluata", "spre_client", "livrata"]);
  assert.equal(c.stare, "livrata");
  assert.equal(c.livrata, true);
  assert.equal(actiuneUrmatoare(c), null);
});

test("actiuneUrmatoare întoarce null pentru o cursă neasignată sau o comandă la ridicare", () => {
  assert.equal(actiuneUrmatoare(comandaIn(GATA, { id: 1 })), null);
  assert.equal(actiuneUrmatoare(comandaIn(GATA, { id: 2, livrare: "ridicare" })), null);
  assert.equal(actiuneUrmatoare(db.comenzi[0]), null);
});

test("actiuneUrmatoare: pasul devenit imposibil (comanda anulată între timp) e blocat cu motiv generic", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  const anulata = { ...a, ...aplicaTranzitie(a, "anulata", minut(70)) };
  const r = actiuneUrmatoare(anulata);
  assert.equal(r.permis, false);
  assert.match(r.motiv, /nu mai e posibil/);
});

test("poateRenunta: doar înainte de plecarea spre restaurant", () => {
  const a = cuPas(comandaIn(GATA, { id: 1 }), "asignata", { livratorId: 1 });
  assert.equal(poateRenunta(a), true);
  assert.equal(poateRenunta(cuPas(a, "spre_restaurant")), false);
  assert.equal(poateRenunta(comandaIn(GATA, { id: 2 })), false);
});

// --- numeLivrator ---

test("numeLivrator găsește numele după id număr sau text și întoarce null altfel", () => {
  const l = curataLivratori(db.livratori);
  assert.equal(numeLivrator(l, 2), l[1].nume);
  assert.equal(numeLivrator(l, "3"), l[2].nume);
  assert.equal(numeLivrator(l, 99), null);
  assert.equal(numeLivrator(l, null), null);
  assert.equal(numeLivrator(null, 1), null);
});
