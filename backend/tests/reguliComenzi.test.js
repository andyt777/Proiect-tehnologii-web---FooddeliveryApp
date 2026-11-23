// Regulile serverului pentru comenzi (plan §4.3, §5): tranzițiile celor trei stări, istoricul scris de server,
// regulile plasării, protecția la duplicate și alocarea automată a livratorului.
import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

const SAMPLE = { restaurant: "Pizzeria Napoli", livrare: "standard" };
const PROGRAM_INCHIS = { luni: null, marti: null, miercuri: null, joi: null, vineri: null, sambata: null, duminica: null };

function program(interval) {
  return Object.fromEntries(Object.keys(PROGRAM_INCHIS).map((zi) => [zi, interval]));
}

async function comandaNoua(cerere, extra = {}) {
  const r = await cerere("POST", "/comenzi", { preparat: "Pizza Margherita", ...SAMPLE, ...extra });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}

async function patch(cerere, id, corp, status = 200) {
  const r = await cerere("PATCH", `/comenzi/${id}`, corp);
  assert.equal(r.status, status, `${JSON.stringify(corp)} -> ${JSON.stringify(r.body)}`);
  return r.body;
}

function stari(comanda) {
  return comanda.istoric.map((e) => e.stare);
}

test("drumul complet cu livrare: restaurant -> livrator -> predare; istoricul îl scrie serverul", async (t) => {
  const { cerere } = await porneste(t);
  assert.equal((await cerere("PATCH", "/livratori/1", { online: true })).status, 200);
  const inainte = Date.now();
  const c = await comandaNoua(cerere);
  assert.deepEqual(stari(c), ["plasata"]);

  let r = await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 25 });
  assert.equal(r.timpPreparare, 25);
  r = await patch(cerere, c.id, { stare: "in_preparare" });
  r = await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 1 });
  assert.equal(r.livratorId, 1);
  r = await patch(cerere, c.id, { livrareStare: "spre_restaurant" });
  r = await patch(cerere, c.id, { stare: "gata" });
  r = await patch(cerere, c.id, { livrareStare: "preluata" });
  assert.equal(r.stare, "in_livrare");
  r = await patch(cerere, c.id, { livrareStare: "spre_client" });
  r = await patch(cerere, c.id, { livrareStare: "livrata" });
  assert.equal(r.stare, "livrata");
  assert.equal(r.livrata, true);
  assert.deepEqual(r.plata, { metoda: "numerar", stare: "platita" });
  assert.deepEqual(stari(r), ["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata"]);
  for (const e of r.istoric) {
    assert.deepEqual(Object.keys(e), ["stare", "la"]);
    assert.ok(Date.parse(e.la) >= inainte - 1000 && Date.parse(e.la) <= Date.now() + 1000, e.la);
  }
});

test("ridicarea: restaurantul o predă direct (gata -> livrata), fără livrator", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere, { livrare: "ridicare" });
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 10 });
  await patch(cerere, c.id, { stare: "in_preparare" });
  await patch(cerere, c.id, { stare: "gata" });
  await patch(cerere, c.id, { stare: "in_livrare" }, 409);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 1 }, 409);
  const r = await patch(cerere, c.id, { stare: "livrata", livrata: true });
  assert.equal(r.livrareStare, null);
});

test("tranziții nepermise -> 409 cu mesaj românesc, comanda rămâne neschimbată", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  for (const stare of ["in_preparare", "gata", "in_livrare"]) {
    const r = await cerere("PATCH", `/comenzi/${c.id}`, { stare });
    assert.equal(r.status, 409, stare);
    assert.match(r.body.error, /nu poate trece din „Plasată”/);
  }
  await patch(cerere, c.id, { stare: "anulata", motiv: "M-am răzgândit" });
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 }, 409);
  await patch(cerere, c.id, { stare: "plasata" }, 409);
  const respinsa = await comandaNoua(cerere);
  await patch(cerere, respinsa.id, { stare: "respinsa", motiv: "Nu mai avem blat" });
  await patch(cerere, respinsa.id, { stare: "plasata" }, 409);
  const dupa = (await cerere("GET", `/comenzi/${c.id}`)).body;
  assert.equal(dupa.stare, "anulata");
  assert.deepEqual(stari(dupa), ["plasata", "anulata"]);
});

test("clientul anulează doar până la preparare; după, doar tranzițiile adminului (anulare din orice stare activă)", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 });
  await patch(cerere, c.id, { stare: "in_preparare" });
  const r = await patch(cerere, c.id, { stare: "anulata", motiv: "Restaurantul a închis" });
  assert.equal(r.motiv, "Restaurantul a închis");
});

test("anularea și respingerea cer motiv (400); cardul plătit se rambursează", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere, { plata: { metoda: "card_simulat", stare: "neplatita" } });
  assert.deepEqual(c.plata, { metoda: "card_simulat", stare: "platita" });
  for (const corp of [{ stare: "anulata" }, { stare: "anulata", motiv: "   " }, { stare: "respinsa", motiv: null }]) {
    const r = await cerere("PATCH", `/comenzi/${c.id}`, corp);
    assert.equal(r.status, 400, JSON.stringify(corp));
    assert.match(r.body.error, /motiv/);
  }
  const anulata = await patch(cerere, c.id, { stare: "anulata", motiv: "Am greșit adresa sau ora" });
  assert.deepEqual(anulata.plata, { metoda: "card_simulat", stare: "rambursata" });
});

test("acceptarea cere timpPreparare (400) și, la comanda specială fără preț, pret (400)", async (t) => {
  const { cerere } = await porneste(t);
  const meniu = await comandaNoua(cerere);
  await patch(cerere, meniu.id, { stare: "acceptata" }, 400);
  await patch(cerere, meniu.id, { stare: "acceptata", timpPreparare: 2 }, 400);
  assert.equal((await patch(cerere, meniu.id, { stare: "acceptata", timpPreparare: 15 })).pret, 42);
  const speciala = await comandaNoua(cerere, { preparat: "Pizza cu trufe" });
  const r = await cerere("PATCH", `/comenzi/${speciala.id}`, { stare: "acceptata", timpPreparare: 15 });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /pret/);
  assert.equal((await patch(cerere, speciala.id, { stare: "acceptata", timpPreparare: 15, pret: 80 })).pret, 80);
});

test("istoricul trimis de client e ignorat: serverul adaugă singur intrarea, cu ora lui", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere, { istoric: [{ stare: "livrata", la: "2000-01-01T00:00:00.000Z" }] });
  assert.deepEqual(stari(c), ["plasata"]);
  assert.notEqual(c.istoric[0].la, "2000-01-01T00:00:00.000Z");
  const fals = [{ stare: "plasata", la: "2000-01-01T00:00:00.000Z" }, { stare: "gata", la: "2000-01-01T00:05:00.000Z" }];
  const r = await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20, istoric: fals });
  assert.deepEqual(stari(r), ["plasata", "acceptata"]);
  assert.equal(r.istoric[0].la, c.istoric[0].la);
  assert.ok(Date.parse(r.istoric[1].la) > Date.parse("2020-01-01"));
  const doarIstoric = await patch(cerere, c.id, { istoric: fals });
  assert.deepEqual(doarIstoric.istoric, r.istoric);
});

test("plata, livratorul, timpul și motivul nu se schimbă direct (409)", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  await patch(cerere, c.id, { plata: { metoda: "numerar", stare: "platita" } }, 409);
  await patch(cerere, c.id, { plata: { metoda: "card_simulat", stare: "platita" } }, 409);
  await patch(cerere, c.id, { livratorId: 1 }, 409);
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 });
  await patch(cerere, c.id, { timpPreparare: 60 }, 409);
  await patch(cerere, c.id, { motiv: "Fără motiv" }, 409);
  await patch(cerere, c.id, { stare: "in_preparare", livrata: true }, 409);
  const neschimbat = await patch(cerere, c.id, { plata: { metoda: "numerar", stare: "neplatita" }, timpPreparare: 20, livratorId: null });
  assert.equal(neschimbat.stare, "acceptata");
});

test("pașii livrării: ordinea, starea comenzii și livratorul sunt verificate", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 1 }, 409);
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 });
  await patch(cerere, c.id, { livrareStare: "spre_restaurant" }, 409);
  await patch(cerere, c.id, { livrareStare: "asignata" }, 409);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 99 }, 409);
  assert.equal((await cerere("PATCH", "/livratori/3", { activ: false })).status, 200);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 3 }, 409);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 2 });
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 1 }, 409);
  const retras = await patch(cerere, c.id, { livrareStare: "neasignata", livratorId: null });
  assert.equal(retras.livratorId, null);
  await patch(cerere, c.id, { livrareStare: "asignata", livratorId: 2 });
  await patch(cerere, c.id, { livrareStare: "spre_restaurant" });
  await patch(cerere, c.id, { livrareStare: "neasignata" }, 409);
  await patch(cerere, c.id, { livrareStare: "preluata" }, 409);
  await patch(cerere, c.id, { stare: "in_preparare" });
  await patch(cerere, c.id, { stare: "gata" });
  const preluata = await patch(cerere, c.id, { stare: "in_livrare", livrata: false, plata: { metoda: "numerar", stare: "neplatita" }, livrareStare: "preluata" });
  assert.equal(preluata.livrareStare, "preluata");
  await patch(cerere, c.id, { livrareStare: "livrata" }, 409);
  await patch(cerere, c.id, { stare: "in_livrare", livrareStare: "spre_client" }, 200);
});

test("bifa „Livrată” de pe „/”: { livrata } schimbă starea, plata și istoricul; debifarea revine la starea de dinainte", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 });
  const bifata = await patch(cerere, c.id, { livrata: true });
  assert.equal(bifata.stare, "livrata");
  assert.equal(bifata.livrareStare, "livrata");
  assert.deepEqual(bifata.plata, { metoda: "numerar", stare: "platita" });
  const debifata = await patch(cerere, c.id, { livrata: false });
  assert.equal(debifata.stare, "acceptata");
  assert.equal(debifata.livrareStare, "neasignata");
  assert.deepEqual(debifata.plata, { metoda: "numerar", stare: "neplatita" });
  assert.deepEqual(stari(debifata), ["plasata", "acceptata", "livrata", "acceptata"]);
  await patch(cerere, c.id, { livrata: true });
  await patch(cerere, c.id, { stare: "in_preparare", livrata: false }, 409);
  const veche = await patch(cerere, 2, { livrata: false });
  assert.equal(veche.stare, "plasata");
  assert.equal((await patch(cerere, 2, { livrata: true })).stare, "livrata");
});

test("plasarea: preparat indisponibil, restaurant în pauză sau închis -> 409; comanda specială respectă pauza și programul", async (t) => {
  const { cerere } = await porneste(t);
  assert.equal((await cerere("PATCH", "/meniu/p2", { disponibil: false })).status, 200);
  let r = await cerere("POST", "/comenzi", { preparat: "Pizza Diavola × 2", ...SAMPLE });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /nu mai e disponibil/);

  assert.equal((await cerere("POST", "/restaurante", { id: "burger-van", pauzat: true, program: program({ deschide: "00:00", inchide: "23:59" }) })).status, 201);
  for (const preparat of ["Burger vegetarian", "Burger special"]) {
    r = await cerere("POST", "/comenzi", { preparat, restaurant: "Burger Van", livrare: "standard" });
    assert.equal(r.status, 409, preparat);
    assert.match(r.body.error, /pauză/);
  }

  assert.equal((await cerere("POST", "/restaurante", { id: "sushi-kyo", program: PROGRAM_INCHIS })).status, 201);
  for (const preparat of ["Ramen cu porc", "Sushi special"]) {
    r = await cerere("POST", "/comenzi", { preparat, restaurant: "Sushi Kyo", livrare: "ridicare" });
    assert.equal(r.status, 409, preparat);
    assert.match(r.body.error, /închis/);
  }
  const istoricInchis = await cerere("POST", "/comenzi", { preparat: "Ramen cu porc", restaurant: "Sushi Kyo", livrare: "ridicare", livrata: true });
  assert.equal(istoricInchis.status, 201);
  assert.equal((await cerere("GET", "/comenzi")).body.length, 7);
});

test("comanda programată se verifică la ora aleasă (programataLa), nu la ora plasării", async (t) => {
  const { cerere } = await porneste(t);
  assert.equal((await cerere("POST", "/restaurante", { id: "pizzeria-napoli", program: program({ deschide: "10:00", inchide: "11:00" }) })).status, 201);
  const maine = new Date();
  maine.setDate(maine.getDate() + 1);
  const la = (ora, minut) => new Date(maine.getFullYear(), maine.getMonth(), maine.getDate(), ora, minut).toISOString();
  assert.equal((await cerere("POST", "/comenzi", { preparat: "Pizza Margherita", ...SAMPLE, programataLa: la(10, 30) })).status, 201);
  const r = await cerere("POST", "/comenzi", { preparat: "Pizza Margherita", ...SAMPLE, programataLa: la(12, 0) });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /închis la ora aleasă/);
});

test("checker-ul: Pizzeria Napoli din seed nu are profil, deci e deschisă la orice oră (201)", async (t) => {
  const { cerere } = await porneste(t);
  assert.deepEqual((await cerere("GET", "/restaurante")).body, []);
  const r = await cerere("POST", "/comenzi", { preparat: "X", livrata: false, restaurant: "Pizzeria Napoli", livrare: "standard" });
  assert.equal(r.status, 201);
  assert.equal(r.body.stare, "plasata");
  assert.equal((await cerere("PATCH", `/comenzi/${r.body.id}`, { livrata: true })).status, 200);
});

test("o comandă nouă pornește din „plasata”: altă stare la POST -> 409; plata, livratorul și timpul le pune serverul", async (t) => {
  const { cerere } = await porneste(t);
  const r = await cerere("POST", "/comenzi", { preparat: "X", ...SAMPLE, stare: "gata" });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /pornește din „Plasată”/);
  const c = await comandaNoua(cerere, { livratorId: 1, timpPreparare: 30, motiv: "x", plata: { metoda: "numerar", stare: "platita" }, livrareStare: "spre_client" });
  assert.deepEqual([c.livratorId, c.timpPreparare, c.motiv, c.livrareStare], [null, null, null, "neasignata"]);
  assert.deepEqual(c.plata, { metoda: "numerar", stare: "neplatita" });
});

test("Idempotency-Key: aceeași cheie întoarce comanda creată prima dată (201), fără duplicat", async (t) => {
  const { cerere } = await porneste(t);
  const corp = { preparat: "Pizza Margherita", ...SAMPLE };
  const antete = { "Idempotency-Key": "cos-1700000000-p1" };
  const prima = await cerere("POST", "/comenzi", corp, { antete });
  const aDoua = await cerere("POST", "/comenzi", corp, { antete });
  assert.equal(prima.status, 201);
  assert.equal(aDoua.status, 201);
  assert.equal(aDoua.headers.get("idempotent-replayed"), "true");
  assert.equal(prima.headers.get("idempotent-replayed"), null);
  assert.deepEqual(aDoua.body, prima.body);
  assert.equal((await cerere("GET", "/comenzi")).body.length, 7);

  const alta = await cerere("POST", "/comenzi", { ...corp, preparat: "Pizza Diavola" }, { antete });
  assert.equal(alta.status, 409);
  assert.match(alta.body.error, /Idempotency-Key/);
  assert.equal((await cerere("POST", "/comenzi", corp, { antete: { "Idempotency-Key": "are spatii" } })).status, 400);
  assert.equal((await cerere("POST", "/comenzi", corp, { antete: { "Idempotency-Key": "k".repeat(201) } })).status, 400);
  assert.equal((await cerere("POST", "/comenzi", corp, { antete: { "Idempotency-Key": "cheie-2" } })).body.id, 8);
  assert.equal((await cerere("POST", "/comenzi", corp)).body.id, 9);
});

test("Idempotency-Key: o cerere refuzată nu păstrează cheia", async (t) => {
  const { cerere } = await porneste(t);
  const antete = { "Idempotency-Key": "k-1" };
  assert.equal((await cerere("POST", "/comenzi", { preparat: "", ...SAMPLE }, { antete })).status, 400);
  assert.equal((await cerere("POST", "/comenzi", { preparat: "X", ...SAMPLE }, { antete })).status, 201);
});

test("POST /comenzi/:id/dispatch: alocă livratorul online, activ și liber; 409 fără livrator sau în altă stare", async (t) => {
  const { cerere } = await porneste(t);
  const a = await comandaNoua(cerere);
  const b = await comandaNoua(cerere);
  const c = await comandaNoua(cerere);
  let r = await cerere("POST", `/comenzi/${a.id}/dispatch`);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Livrarea nu poate trece/);
  for (const x of [a, b, c]) await patch(cerere, x.id, { stare: "acceptata", timpPreparare: 20 });

  r = await cerere("POST", `/comenzi/${a.id}/dispatch`);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Niciun livrator disponibil/);

  for (const id of [3, 2]) assert.equal((await cerere("PATCH", `/livratori/${id}`, { online: true })).status, 200);
  r = await cerere("POST", `/comenzi/${a.id}/dispatch`, {});
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.livratorId, r.body.livrareStare, r.body.stare], [2, "asignata", "acceptata"]);
  assert.deepEqual(stari(r.body), ["plasata", "acceptata"]);
  assert.equal((await cerere("POST", `/comenzi/${a.id}/dispatch`)).status, 409);
  r = await cerere("POST", `/comenzi/${b.id}/dispatch`);
  assert.equal(r.body.livratorId, 3);
  r = await cerere("POST", `/comenzi/${c.id}/dispatch`);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Niciun livrator disponibil/);

  const ridicare = await comandaNoua(cerere, { livrare: "ridicare" });
  await patch(cerere, ridicare.id, { stare: "acceptata", timpPreparare: 20 });
  assert.equal((await cerere("POST", `/comenzi/${ridicare.id}/dispatch`)).status, 409);
  assert.equal((await cerere("POST", "/comenzi/999/dispatch")).status, 404);
  assert.equal((await cerere("POST", "/comenzi/abc/dispatch")).status, 400);
});

test("tipul livrării (ridicare / cu livrator) se schimbă doar cât comanda e plasată", async (t) => {
  const { cerere } = await porneste(t);
  const c = await comandaNoua(cerere);
  const r = await patch(cerere, c.id, { livrare: "ridicare" });
  assert.equal(r.livrareStare, null);
  assert.equal((await patch(cerere, c.id, { livrare: "express" })).livrareStare, "neasignata");
  await patch(cerere, c.id, { stare: "acceptata", timpPreparare: 20 });
  await patch(cerere, c.id, { livrare: "ridicare" }, 409);
  assert.equal((await patch(cerere, c.id, { livrare: "standard" })).livrare, "standard");
});
