// Teste pentru cifrele paginii /admin (src/metrici.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FILTRE_GOALE, REGULA_INTARZIERE, TERMEN_ACCEPTARE_MIN, TERMEN_PRELUARE_MIN, TIMP_PREPARARE_IMPLICIT_MIN, filtreazaComenzi, formatMinute, formatProcent, indicatori, intarziere, jurnalEvenimente, minuteIntre, momenteStari,
} from "../src/metrici.js";
import { MINUTE_LIVRARE } from "../src/livrare.js";
import { aplicaPasLivrare, aplicaTranzitie, campuriInitiale } from "../src/stari.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));
const T0 = Date.parse("2026-11-22T18:00:00.000Z");
const MIN = 60000;
const la = (minute) => T0 + minute * MIN;

// O comandă plasată la T0 și dusă prin stări, la minutele date: [[stare, minut], ...]
function comandaPrin(pasi, { id = 1, livrare = "standard", metodaPlata = "numerar", extra = {}, detalii = {} } = {}) {
  let c = { id, preparat: `Comanda ${id}`, livrata: false, livrare, categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 50, ...campuriInitiale({ livrare, metodaPlata }, new Date(T0)), ...extra };
  for (const [stare, minut] of pasi) c = { ...c, ...aplicaTranzitie(c, stare, new Date(la(minut)), detalii[stare] ?? {}) };
  return c;
}

// --- constante ---

test("regula întârzierii afișată folosește aceleași numere ca în cod", () => {
  assert.equal(TERMEN_ACCEPTARE_MIN, 10);
  assert.equal(TIMP_PREPARARE_IMPLICIT_MIN, 20);
  assert.equal(TERMEN_PRELUARE_MIN, 15);
  for (const n of [TERMEN_ACCEPTARE_MIN, TIMP_PREPARARE_IMPLICIT_MIN, TERMEN_PRELUARE_MIN, MINUTE_LIVRARE.standard, MINUTE_LIVRARE.express]) {
    assert.ok(REGULA_INTARZIERE.includes(`${n} min`), String(n));
  }
});

// --- momenteStari / minuteIntre ---

test("momenteStari citește momentele din istoric", () => {
  const c = comandaPrin([["acceptata", 3], ["in_preparare", 4]]);
  const m = momenteStari(c);
  assert.equal(m.get("plasata"), T0);
  assert.equal(m.get("acceptata"), la(3));
  assert.equal(m.get("in_preparare"), la(4));
  assert.equal(m.has("gata"), false);
});

test("momenteStari folosește `creata` pentru plasare doar când istoricul nu o are", () => {
  assert.equal(momenteStari({ creata: "2026-11-22T17:00:00.000Z" }).get("plasata"), Date.parse("2026-11-22T17:00:00.000Z"));
  const c = { ...comandaPrin([]), creata: "2026-11-22T17:00:00.000Z" };
  assert.equal(momenteStari(c).get("plasata"), T0);
});

test("momenteStari pe comenzile vechi sau stricate întoarce o hartă goală", () => {
  for (const c of [...db.comenzi, null, undefined, {}, { istoric: "x" }, { istoric: [null, { stare: "gata", la: "ieri" }] }, { creata: "nu e dată" }]) {
    assert.equal(momenteStari(c).size, 0);
  }
});

test("momenteStari: când o stare apare de mai multe ori, ultima apariție câștigă", () => {
  const c = { istoric: [{ stare: "plasata", la: new Date(T0).toISOString() }, { stare: "livrata", la: new Date(la(5)).toISOString() }, { stare: "livrata", la: new Date(la(9)).toISOString() }] };
  assert.equal(momenteStari(c).get("livrata"), la(9));
});

test("minuteIntre: diferența în minute, null dacă lipsește un moment sau ordinea e inversă", () => {
  assert.equal(minuteIntre(T0, la(12.5)), 12.5);
  assert.equal(minuteIntre(T0, T0), 0);
  assert.equal(minuteIntre(la(5), T0), null);
  assert.equal(minuteIntre(undefined, T0), null);
  assert.equal(minuteIntre(T0, NaN), null);
});

// --- intarziere ---

test("intarziere la acceptare: exact la termen nu e întârziată, de la un minut peste da", () => {
  const c = comandaPrin([]);
  assert.equal(intarziere(c, la(10)), null);
  assert.equal(intarziere(c, la(10.99)), null);
  assert.deepEqual(intarziere(c, la(11)), { minute: 1, pas: "acceptare", termenMin: 10 });
  assert.deepEqual(intarziere(c, la(25.5)), { minute: 15, pas: "acceptare", termenMin: 10 });
});

test("intarziere la preparare folosește timpul cerut de restaurant, de la acceptare", () => {
  const c = comandaPrin([["acceptata", 2], ["in_preparare", 3]], { detalii: { acceptata: { timpPreparare: 30 } } });
  assert.equal(c.timpPreparare, 30);
  assert.equal(intarziere(c, la(32)), null);
  assert.deepEqual(intarziere(c, la(33)), { minute: 1, pas: "preparare", termenMin: 30 });
});

test("intarziere la preparare folosește 20 de minute când restaurantul nu a spus timpul", () => {
  const c = comandaPrin([["acceptata", 2]]);
  assert.equal(intarziere(c, la(22)), null);
  assert.deepEqual(intarziere(c, la(23)), { minute: 1, pas: "preparare", termenMin: 20 });
});

test("intarziere la preluare: 15 minute de la „Gata”, doar pentru livrare", () => {
  const c = comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 10]]);
  assert.equal(intarziere(c, la(25)), null);
  assert.deepEqual(intarziere(c, la(26)), { minute: 1, pas: "preluare", termenMin: 15 });
  const ridicare = comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 10]], { livrare: "ridicare" });
  assert.equal(intarziere(ridicare, la(500)), null);
});

test("intarziere pe drum: 45 de minute la Standard, 20 la Express", () => {
  const pasi = [["acceptata", 1], ["in_preparare", 2], ["gata", 3], ["in_livrare", 4]];
  const standard = comandaPrin(pasi);
  const express = comandaPrin(pasi, { livrare: "express" });
  assert.equal(intarziere(standard, la(49)), null);
  assert.deepEqual(intarziere(standard, la(50)), { minute: 1, pas: "livrare", termenMin: 45 });
  assert.equal(intarziere(express, la(24)), null);
  assert.deepEqual(intarziere(express, la(25)), { minute: 1, pas: "livrare", termenMin: 20 });
});

test("intarziere: comenzile încheiate nu sunt niciodată întârziate", () => {
  const livrata = comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3], ["in_livrare", 4], ["livrata", 5]]);
  const anulata = comandaPrin([["anulata", 1]]);
  const respinsa = comandaPrin([["respinsa", 1]]);
  for (const c of [livrata, anulata, respinsa]) assert.equal(intarziere(c, la(10000)), null);
});

test("intarziere: comenzile vechi fără istoric nu sunt evaluate (nu aruncă, întorc null)", () => {
  for (const c of db.comenzi) assert.equal(intarziere(c, la(10000)), null, `comanda ${c.id}`);
  assert.equal(intarziere({ stare: "in_preparare" }, la(10000)), null);
  assert.equal(intarziere(null, la(10000)), null);
});

test("intarziere: o comandă veche cu `creata` e evaluată la acceptare", () => {
  const c = { id: 9, livrata: false, livrare: "standard", creata: new Date(T0).toISOString() };
  assert.deepEqual(intarziere(c, la(12)), { minute: 2, pas: "acceptare", termenMin: 10 });
});

test("intarziere fără un moment valid de acum întoarce null", () => {
  const c = comandaPrin([]);
  for (const acum of [NaN, undefined, null, "2026-11-22"]) assert.equal(intarziere(c, acum), null, String(acum));
});

test("intarziere: o comandă programată nu e întârziată înainte de ora ei, după acceptare", () => {
  const programataLa = new Date(la(120)).toISOString();
  const acceptata = comandaPrin([["acceptata", 2]], { extra: { programataLa } });
  assert.equal(intarziere(acceptata, la(60)), null);
  assert.deepEqual(intarziere(acceptata, la(121)), { minute: 99, pas: "preparare", termenMin: 20 });
});

test("intarziere: o comandă programată tot trebuie acceptată în 10 minute", () => {
  const plasata = comandaPrin([], { extra: { programataLa: new Date(la(120)).toISOString() } });
  assert.deepEqual(intarziere(plasata, la(15)), { minute: 5, pas: "acceptare", termenMin: 10 });
});

// --- indicatori ---

test("indicatori pe comenzile din db.json (fără istoric): nu aruncă, mediile sunt null", () => {
  const r = indicatori(db.comenzi);
  assert.equal(r.numar, 6);
  assert.equal(r.valoare, 331);
  assert.equal(r.medieAcceptareMin, null);
  assert.equal(r.mediePreparareMin, null);
  assert.equal(r.medieLivrareMin, null);
  assert.equal(r.incheiate, 3);
  assert.equal(r.rataFinalizare, 1);
  assert.equal(r.rataAnulare, 0);
});

test("indicatori pe o listă goală sau invalidă: zerouri și null, fără NaN", () => {
  const gol = { numar: 0, valoare: 0, incheiate: 0, medieAcceptareMin: null, mediePreparareMin: null, medieLivrareMin: null, rataFinalizare: null, rataAnulare: null };
  assert.deepEqual(indicatori([]), gol);
  assert.deepEqual(indicatori(null), gol);
  assert.deepEqual(indicatori("x"), gol);
});

test("indicatori nu se oprește la intrări stricate în listă", () => {
  assert.doesNotThrow(() => indicatori([null, 5, "x", { istoric: [null] }]));
  assert.equal(indicatori([null, 5]).numar, 2);
});

test("indicatori calculează mediile din istoric, rotunjite la o zecimală", () => {
  const comenzi = [
    comandaPrin([["acceptata", 2], ["in_preparare", 3], ["gata", 23], ["in_livrare", 25], ["livrata", 55]], { id: 1 }),
    comandaPrin([["acceptata", 5], ["in_preparare", 6], ["gata", 16], ["in_livrare", 20], ["livrata", 40]], { id: 2 }),
    comandaPrin([["acceptata", 4]], { id: 3 }),
  ];
  const r = indicatori(comenzi);
  assert.equal(r.medieAcceptareMin, 3.7);
  assert.equal(r.mediePreparareMin, 15);
  assert.equal(r.medieLivrareMin, 25);
});

test("indicatori: valoarea scade reducerile și ignoră comenzile oprite și cele fără preț", () => {
  const comenzi = [
    comandaPrin([], { id: 1, extra: { pret: 100, cupon: "SAVORO10", reducere: 10 } }),
    comandaPrin([["anulata", 1]], { id: 2, extra: { pret: 80 } }),
    comandaPrin([["respinsa", 1]], { id: 3, extra: { pret: 70 } }),
    comandaPrin([], { id: 4, extra: { pret: null, speciala: true } }),
    comandaPrin([], { id: 5, extra: { pret: 15, reducere: 30 } }),
  ];
  assert.equal(indicatori(comenzi).valoare, 90);
});

test("indicatori: ratele de finalizare și anulare se calculează doar din comenzile încheiate", () => {
  const comenzi = [
    comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3], ["livrata", 4]], { id: 1, livrare: "ridicare" }),
    comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3], ["livrata", 4]], { id: 2, livrare: "ridicare" }),
    comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3], ["livrata", 4]], { id: 3, livrare: "ridicare" }),
    comandaPrin([["anulata", 1]], { id: 4 }),
    comandaPrin([], { id: 5 }),
  ];
  const r = indicatori(comenzi);
  assert.equal(r.incheiate, 4);
  assert.equal(r.rataFinalizare, 0.75);
  assert.equal(r.rataAnulare, 0.25);
  assert.equal(formatProcent(r.rataFinalizare), "75%");
});

// --- filtreazaComenzi ---

const ACUM = la(100);
const COMENZI_FILTRE = [
  comandaPrin([], { id: 1 }),
  comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3]], { id: 2, livrare: "ridicare", extra: { restaurant: "Sushi Kyo" } }),
  comandaPrin([["acceptata", 95]], { id: 3, metodaPlata: "card_simulat" }),
  comandaPrin([["anulata", 1]], { id: 4, metodaPlata: "card_simulat", extra: { restaurant: "Burger Van" } }),
];

test("filtreazaComenzi fără filtre (sau cu FILTRE_GOALE) întoarce toate comenzile, în aceeași ordine", () => {
  assert.deepEqual(filtreazaComenzi(COMENZI_FILTRE, {}, ACUM), COMENZI_FILTRE);
  assert.deepEqual(filtreazaComenzi(COMENZI_FILTRE, FILTRE_GOALE, ACUM), COMENZI_FILTRE);
  assert.deepEqual(filtreazaComenzi(COMENZI_FILTRE, undefined, ACUM), COMENZI_FILTRE);
});

test("filtreazaComenzi întoarce obiectele primite, nu cele normalizate", () => {
  assert.equal(filtreazaComenzi(COMENZI_FILTRE, {}, ACUM)[0], COMENZI_FILTRE[0]);
});

test("filtreazaComenzi după stare, plată și restaurant", () => {
  const ids = (f) => filtreazaComenzi(COMENZI_FILTRE, f, ACUM).map((c) => c.id);
  assert.deepEqual(ids({ stare: "plasata" }), [1]);
  assert.deepEqual(ids({ stare: "anulata" }), [4]);
  assert.deepEqual(ids({ plata: "platita" }), [3]);
  assert.deepEqual(ids({ plata: "rambursata" }), [4]);
  assert.deepEqual(ids({ plata: "neplatita" }), [1, 2]);
  assert.deepEqual(ids({ restaurant: "Sushi Kyo" }), [2]);
  assert.deepEqual(ids({ restaurant: "Nu există" }), []);
});

test("filtreazaComenzi după livrare: ridicare sau un pas al livrării", () => {
  const ids = (f) => filtreazaComenzi(COMENZI_FILTRE, f, ACUM).map((c) => c.id);
  assert.deepEqual(ids({ livrare: "ridicare" }), [2]);
  assert.deepEqual(ids({ livrare: "neasignata" }), [1, 3, 4]);
  assert.deepEqual(ids({ livrare: "asignata" }), []);
});

test("filtreazaComenzi doar întârziate, combinat cu alte filtre", () => {
  const ids = (f) => filtreazaComenzi(COMENZI_FILTRE, f, ACUM).map((c) => c.id);
  assert.deepEqual(ids({ doarIntarziate: true }), [1]);
  assert.deepEqual(ids({ doarIntarziate: true, restaurant: "Sushi Kyo" }), []);
});

test("filtreazaComenzi doar întârziate pe comenzile din db.json: niciuna (fără istoric)", () => {
  assert.deepEqual(filtreazaComenzi(db.comenzi, { doarIntarziate: true }, ACUM), []);
});

test("filtreazaComenzi întoarce [] pentru o listă invalidă", () => {
  assert.deepEqual(filtreazaComenzi(null, {}, ACUM), []);
  assert.deepEqual(filtreazaComenzi("x", {}, ACUM), []);
});

// --- jurnalEvenimente ---

test("jurnalEvenimente: toate trecerile, de la toate comenzile, cele mai noi primele", () => {
  const a = comandaPrin([["acceptata", 2], ["in_preparare", 7]], { id: 1 });
  const b = comandaPrin([["acceptata", 5]], { id: 2, livrare: "ridicare" });
  const jurnal = jurnalEvenimente([a, b]);
  assert.deepEqual(jurnal.map((e) => [e.comandaId, e.stare]), [[1, "in_preparare"], [2, "acceptata"], [1, "acceptata"], [1, "plasata"], [2, "plasata"]]);
  assert.deepEqual(jurnal.slice(0, 3).map((e) => e.la), [la(7), la(5), la(2)].map((ms) => new Date(ms).toISOString()));
  assert.equal(jurnal.length, 5);
  for (let i = 1; i < jurnal.length; i += 1) assert.ok(Date.parse(jurnal[i - 1].la) >= Date.parse(jurnal[i].la));
  assert.equal(jurnal.find((e) => e.comandaId === 2).ridicare, true);
  assert.equal(jurnal.find((e) => e.comandaId === 1).preparat, "Comanda 1");
});

test("jurnalEvenimente are chei unice, chiar și pentru momente egale", () => {
  const a = comandaPrin([["acceptata", 2]], { id: 1 });
  const b = comandaPrin([["acceptata", 2]], { id: 2 });
  const chei = jurnalEvenimente([a, b]).map((e) => e.cheie);
  assert.equal(new Set(chei).size, chei.length);
});

test("jurnalEvenimente respectă limita, implicit 40", () => {
  const multe = Array.from({ length: 30 }, (_, i) => comandaPrin([["acceptata", i + 1]], { id: i + 1 }));
  assert.equal(jurnalEvenimente(multe).length, 40);
  assert.equal(jurnalEvenimente(multe, 3).length, 3);
  assert.deepEqual(jurnalEvenimente(multe, 3).map((e) => e.comandaId), [30, 29, 28]);
  assert.deepEqual(jurnalEvenimente(multe, 0), []);
  assert.deepEqual(jurnalEvenimente(multe, -5), []);
});

test("jurnalEvenimente pe comenzile din db.json (fără istoric) și pe intrări invalide e gol", () => {
  assert.deepEqual(jurnalEvenimente(db.comenzi), []);
  assert.deepEqual(jurnalEvenimente(null), []);
  assert.deepEqual(jurnalEvenimente([null, 5, { istoric: "x" }]), []);
});

test("jurnalEvenimente include pașii livrării care schimbă starea (preluată = în livrare)", () => {
  let c = comandaPrin([["acceptata", 1], ["in_preparare", 2], ["gata", 3]], { id: 1 });
  c = { ...c, ...aplicaPasLivrare(c, "asignata", new Date(la(4)), { livratorId: 1 }) };
  c = { ...c, ...aplicaPasLivrare(c, "spre_restaurant", new Date(la(5))) };
  c = { ...c, ...aplicaPasLivrare(c, "preluata", new Date(la(6))) };
  assert.equal(jurnalEvenimente([c])[0].stare, "in_livrare");
});

// --- formatProcent / formatMinute ---

test("formatProcent: procent întreg sau liniuță fără date", () => {
  assert.equal(formatProcent(0), "0%");
  assert.equal(formatProcent(1), "100%");
  assert.equal(formatProcent(2 / 3), "67%");
  for (const v of [null, undefined, NaN, "0.5"]) assert.equal(formatProcent(v), "—");
});

test("formatMinute: virgulă românească, o zecimală, sau liniuță fără date", () => {
  assert.equal(formatMinute(12.5), "12,5 min");
  assert.equal(formatMinute(3), "3 min");
  assert.equal(formatMinute(3.66), "3,7 min");
  for (const v of [null, undefined, NaN, "3"]) assert.equal(formatMinute(v), "—");
});
