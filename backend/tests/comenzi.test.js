import { test } from "node:test";
import assert from "node:assert/strict";
import { porneste } from "./helpers.js";

const SAMPLE = { restaurant: "Pizzeria Napoli", livrare: "standard" }; // din tw.json

test("checker (S9-R2): GET, POST, GET /:id, PATCH, DELETE, apoi GET același id -> 404", async (t) => {
  const { cerere } = await porneste(t);
  const lista = await cerere("GET", "/comenzi");
  assert.equal(lista.status, 200);
  assert.ok(Array.isArray(lista.body));
  assert.equal(lista.body.length, 6);

  const creata = await cerere("POST", "/comenzi", { preparat: "X", livrata: false, ...SAMPLE });
  assert.equal(creata.status, 201);
  assert.equal(creata.body.preparat, "X");
  assert.equal(creata.body.livrata, false);
  assert.ok(Number.isInteger(creata.body.id));
  const id = creata.body.id;

  const citita = await cerere("GET", `/comenzi/${id}`);
  assert.equal(citita.status, 200);
  assert.deepEqual(citita.body, creata.body);

  const modificata = await cerere("PATCH", `/comenzi/${id}`, { livrata: true });
  assert.equal(modificata.status, 200);
  assert.equal(modificata.body.livrata, true);
  assert.equal(modificata.body.preparat, "X");

  const stearsa = await cerere("DELETE", `/comenzi/${id}`);
  assert.equal(stearsa.status, 204);
  assert.equal(stearsa.body, null);

  const lipsa = await cerere("GET", `/comenzi/${id}`);
  assert.equal(lipsa.status, 404);
  assert.deepEqual(lipsa.body, { error: "Comanda nu există" });
});

test("checker (S9-R3): POST {} și POST { preparat: \"\" } -> 400 cu { error }", async (t) => {
  const { cerere } = await porneste(t);
  for (const corp of [{}, { preparat: "" }, { preparat: "   ", ...SAMPLE }]) {
    const r = await cerere("POST", "/comenzi", corp);
    assert.equal(r.status, 400, JSON.stringify(corp));
    assert.deepEqual(Object.keys(r.body), ["error"]);
    assert.match(r.body.error, /preparat/);
  }
  assert.equal((await cerere("GET", "/comenzi")).body.length, 6);
});

test("comanda minimă e o comandă specială, cu valorile implicite pe care le așteaptă interfața", async (t) => {
  const { cerere } = await porneste(t);
  const { body } = await cerere("POST", "/comenzi", { preparat: "  Pizza cu trufe  ", livrata: false, ...SAMPLE });
  assert.equal(body.preparat, "Pizza cu trufe");
  assert.equal(body.pret, null);
  assert.equal(body.speciala, true);
  assert.equal(body.categorie, "Pizza");
  assert.equal(body.stare, "plasata");
  assert.equal(body.livrareStare, "neasignata");
  assert.deepEqual(body.plata, { metoda: "numerar", stare: "neplatita" });
  assert.ok(!Number.isNaN(Date.parse(body.creata)));
  assert.deepEqual(body.istoric, [{ stare: "plasata", la: body.creata }]);
  for (const camp of ["livratorId", "timpPreparare", "adresa", "contact", "programataLa", "cupon", "motiv"]) assert.equal(body[camp], null, camp);
  assert.equal(body.reducere, 0);
});

test("la ridicare nu există pași de livrare (livrareStare null)", async (t) => {
  const { cerere } = await porneste(t);
  const { body } = await cerere("POST", "/comenzi", { preparat: "Ceva", restaurant: "Sushi Kyo", livrare: "ridicare" });
  assert.equal(body.livrareStare, null);
});

test("lista albă: câmpurile necunoscute și id-ul trimis de client sunt ignorate", async (t) => {
  const { cerere } = await porneste(t);
  const { status, body } = await cerere("POST", "/comenzi", { id: 1, preparat: "Y", ...SAMPLE, admin: true, parola: 1, categorie: "Asian", speciala: false });
  assert.equal(status, 201);
  assert.equal(body.id, 7);
  assert.equal("admin" in body, false);
  assert.equal("parola" in body, false);
  assert.equal(body.categorie, "Pizza");
  assert.equal(body.speciala, true);
  assert.equal((await cerere("GET", "/comenzi/1")).body.preparat, "Pizza Margherita");

  const patch = await cerere("PATCH", "/comenzi/1", { id: 99, livrata: true, rol: "admin" });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.id, 1);
  assert.equal("rol" in patch.body, false);
  assert.equal((await cerere("GET", "/comenzi/99")).status, 404);
});

test("un preparat din meniu primește prețul din meniu (cantitatea din „× n”), nu pe cel trimis", async (t) => {
  const { cerere } = await porneste(t);
  const una = await cerere("POST", "/comenzi", { preparat: "Pizza Margherita", restaurant: "Pizzeria Napoli", livrare: "express", pret: 1 });
  assert.equal(una.body.pret, 42);
  assert.equal(una.body.speciala, false);
  const doua = await cerere("POST", "/comenzi", { preparat: "Ramen cu porc × 3", restaurant: "Sushi Kyo", livrare: "standard", pret: 5 });
  assert.equal(doua.body.pret, 132);
  assert.equal(doua.body.categorie, "Asian");
  const patch = await cerere("PATCH", `/comenzi/${una.body.id}`, { pret: 2 });
  assert.equal(patch.body.pret, 42);
});

test("comanda specială primește prețul la acceptare (PATCH)", async (t) => {
  const { cerere } = await porneste(t);
  const { body } = await cerere("POST", "/comenzi", { preparat: "Pizza cu trufe", ...SAMPLE });
  const acceptata = await cerere("PATCH", `/comenzi/${body.id}`, { stare: "acceptata", timpPreparare: 30, pret: 70, istoric: [...body.istoric, { stare: "acceptata", la: new Date().toISOString() }] });
  assert.equal(acceptata.status, 200);
  assert.equal(acceptata.body.pret, 70);
  assert.equal(acceptata.body.stare, "acceptata");
  assert.equal(acceptata.body.istoric.length, 2);
});

test("valorile fixe sunt verificate pe server (livrare, stare, plata, livrareStare, restaurant)", async (t) => {
  const { cerere } = await porneste(t);
  const gresite = [
    { preparat: "X", restaurant: "Pizzeria Napoli", livrare: "drona" },
    { preparat: "X", restaurant: "McDonalds", livrare: "standard" },
    { preparat: "X", ...SAMPLE, stare: "pierduta" },
    { preparat: "X", ...SAMPLE, plata: { metoda: "bitcoin", stare: "platita" } },
    { preparat: "X", ...SAMPLE, livrareStare: "teleportata" },
    { preparat: "X", ...SAMPLE, livrata: "da" },
    { preparat: "X", ...SAMPLE, pret: -5 },
    { preparat: "X", ...SAMPLE, cupon: "GRATIS100" },
    { preparat: "X", ...SAMPLE, contact: { nume: "Ana", telefon: "123" } },
    { preparat: "X".repeat(101), ...SAMPLE },
  ];
  for (const corp of gresite) {
    const r = await cerere("POST", "/comenzi", corp);
    assert.equal(r.status, 400, JSON.stringify(corp));
    assert.equal(typeof r.body.error, "string");
  }
  assert.equal((await cerere("PATCH", "/comenzi/1", { stare: "pierduta" })).status, 400);
  assert.equal((await cerere("PATCH", "/comenzi/1", { preparat: "" })).status, 400);
  assert.equal((await cerere("PATCH", "/comenzi/1", { necunoscut: 1 })).status, 400);
});

test("o comandă din coș (checkout.js) e acceptată cu toate câmpurile ei", async (t) => {
  const { cerere } = await porneste(t);
  const acum = "2026-11-23T12:00:00.000Z";
  const corp = {
    preparat: "Pizza Diavola × 2", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 96, creata: acum,
    stare: "plasata", plata: { metoda: "card_simulat", stare: "platita" }, livratorId: null, timpPreparare: null,
    istoric: [{ stare: "plasata", la: acum }], livrareStare: "neasignata", adresa: "Str. Lungă 10, Brașov",
    contact: { nume: "Ana Pop", telefon: "0722 123 456" }, programataLa: null, cupon: "SAVORO10", reducere: 10,
  };
  const { status, body } = await cerere("POST", "/comenzi", corp);
  assert.equal(status, 201);
  assert.equal(body.pret, 96);
  assert.deepEqual(body.contact, { nume: "Ana Pop", telefon: "0722123456" });
  assert.equal(body.cupon, "SAVORO10");
  assert.equal(body.reducere, 10);
  assert.deepEqual(body.plata, corp.plata);
});

test("„Anulează”: comanda ștearsă, retrimisă fără id, revine cu un id nou și aceleași date", async (t) => {
  const { cerere } = await porneste(t);
  const veche = (await cerere("GET", "/comenzi/5")).body;
  assert.equal((await cerere("DELETE", "/comenzi/5")).status, 204);
  const corp = { ...veche };
  delete corp.id;
  const readusa = await cerere("POST", "/comenzi", corp);
  assert.equal(readusa.status, 201);
  assert.equal(readusa.body.id, 7);
  for (const camp of ["preparat", "restaurant", "livrare", "livrata", "pret", "categorie"]) assert.deepEqual(readusa.body[camp], veche[camp], camp);
});

test("id-uri invalide -> 400; id inexistent -> 404, la toate metodele", async (t) => {
  const { cerere } = await porneste(t);
  for (const id of ["abc", "0", "-1", "1.5", "007"]) {
    assert.equal((await cerere("GET", `/comenzi/${id}`)).status, 400, id);
    assert.equal((await cerere("PATCH", `/comenzi/${id}`, { livrata: true })).status, 400, id);
    assert.equal((await cerere("DELETE", `/comenzi/${id}`)).status, 400, id);
  }
  assert.equal((await cerere("GET", "/comenzi/999")).status, 404);
  assert.equal((await cerere("PATCH", "/comenzi/999", { livrata: true })).status, 404);
  assert.equal((await cerere("DELETE", "/comenzi/999")).status, 404);
});

test("un id șters nu se refolosește", async (t) => {
  const { cerere } = await porneste(t);
  const a = await cerere("POST", "/comenzi", { preparat: "A", ...SAMPLE });
  await cerere("DELETE", `/comenzi/${a.body.id}`);
  const b = await cerere("POST", "/comenzi", { preparat: "B", ...SAMPLE });
  assert.equal(b.body.id, a.body.id + 1);
});
