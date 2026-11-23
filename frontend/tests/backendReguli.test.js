// Plan §5: serverul (backend/src/reguli/) repetă regulile din stari.js și program.js. Cele două pachete nu importă
// unul din altul la rulare, deci testul acesta verifică pe toate combinațiile că cele două copii dau același rezultat,
// apoi pornește serverul și trimite exact corpurile construite de interfață, pe drumul fiecărui rol.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fe from "../src/stari.js";
import * as feActiuni from "../src/actiuniComenzi.js";
import { CURSE_ACTIVE_MAX } from "../src/livrator.js";
import { esteDeschis as esteDeschisFe } from "../src/program.js";
import * as be from "../../backend/src/reguli/stari.js";
import * as beLivrare from "../../backend/src/reguli/livrare.js";
import { esteDeschis as esteDeschisBe } from "../../backend/src/reguli/restaurant.js";
import { createApp } from "../../backend/src/app.js";

const ACUM = new Date("2026-11-23T10:00:00.000Z");
const LA = "2026-11-23T09:00:00.000Z";

// Toate formele de comandă care contează pentru reguli
function* comenzi() {
  for (const stare of fe.STARI_COMANDA) {
    for (const livrare of ["standard", "ridicare"]) {
      for (const metoda of fe.METODE_PLATA) {
        for (const stareP of fe.STARI_PLATA) {
          for (const livrareStare of livrare === "ridicare" ? [null] : fe.PASI_LIVRARE) {
            for (const livratorId of [null, 1]) {
              for (const pret of [42, null]) {
                const istoric = [{ stare: "plasata", la: LA }, ...(stare === "plasata" ? [] : [{ stare: "acceptata", la: LA }, { stare, la: LA }])];
                yield { id: 1, preparat: "X", restaurant: "Pizzeria Napoli", livrare, pret, livrata: stare === "livrata", stare, plata: { metoda, stare: stareP }, livrareStare, livratorId, istoric };
              }
            }
          }
        }
      }
    }
  }
  yield { id: 2, preparat: "Veche", livrata: true, livrare: "standard", pret: 40 };
  yield { id: 3, preparat: "Veche", livrata: false, livrare: "ridicare", pret: 40 };
  yield { id: 4, preparat: "Debifată", livrata: false, stare: "livrata", livrare: "standard", istoric: [{ stare: "in_livrare", la: LA }, { stare: "livrata", la: LA }] };
}

// Același rezultat sau aceeași eroare (mesajul diferă: backend-ul aruncă 409)
function rezultat(fn) {
  try {
    return { ok: fn() };
  } catch {
    return { eroare: true };
  }
}

test("etichetele stărilor și ale pașilor livrării sunt aceleași în backend", () => {
  assert.deepEqual(be.ETICHETE_STARE, fe.ETICHETE_STARE);
  assert.deepEqual(beLivrare.ETICHETE_PAS_LIVRARE, fe.ETICHETE_PAS_LIVRARE);
  assert.deepEqual(be.STARI_FINALE, fe.STARI_FINALE);
  assert.deepEqual(be.ROLURI, fe.ROLURI);
  assert.equal(beLivrare.CURSE_ACTIVE_MAX, CURSE_ACTIVE_MAX);
});

test("tabelul tranzițiilor: poateTrece dă același răspuns pentru fiecare stare, rol și tip de livrare", () => {
  for (const c of comenzi()) {
    for (const spre of fe.STARI_COMANDA) {
      let oricare = false;
      for (const rol of fe.ROLURI) {
        const permis = fe.poateTrece(c, spre, rol);
        assert.equal(be.poateTrece(c, spre, rol), permis, `${c.stare} -> ${spre} (${rol}, ${c.livrare})`);
        oricare ||= permis;
      }
      assert.equal(be.poateTrece(c, spre), oricare, `${c.stare} -> ${spre} fără rol`);
    }
  }
});

test("efectele tranzițiilor (plata, livrata, livrareStare, istoric, motiv, timp, preț) sunt identice", () => {
  const detalii = [{}, { motiv: "  Motiv  ", timpPreparare: 20, pret: 55 }, { motiv: "", timpPreparare: 1, pret: -1 }];
  for (const c of comenzi()) {
    for (const spre of fe.STARI_COMANDA) {
      for (const d of detalii) assert.deepEqual(rezultat(() => be.aplicaTranzitie(c, spre, ACUM, d)), rezultat(() => fe.aplicaTranzitie(c, spre, ACUM, d)), `${c.stare} -> ${spre}`);
    }
    assert.deepEqual(be.comutaLivrata(c, ACUM), fe.comutaLivrata(c, ACUM), `bifa la ${c.stare}`);
    for (const fn of ["stareComanda", "pasLivrareComanda", "istoricComanda", "esteFinala"]) assert.deepEqual(be[fn](c), fe[fn](c), fn);
  }
});

test("pașii livrării: poateAvansaLivrarea și aplicaPasLivrare sunt identice", () => {
  for (const c of comenzi()) {
    for (const pas of fe.PASI_LIVRARE) {
      assert.equal(beLivrare.poateAvansaLivrarea(c, pas), fe.poateAvansaLivrarea(c, pas), `${c.stare}/${c.livrareStare} -> ${pas}`);
      for (const extra of [{}, { livratorId: 2 }]) {
        assert.deepEqual(rezultat(() => beLivrare.aplicaPasLivrare(c, pas, ACUM, extra)), rezultat(() => fe.aplicaPasLivrare(c, pas, ACUM, extra)), `${c.stare}/${c.livrareStare} -> ${pas}`);
      }
    }
  }
});

test("programul restaurantului: esteDeschis e identic pentru orice oră a săptămânii", () => {
  const zile = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"];
  const program = (interval, exceptii = {}) => ({ ...Object.fromEntries(zile.map((z) => [z, interval])), ...exceptii });
  const profiluri = [
    null,
    { pauzat: true, program: null },
    { pauzat: false, program: null },
    { pauzat: false, program: program({ deschide: "10:00", inchide: "22:00" }, { duminica: null }) },
    { pauzat: false, program: program({ deschide: "18:00", inchide: "02:00" }) },
    { pauzat: false, program: program(null, { vineri: { deschide: "23:30", inchide: "00:30" } }) },
    { pauzat: false, program: program({ deschide: "25:00", inchide: "10:00" }) },
  ];
  const start = new Date(2026, 10, 23, 0, 0).getTime();
  for (const profil of profiluri) {
    for (let m = 0; m < 7 * 24 * 60; m += 10) {
      const ms = start + m * 60000;
      assert.equal(esteDeschisBe(profil, ms), esteDeschisFe(profil, ms), `${JSON.stringify(profil)} la ${new Date(ms)}`);
    }
  }
});

// --- cap-coadă: serverul acceptă exact corpurile trimise de pagini ---

async function server(t) {
  const s = createApp().listen(0);
  await new Promise((resolve) => s.once("listening", resolve));
  t.after(() => new Promise((resolve) => s.close(resolve)));
  const baza = `http://localhost:${s.address().port}`;
  return async (metoda, cale, corp) => {
    const res = await fetch(`${baza}${cale}`, { method: metoda, headers: { "Content-Type": "application/json" }, body: corp === undefined ? undefined : JSON.stringify(corp) });
    const text = await res.text();
    return { status: res.status, body: text === "" ? null : JSON.parse(text) };
  };
}

async function plaseaza(cerere, livrare = "standard", metodaPlata = "numerar") {
  const corp = { preparat: "Pizza Margherita", restaurant: "Pizzeria Napoli", livrare, livrata: false, categorie: "Pizza", pret: 42, creata: new Date().toISOString(), ...fe.campuriInitiale({ livrare, metodaPlata }) };
  const r = await cerere("POST", "/comenzi", corp);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}

// Ca useComenziLive.aplica: citește comanda proaspătă, construiește corpul cu funcțiile interfeței, trimite PATCH
async function aplica(cerere, id, construieste) {
  const proaspata = (await cerere("GET", `/comenzi/${id}`)).body;
  const r = await cerere("PATCH", `/comenzi/${id}`, construieste(proaspata));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body;
}

test("drumul cu livrare, cu corpurile din actiuniComenzi.js (restaurant, livrator) și bifa de pe „/”", async (t) => {
  const cerere = await server(t);
  const c = await plaseaza(cerere);
  await aplica(cerere, c.id, (p) => feActiuni.patchTranzitie(p, "acceptata", "restaurant", new Date(), { timpPreparare: 20 }));
  await aplica(cerere, c.id, (p) => feActiuni.patchTranzitie(p, "in_preparare", "restaurant", new Date()));
  await aplica(cerere, c.id, (p) => feActiuni.patchPasLivrare(p, "asignata", new Date(), { livratorId: 1 }));
  await aplica(cerere, c.id, (p) => feActiuni.patchPasLivrare(p, "spre_restaurant", new Date()));
  await aplica(cerere, c.id, (p) => feActiuni.patchTranzitie(p, "gata", "restaurant", new Date()));
  await aplica(cerere, c.id, (p) => feActiuni.patchPasLivrare(p, "preluata", new Date()));
  await aplica(cerere, c.id, (p) => feActiuni.patchPasLivrare(p, "spre_client", new Date()));
  const livrata = await aplica(cerere, c.id, (p) => feActiuni.patchPasLivrare(p, "livrata", new Date()));
  assert.deepEqual(fe.istoricComanda(livrata).map((e) => e.stare), ["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata"]);
  assert.deepEqual(livrata.plata, { metoda: "numerar", stare: "platita" });
  const debifata = await aplica(cerere, c.id, (p) => fe.comutaLivrata(p, new Date()));
  assert.equal(fe.stareComanda(debifata), "in_livrare");
  assert.equal(debifata.livrareStare, "spre_client");
  const rebifata = await aplica(cerere, c.id, (p) => fe.comutaLivrata(p, new Date()));
  assert.equal(rebifata.livrata, true);
});

test("ridicarea, anularea clientului (card rambursat), respingerea și anularea adminului trec pe server", async (t) => {
  const cerere = await server(t);
  const r = await plaseaza(cerere, "ridicare", "card_simulat");
  await aplica(cerere, r.id, (p) => feActiuni.patchTranzitie(p, "acceptata", "restaurant", new Date(), { timpPreparare: 10 }));
  await aplica(cerere, r.id, (p) => feActiuni.patchTranzitie(p, "in_preparare", "restaurant", new Date()));
  await aplica(cerere, r.id, (p) => feActiuni.patchTranzitie(p, "gata", "restaurant", new Date()));
  assert.equal((await aplica(cerere, r.id, (p) => feActiuni.patchTranzitie(p, "livrata", "restaurant", new Date()))).livrareStare, null);

  const a = await plaseaza(cerere, "standard", "card_simulat");
  const anulata = await aplica(cerere, a.id, (p) => fe.aplicaTranzitie(p, "anulata", new Date(), { motiv: "M-am răzgândit" }));
  assert.deepEqual([anulata.stare, anulata.motiv, anulata.plata.stare], ["anulata", "M-am răzgândit", "rambursata"]);

  const s = await plaseaza(cerere);
  assert.equal((await aplica(cerere, s.id, (p) => feActiuni.patchTranzitie(p, "respinsa", "restaurant", new Date(), { motiv: "Închidem" }))).stare, "respinsa");

  const adm = await plaseaza(cerere);
  await aplica(cerere, adm.id, (p) => feActiuni.patchTranzitie(p, "acceptata", "restaurant", new Date(), { timpPreparare: 15 }));
  await aplica(cerere, adm.id, (p) => feActiuni.patchPasLivrare(p, "asignata", new Date(), { livratorId: 2 }));
  assert.equal((await aplica(cerere, adm.id, (p) => feActiuni.patchPasLivrare(p, "neasignata", new Date()))).livratorId, null);
  await aplica(cerere, adm.id, (p) => feActiuni.patchTranzitie(p, "in_preparare", "restaurant", new Date()));
  assert.equal((await aplica(cerere, adm.id, (p) => feActiuni.patchTranzitie(p, "anulata", "admin", new Date(), { motiv: "Test admin" }))).stare, "anulata");
});

test("un corp construit dintr-o copie veche a comenzii e refuzat de server (409), nu aplicat greșit", async (t) => {
  const cerere = await server(t);
  const c = await plaseaza(cerere);
  const veche = (await cerere("GET", `/comenzi/${c.id}`)).body;
  await aplica(cerere, c.id, (p) => fe.aplicaTranzitie(p, "anulata", new Date(), { motiv: "M-am răzgândit" }));
  const r = await cerere("PATCH", `/comenzi/${c.id}`, fe.aplicaTranzitie(veche, "acceptata", new Date(), { timpPreparare: 20 }));
  assert.equal(r.status, 409);
  assert.equal(typeof r.body.error, "string");
});
