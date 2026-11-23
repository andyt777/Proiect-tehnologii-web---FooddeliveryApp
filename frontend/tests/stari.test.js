// Teste pentru stările comenzii (src/stari.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  STARI_COMANDA, aplicaPasLivrare, aplicaTranzitie, campuriInitiale, comutaLivrata, cronologie, esteActiva, etichetaStare,
  normalizeazaComanda, plataComanda, poateAvansaLivrarea, poateTrece, stareComanda, tranzitiiPosibile, valideazaAcceptare, valideazaMotiv,
} from "../src/stari.js";

const db = JSON.parse(readFileSync(new URL("../../backend/src/data/seed.json", import.meta.url), "utf8"));
const ACUM = new Date("2026-11-22T18:00:00.000Z");
const MAI_TARZIU = new Date("2026-11-22T18:10:00.000Z");

// O comandă nouă, cu livrare standard, plasată la ACUM
function comandaNoua(extra = {}) {
  return { id: 10, preparat: "Pizza Diavola", livrata: false, livrare: "standard", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 48, ...campuriInitiale({ livrare: "standard", metodaPlata: "numerar" }, ACUM), ...extra };
}

// Aplică patch-ul pe comandă, ca json-server la PATCH
function cuPatch(comanda, patch) {
  return { ...comanda, ...patch };
}

// --- valori implicite pentru comenzile vechi ---

test("comenzile din db.json (fără câmpurile noi) primesc valorile implicite din spec", () => {
  for (const c of db.comenzi) {
    const n = normalizeazaComanda(c);
    assert.equal(n.stare, c.livrata ? "livrata" : "plasata", `stare la ${c.id}`);
    assert.deepEqual(n.plata, { metoda: "numerar", stare: c.livrata ? "platita" : "neplatita" }, `plata la ${c.id}`);
    assert.equal(n.livrareStare, c.livrare === "ridicare" ? null : c.livrata ? "livrata" : "neasignata", `livrareStare la ${c.id}`);
    assert.deepEqual(n.istoric, []);
    assert.equal(n.livratorId, null);
    assert.equal(n.adresa, null);
    assert.equal(n.contact, null);
    assert.equal(n.reducere, 0);
    assert.equal(n.preparat, c.preparat, "câmpurile vechi rămân");
  }
});

test("normalizeazaComanda aruncă valorile greșite și nu se oprește la un răspuns ciudat", () => {
  const n = normalizeazaComanda({ id: 1, livrata: false, stare: "zburata", plata: { metoda: "bitcoin", stare: "platita" }, istoric: [{ stare: "plasata", la: "nu e dată" }, null, { stare: "acceptata", la: "2026-11-22T18:00:00.000Z", extra: 1 }], timpPreparare: -5, livratorId: "", contact: { nume: 3 } });
  assert.equal(n.stare, "plasata");
  assert.deepEqual(n.plata, { metoda: "numerar", stare: "neplatita" });
  assert.deepEqual(n.istoric, [{ stare: "acceptata", la: "2026-11-22T18:00:00.000Z" }]);
  assert.equal(n.timpPreparare, null);
  assert.equal(n.livratorId, null);
  assert.equal(n.contact, null);
  assert.equal(normalizeazaComanda(null).stare, "plasata");
});

test("livrata are ultimul cuvânt: livrata true -> „livrata”; stare „livrata” cu livrata false -> starea de dinainte", () => {
  assert.equal(stareComanda({ livrata: true, stare: "acceptata" }), "livrata");
  assert.equal(stareComanda({ livrata: false, stare: "livrata", istoric: [{ stare: "gata", la: ACUM.toISOString() }, { stare: "livrata", la: MAI_TARZIU.toISOString() }] }), "gata");
  assert.equal(stareComanda({ livrata: false, stare: "livrata" }), "plasata");
});

// --- tabelul tranzițiilor ---

test("drumul complet al unei livrări: fiecare pas e permis doar rolului potrivit", () => {
  let c = comandaNoua();
  assert.ok(poateTrece(c, "acceptata", "restaurant"));
  assert.ok(!poateTrece(c, "acceptata", "client"));
  assert.ok(!poateTrece(c, "acceptata", "livrator"));
  c = cuPatch(c, aplicaTranzitie(c, "acceptata", ACUM, { timpPreparare: 20 }));
  assert.equal(c.timpPreparare, 20);
  assert.ok(poateTrece(c, "in_preparare", "restaurant"));
  c = cuPatch(c, aplicaTranzitie(c, "in_preparare", ACUM));
  c = cuPatch(c, aplicaTranzitie(c, "gata", ACUM));
  assert.ok(poateTrece(c, "in_livrare", "livrator"));
  assert.ok(!poateTrece(c, "livrata", "restaurant"), "o livrare nu se predă direct de restaurant");
  c = cuPatch(c, aplicaTranzitie(c, "in_livrare", ACUM));
  assert.equal(c.livrareStare, "preluata");
  c = cuPatch(c, aplicaTranzitie(c, "livrata", MAI_TARZIU));
  assert.equal(c.stare, "livrata");
  assert.equal(c.livrata, true);
  assert.equal(c.livrareStare, "livrata");
  assert.deepEqual(c.plata, { metoda: "numerar", stare: "platita" }, "numerarul se încasează la predare");
  assert.deepEqual(c.istoric.map((e) => e.stare), ["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata"]);
  assert.equal(c.istoric.at(-1).la, MAI_TARZIU.toISOString());
  assert.deepEqual(tranzitiiPosibile(c, "admin"), [], "din livrata nu mai pleacă nimic");
});

test("ridicarea sare peste in_livrare: gata -> livrata de restaurant, fără livrareStare", () => {
  let c = { id: 3, livrata: false, livrare: "ridicare", pret: 65, ...campuriInitiale({ livrare: "ridicare", metodaPlata: "card_simulat" }, ACUM) };
  assert.equal(Object.hasOwn(c, "livrareStare"), false);
  for (const s of ["acceptata", "in_preparare", "gata"]) c = cuPatch(c, aplicaTranzitie(c, s, ACUM));
  assert.ok(!poateTrece(c, "in_livrare", "livrator"));
  assert.ok(!poateTrece(c, "in_livrare", "admin"));
  assert.ok(poateTrece(c, "livrata", "restaurant"));
  assert.equal(etichetaStare(c), "Gata de ridicare");
  const patch = aplicaTranzitie(c, "livrata", ACUM);
  assert.equal(patch.livrata, true);
  assert.equal(Object.hasOwn(patch, "livrareStare"), false);
  assert.throws(() => aplicaTranzitie(c, "in_livrare", ACUM));
});

test("tranziții interzise: sărituri, întoarceri și stări finale", () => {
  const c = comandaNoua();
  for (const rol of ["client", "restaurant", "livrator", "admin"]) {
    assert.ok(!poateTrece(c, "gata", rol), `plasata -> gata (${rol})`);
    assert.ok(!poateTrece(c, "livrata", rol), `plasata -> livrata (${rol})`);
    assert.ok(!poateTrece(c, "plasata", rol), `plasata -> plasata (${rol})`);
  }
  assert.ok(!poateTrece(c, "acceptata", "hacker"), "rol necunoscut");
  assert.ok(!poateTrece(c, "necunoscuta", "admin"), "stare necunoscută");
  assert.throws(() => aplicaTranzitie(c, "gata", ACUM), /nu poate trece/);
  for (const finala of ["anulata", "respinsa"]) {
    const oprita = { ...c, stare: finala };
    for (const s of STARI_COMANDA) assert.ok(!poateTrece(oprita, s, "admin"), `${finala} -> ${s}`);
  }
});

test("clientul anulează doar înainte de preparare; restaurantul respinge doar din plasata", () => {
  const c = comandaNoua();
  assert.ok(poateTrece(c, "anulata", "client"));
  assert.ok(poateTrece(c, "respinsa", "restaurant"));
  assert.ok(!poateTrece(c, "respinsa", "client"));
  const acceptata = cuPatch(c, aplicaTranzitie(c, "acceptata", ACUM));
  assert.ok(poateTrece(acceptata, "anulata", "client"));
  assert.ok(!poateTrece(acceptata, "respinsa", "restaurant"));
  const inPreparare = cuPatch(acceptata, aplicaTranzitie(acceptata, "in_preparare", ACUM));
  assert.ok(!poateTrece(inPreparare, "anulata", "client"));
  assert.ok(poateTrece(inPreparare, "anulata", "admin"));
});

test("anularea unei comenzi plătite cu card simulat o rambursează și păstrează motivul", () => {
  const c = comandaNoua(campuriInitiale({ livrare: "standard", metodaPlata: "card_simulat" }, ACUM));
  assert.deepEqual(c.plata, { metoda: "card_simulat", stare: "platita" });
  const patch = aplicaTranzitie(c, "anulata", ACUM, { motiv: "  M-am răzgândit  " });
  assert.deepEqual(patch.plata, { metoda: "card_simulat", stare: "rambursata" });
  assert.equal(patch.motiv, "M-am răzgândit");
  assert.equal(patch.livrata, false);
  const numerar = aplicaTranzitie(comandaNoua(), "respinsa", ACUM, { motiv: "" });
  assert.deepEqual(numerar.plata, { metoda: "numerar", stare: "neplatita" }, "o plată neîncasată nu se rambursează");
  assert.equal(Object.hasOwn(numerar, "motiv"), false, "motivul gol nu se salvează");
});

test("acceptarea pune prețul doar la o comandă fără preț și doar un preț valid", () => {
  const speciala = comandaNoua({ pret: null, speciala: true });
  assert.equal(aplicaTranzitie(speciala, "acceptata", ACUM, { timpPreparare: 30, pret: 55 }).pret, 55);
  assert.equal(Object.hasOwn(aplicaTranzitie(speciala, "acceptata", ACUM, { pret: 0 }), "pret"), false);
  assert.equal(Object.hasOwn(aplicaTranzitie(comandaNoua(), "acceptata", ACUM, { pret: 1 }), "pret"), false, "prețul din meniu nu se schimbă");
  assert.equal(Object.hasOwn(aplicaTranzitie(comandaNoua(), "acceptata", ACUM, { timpPreparare: 999 }), "timpPreparare"), false);
  assert.equal(valideazaAcceptare({ timpPreparare: 20 }, speciala), "Pune un preț întreg între 1 și 10000 lei.");
  assert.equal(valideazaAcceptare({ timpPreparare: 20, pret: 55 }, speciala), null);
  assert.match(valideazaAcceptare({ timpPreparare: 2 }, comandaNoua()), /Timpul de preparare/);
});

test("aplicaTranzitie nu modifică comanda primită", () => {
  const c = comandaNoua();
  const copie = structuredClone(c);
  aplicaTranzitie(c, "acceptata", ACUM);
  assert.deepEqual(c, copie);
});

// --- bifa „Livrată” de pe „/” ---

test("comutaLivrata pe o comandă veche: livrata și starea se schimbă împreună, în ambele sensuri", () => {
  const veche = db.comenzi.find((c) => c.livrata === false && c.livrare !== "ridicare");
  const bifata = cuPatch(veche, comutaLivrata(veche, ACUM));
  assert.equal(bifata.livrata, true);
  assert.equal(bifata.stare, "livrata");
  assert.equal(bifata.livrareStare, "livrata");
  assert.deepEqual(bifata.plata, { metoda: "numerar", stare: "platita" });
  const debifata = cuPatch(bifata, comutaLivrata(bifata, MAI_TARZIU));
  assert.equal(debifata.livrata, false);
  assert.equal(debifata.stare, "plasata");
  assert.deepEqual(debifata.plata, { metoda: "numerar", stare: "neplatita" });
  assert.deepEqual(debifata.istoric.map((e) => e.stare), ["livrata", "plasata"]);
});

test("comutaLivrata debifat întoarce starea de dinainte din istoric și păstrează plata cu card", () => {
  let c = comandaNoua(campuriInitiale({ livrare: "standard", metodaPlata: "card_simulat" }, ACUM));
  for (const s of ["acceptata", "in_preparare", "gata", "in_livrare"]) c = cuPatch(c, aplicaTranzitie(c, s, ACUM));
  c = cuPatch(c, comutaLivrata(c, ACUM));
  assert.equal(c.stare, "livrata");
  c = cuPatch(c, comutaLivrata(c, MAI_TARZIU));
  assert.equal(c.stare, "in_livrare");
  assert.equal(c.livrata, false);
  assert.equal(c.livrareStare, "spre_client");
  assert.deepEqual(c.plata, { metoda: "card_simulat", stare: "platita" });
});

test("comutaLivrata pe o comandă din db.json deja livrată o întoarce la plasata", () => {
  const livrata = db.comenzi.find((c) => c.livrata === true);
  const patch = comutaLivrata(livrata, ACUM);
  assert.equal(patch.livrata, false);
  assert.equal(patch.stare, "plasata");
});

// --- pașii livrării ---

test("livrarea: asignare după acceptare, preluare doar când e gata, predare doar în livrare", () => {
  let c = comandaNoua();
  assert.ok(!poateAvansaLivrarea(c, "asignata"), "nu înainte de acceptare");
  c = cuPatch(c, aplicaTranzitie(c, "acceptata", ACUM));
  c = cuPatch(c, aplicaTranzitie(c, "in_preparare", ACUM));
  assert.throws(() => aplicaPasLivrare(c, "asignata", ACUM), /livrator/);
  c = cuPatch(c, aplicaPasLivrare(c, "asignata", ACUM, { livratorId: 2 }));
  assert.equal(c.livratorId, 2);
  c = cuPatch(c, aplicaPasLivrare(c, "spre_restaurant", ACUM));
  assert.ok(!poateAvansaLivrarea(c, "preluata"), "nu se ridică o comandă în preparare");
  c = cuPatch(c, aplicaTranzitie(c, "gata", ACUM));
  c = cuPatch(c, aplicaPasLivrare(c, "preluata", ACUM));
  assert.equal(c.stare, "in_livrare");
  assert.equal(c.livrareStare, "preluata");
  c = cuPatch(c, aplicaPasLivrare(c, "spre_client", ACUM));
  c = cuPatch(c, aplicaPasLivrare(c, "livrata", MAI_TARZIU));
  assert.equal(c.stare, "livrata");
  assert.equal(c.livrata, true);
  assert.equal(c.livrareStare, "livrata");
  assert.ok(!poateAvansaLivrarea({ ...comandaNoua(), livrare: "ridicare" }, "asignata"), "ridicarea nu are livrare");
});

// --- afișare ---

test("cronologie: pașii cu ora din istoric, pasul curent și cei următori", () => {
  let c = comandaNoua({ creata: ACUM.toISOString() });
  c = cuPatch(c, aplicaTranzitie(c, "acceptata", MAI_TARZIU));
  const pasi = cronologie(c);
  assert.deepEqual(pasi.map((p) => p.id), ["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata"]);
  assert.deepEqual(pasi.map((p) => p.stare), ["gata", "acum", "urmeaza", "urmeaza", "urmeaza", "urmeaza"]);
  assert.equal(pasi[1].la, MAI_TARZIU.toISOString());
  assert.equal(pasi[2].la, null);
  assert.equal(pasi.filter((p) => p.curenta).length, 1);
});

test("cronologie pe comenzile vechi: fără ore, livrata = toate încheiate; ridicarea are 5 pași", () => {
  const livrata = cronologie({ livrata: true, livrare: "standard" });
  assert.ok(livrata.every((p) => p.stare === "gata" && p.la === null));
  assert.equal(livrata.at(-1).curenta, true);
  const ridicare = cronologie({ livrata: false, livrare: "ridicare", creata: ACUM.toISOString() });
  assert.deepEqual(ridicare.map((p) => p.id), ["plasata", "acceptata", "in_preparare", "gata", "livrata"]);
  assert.equal(ridicare[0].la, ACUM.toISOString(), "plasata ia ora din `creata`");
  assert.equal(ridicare.at(-1).text, "Ridicată");
});

test("cronologie pe o comandă anulată: pașii parcurși, apoi „Anulată” ca pas oprit", () => {
  let c = comandaNoua();
  c = cuPatch(c, aplicaTranzitie(c, "acceptata", ACUM));
  c = cuPatch(c, aplicaTranzitie(c, "anulata", MAI_TARZIU, { motiv: "Durează prea mult" }));
  const pasi = cronologie(c);
  assert.deepEqual(pasi.map((p) => [p.id, p.stare]), [["plasata", "gata"], ["acceptata", "gata"], ["anulata", "oprit"]]);
  assert.equal(pasi.at(-1).la, MAI_TARZIU.toISOString());
  assert.equal(esteActiva(c), false);
});

test("plataComanda, valideazaMotiv", () => {
  assert.deepEqual(plataComanda({ livrata: true }), { metoda: "numerar", stare: "platita" });
  assert.equal(valideazaMotiv("   "), "Spune pe scurt motivul.");
  assert.match(valideazaMotiv("x".repeat(201)), /maximum 200/);
  assert.equal(valideazaMotiv("Am greșit adresa"), null);
});

test("campuriInitiale: card simulat plătit la plasare, numerar neplătit; metodă necunoscută aruncă", () => {
  const card = campuriInitiale({ livrare: "express", metodaPlata: "card_simulat" }, ACUM);
  assert.deepEqual(card, { stare: "plasata", plata: { metoda: "card_simulat", stare: "platita" }, livratorId: null, timpPreparare: null, istoric: [{ stare: "plasata", la: ACUM.toISOString() }], livrareStare: "neasignata" });
  assert.equal(campuriInitiale({ livrare: "standard", metodaPlata: "numerar" }, ACUM).plata.stare, "neplatita");
  assert.throws(() => campuriInitiale({ livrare: "standard", metodaPlata: "card_real" }, ACUM));
});
