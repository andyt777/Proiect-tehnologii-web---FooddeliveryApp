// Teste pentru cupoanele de reducere (src/cupoane.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COD_MAX, CUPOANE, calculeazaReducere, campuriCupon, dePlata, gasesteCupon, imparteReducere, normalizeazaCod, numarComenziAnterioare, reducereComanda, valideazaCupon,
} from "../src/cupoane.js";

const db = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
const SAVORO10 = CUPOANE.find((c) => c.cod === "SAVORO10");
const PRIMA20 = CUPOANE.find((c) => c.cod === "PRIMA20");

// O comandă plasată din coș (are contact), ca în pachetul A
function comandaDinCos(extra = {}) {
  return { id: 1, preparat: "Pizza Diavola", livrata: false, livrare: "standard", pret: 48, contact: { nume: "Test", telefon: "0700000000" }, stare: "plasata", ...extra };
}

// --- regulile fixe ---

test("CUPOANE conține SAVORO10 (10%, minim 100) și PRIMA20 (20 lei, minim 60, prima comandă)", () => {
  assert.deepEqual({ tip: SAVORO10.tip, valoare: SAVORO10.valoare, minim: SAVORO10.minim, primaComanda: SAVORO10.primaComanda }, { tip: "procent", valoare: 10, minim: 100, primaComanda: false });
  assert.deepEqual({ tip: PRIMA20.tip, valoare: PRIMA20.valoare, minim: PRIMA20.minim, primaComanda: PRIMA20.primaComanda }, { tip: "fix", valoare: 20, minim: 60, primaComanda: true });
});

test("CUPOANE și fiecare cupon sunt înghețate", () => {
  assert.ok(Object.isFrozen(CUPOANE));
  for (const c of CUPOANE) assert.ok(Object.isFrozen(c), c.cod);
});

test("toate codurile demo respectă COD_MAX și sunt deja în forma normalizată", () => {
  for (const c of CUPOANE) {
    assert.ok(c.cod.length <= COD_MAX, c.cod);
    assert.equal(normalizeazaCod(c.cod), c.cod);
  }
});

// --- normalizeazaCod / gasesteCupon ---

test("normalizeazaCod scoate toate spațiile și face literele mari", () => {
  assert.equal(normalizeazaCod(" savoro10 "), "SAVORO10");
  assert.equal(normalizeazaCod("sa vo\tro\n10"), "SAVORO10");
  assert.equal(normalizeazaCod("Prima20"), "PRIMA20");
});

test("normalizeazaCod întoarce text gol pentru valori care nu sunt text", () => {
  for (const v of [null, undefined, 10, {}, ["SAVORO10"]]) assert.equal(normalizeazaCod(v), "");
});

test("gasesteCupon găsește codul scris oricum și întoarce null pentru coduri necunoscute", () => {
  assert.equal(gasesteCupon("  savoro10"), SAVORO10);
  assert.equal(gasesteCupon("prima 20"), PRIMA20);
  assert.equal(gasesteCupon("SAVORO1"), null);
  assert.equal(gasesteCupon(""), null);
  assert.equal(gasesteCupon(null), null);
});

// --- calculeazaReducere ---

test("calculeazaReducere: procentul se rotunjește în jos la lei întregi", () => {
  assert.equal(calculeazaReducere(SAVORO10, 100), 10);
  assert.equal(calculeazaReducere(SAVORO10, 109), 10);
  assert.equal(calculeazaReducere(SAVORO10, 110), 11);
});

test("calculeazaReducere: suma fixă nu depășește niciodată subtotalul", () => {
  assert.equal(calculeazaReducere(PRIMA20, 60), 20);
  assert.equal(calculeazaReducere(PRIMA20, 20), 20);
  assert.equal(calculeazaReducere(PRIMA20, 15), 15);
  assert.equal(calculeazaReducere({ tip: "procent", valoare: 150 }, 40), 40);
});

test("calculeazaReducere întoarce 0 fără cupon sau pentru subtotaluri invalide", () => {
  assert.equal(calculeazaReducere(null, 100), 0);
  for (const s of [0, -10, NaN, Infinity, undefined, "100"]) assert.equal(calculeazaReducere(SAVORO10, s), 0, String(s));
});

// --- valideazaCupon ---

test("valideazaCupon: câmp gol sau doar spații cere codul", () => {
  assert.deepEqual(valideazaCupon("", { subtotal: 200 }), { ok: false, mesaj: "Scrie codul cuponului." });
  assert.deepEqual(valideazaCupon("   ", { subtotal: 200 }), { ok: false, mesaj: "Scrie codul cuponului." });
  assert.deepEqual(valideazaCupon(null, { subtotal: 200 }), { ok: false, mesaj: "Scrie codul cuponului." });
});

test("valideazaCupon: cod necunoscut", () => {
  const r = valideazaCupon("REDUCERE50", { subtotal: 200 });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /nu există/);
});

test("valideazaCupon: un text mai lung decât COD_MAX nu e acceptat ca cod", () => {
  const lung = "SAVORO10" + "X".repeat(COD_MAX);
  assert.ok(normalizeazaCod(lung).length > COD_MAX);
  const r = valideazaCupon(lung, { subtotal: 500 });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /nu există/);
});

test("valideazaCupon: spațiile nu contează la lungime (codul curățat are sub COD_MAX)", () => {
  const r = valideazaCupon(" s a v o r o 1 0 ".repeat(1), { subtotal: 100 });
  assert.equal(r.ok, true);
});

test("valideazaCupon SAVORO10: exact la minim (100) e valabil, 10 lei reducere", () => {
  assert.deepEqual(valideazaCupon("savoro10", { subtotal: 100 }), { ok: true, cupon: SAVORO10, reducere: 10 });
});

test("valideazaCupon SAVORO10: sub minim (99) spune cât mai trebuie adăugat", () => {
  const r = valideazaCupon("SAVORO10", { subtotal: 99 });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /^Codul SAVORO10 e valabil de la 100 lei\. Mai adaugă produse de 1 /);
});

test("valideazaCupon: lipsa de 1 leu se scrie la singular", () => {
  const r = valideazaCupon("SAVORO10", { subtotal: 99 });
  assert.equal(r.mesaj, "Codul SAVORO10 e valabil de la 100 lei. Mai adaugă produse de 1 leu.");
});

test("valideazaCupon: subtotal invalid e tratat ca prea mic, cu tot minimul lipsă", () => {
  const r = valideazaCupon("SAVORO10", { subtotal: NaN });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /Mai adaugă produse de 100 lei/);
});

test("valideazaCupon PRIMA20: prima comandă, exact la minim (60), 20 lei reducere", () => {
  assert.deepEqual(valideazaCupon("PRIMA20", { subtotal: 60, comenziAnterioare: 0 }), { ok: true, cupon: PRIMA20, reducere: 20 });
  assert.deepEqual(valideazaCupon("PRIMA20", { subtotal: 60 }), { ok: true, cupon: PRIMA20, reducere: 20 });
});

test("valideazaCupon PRIMA20: sub minim (59) e refuzat", () => {
  const r = valideazaCupon("PRIMA20", { subtotal: 59, comenziAnterioare: 0 });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /valabil de la 60 lei/);
});

test("valideazaCupon PRIMA20: refuzat când clientul are deja comenzi din coș", () => {
  const r = valideazaCupon("PRIMA20", { subtotal: 200, comenziAnterioare: 1 });
  assert.equal(r.ok, false);
  assert.match(r.mesaj, /doar pentru prima comandă/);
});

test("valideazaCupon SAVORO10 nu ține cont de istoric", () => {
  assert.equal(valideazaCupon("SAVORO10", { subtotal: 150, comenziAnterioare: 5 }).ok, true);
});

test("valideazaCupon: reducerea nu depășește subtotalul", () => {
  const r = valideazaCupon("SAVORO10", { subtotal: 1000 });
  assert.equal(r.reducere, 100);
  assert.ok(r.reducere <= 1000);
});

// --- numarComenziAnterioare (istoricul local pentru PRIMA20) ---

test("numarComenziAnterioare: comenzile de exemplu din db.json (fără contact) nu contează", () => {
  assert.equal(numarComenziAnterioare(db.comenzi), 0);
});

test("numarComenziAnterioare numără doar comenzile din coș care nu sunt anulate sau respinse", () => {
  const comenzi = [
    comandaDinCos({ id: 1 }),
    comandaDinCos({ id: 2, stare: "livrata", livrata: true }),
    comandaDinCos({ id: 3, stare: "anulata" }),
    comandaDinCos({ id: 4, stare: "respinsa" }),
    { id: 5, preparat: "Comandă specială", pret: null, speciala: true },
    comandaDinCos({ id: 6, contact: { nume: "Fără telefon" } }),
  ];
  assert.equal(numarComenziAnterioare(comenzi), 2);
});

test("numarComenziAnterioare întoarce 0 pentru un răspuns care nu e listă", () => {
  for (const v of [null, undefined, {}, "[]", 3]) assert.equal(numarComenziAnterioare(v), 0);
});

test("numarComenziAnterioare nu se oprește la intrări null în listă", () => {
  assert.equal(numarComenziAnterioare([null, comandaDinCos(), 7]), 1);
});

// --- imparteReducere ---

test("imparteReducere împarte proporțional și dă leii rămași liniilor cu cele mai mari zecimale", () => {
  assert.deepEqual(imparteReducere(20, [10, 20, 30]), [3, 7, 10]);
});

test("imparteReducere pe o singură linie dă toată reducerea acelei linii", () => {
  assert.deepEqual(imparteReducere(15, [120]), [15]);
});

test("imparteReducere la egalitate de zecimale dă leul primei linii", () => {
  assert.deepEqual(imparteReducere(1, [10, 10]), [1, 0]);
  assert.deepEqual(imparteReducere(2, [10, 10, 10]), [1, 1, 0]);
});

test("imparteReducere: suma părților e exact reducerea, iar nicio parte nu depășește prețul liniei", () => {
  const cazuri = [
    [10, [33, 33, 34]],
    [17, [1, 1, 1, 97]],
    [20, [60]],
    [7, [3, 5, 11, 13, 17]],
    [99, [100, 1]],
    [1, [1, 1, 1, 1, 1, 1, 1]],
    [100, [999, 1, 1]],
    [23, [7, 7, 7, 7, 7, 7, 7, 7, 7]],
  ];
  for (const [reducere, preturi] of cazuri) {
    const parti = imparteReducere(reducere, preturi);
    assert.equal(parti.length, preturi.length);
    assert.equal(parti.reduce((s, x) => s + x, 0), reducere, `${reducere} pe ${preturi}`);
    parti.forEach((p, i) => {
      assert.ok(Number.isInteger(p) && p >= 0 && p <= preturi[i], `${reducere} pe ${preturi}: partea ${i} = ${p}`);
    });
  }
});

test("imparteReducere: proprietatea sumei pe multe coșuri generate determinist", () => {
  for (let n = 1; n <= 6; n += 1) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const preturi = Array.from({ length: n }, (_, i) => ((seed * 37 + i * 53) % 150) + 1);
      const total = preturi.reduce((s, p) => s + p, 0);
      const reducere = (seed * 11) % (total + 1);
      const parti = imparteReducere(reducere, preturi);
      assert.equal(parti.reduce((s, x) => s + x, 0), reducere, `${reducere} pe ${preturi}`);
      parti.forEach((p, i) => assert.ok(p >= 0 && p <= preturi[i]));
    }
  }
});

test("imparteReducere plafonează reducerea la totalul coșului", () => {
  const parti = imparteReducere(500, [10, 20]);
  assert.deepEqual(parti, [10, 20]);
});

test("imparteReducere rotunjește în jos o reducere cu zecimale", () => {
  assert.equal(imparteReducere(10.9, [50, 50]).reduce((s, x) => s + x, 0), 10);
});

test("imparteReducere: fără reducere sau cu reducere invalidă dă zero peste tot", () => {
  for (const r of [0, -5, NaN, Infinity, undefined, "10"]) assert.deepEqual(imparteReducere(r, [10, 20]), [0, 0], String(r));
});

test("imparteReducere: prețurile invalide contează ca 0 și nu primesc nimic", () => {
  const parti = imparteReducere(10, [null, 50, -3, NaN, "20", 50]);
  assert.deepEqual(parti, [0, 5, 0, 0, 0, 5]);
});

test("imparteReducere întoarce [] pentru o listă lipsă și zerouri pentru un coș de 0 lei", () => {
  assert.deepEqual(imparteReducere(10, null), []);
  assert.deepEqual(imparteReducere(10, []), []);
  assert.deepEqual(imparteReducere(10, [0, 0]), [0, 0]);
});

test("imparteReducere: nicio parte nu depășește prețul liniei nici la prețuri cu zecimale", () => {
  const preturi = [0.5, 0.5];
  const parti = imparteReducere(1, preturi);
  parti.forEach((p, i) => assert.ok(p <= preturi[i], `partea ${i} = ${p}`));
});

test("imparteReducere nu modifică lista primită", () => {
  const preturi = Object.freeze([10, 20, 30]);
  assert.doesNotThrow(() => imparteReducere(20, preturi));
});

// --- campuriCupon / reducereComanda / dePlata ---

test("campuriCupon pune cupon și reducere doar pentru o parte întreagă pozitivă", () => {
  assert.deepEqual(campuriCupon("SAVORO10", 5), { cupon: "SAVORO10", reducere: 5 });
  for (const p of [0, -1, 1.5, NaN, null, "5"]) assert.deepEqual(campuriCupon("SAVORO10", p), {}, String(p));
});

test("reducereComanda citește doar numerele finite pozitive", () => {
  assert.equal(reducereComanda({ reducere: 10 }), 10);
  for (const r of [0, -5, NaN, Infinity, "10", null, undefined]) assert.equal(reducereComanda({ reducere: r }), 0, String(r));
  assert.equal(reducereComanda(null), 0);
  assert.equal(reducereComanda(undefined), 0);
});

test("dePlata = pret − reducere", () => {
  assert.equal(dePlata({ pret: 48, reducere: 10 }), 38);
  assert.equal(dePlata({ pret: 48 }), 48);
});

test("dePlata nu scade niciodată sub 0", () => {
  assert.equal(dePlata({ pret: 10, reducere: 25 }), 0);
});

test("dePlata e 0 pentru o comandă fără preț (comandă specială neconfirmată) sau lipsă", () => {
  assert.equal(dePlata({ pret: null, reducere: 5 }), 0);
  assert.equal(dePlata({ pret: "48" }), 0);
  assert.equal(dePlata(null), 0);
});

test("fluxul pe coș: reducerea validată, împărțită pe linii, dă exact suma de plată așteptată", () => {
  const preturi = [42, 96, 65];
  const subtotal = preturi.reduce((s, p) => s + p, 0);
  const v = valideazaCupon("savoro10", { subtotal });
  assert.equal(v.ok, true);
  const parti = imparteReducere(v.reducere, preturi);
  const comenzi = preturi.map((pret, i) => ({ pret, ...campuriCupon(v.cupon.cod, parti[i]) }));
  const platit = comenzi.reduce((s, c) => s + dePlata(c), 0);
  assert.equal(platit, subtotal - v.reducere);
});
