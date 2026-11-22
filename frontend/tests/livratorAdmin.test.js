// Teste pentru cursele refuzate, „În curând”, istoricul, indicatorii și administrarea livratorilor (src/livrator.js),
// plus istoricul unui restaurant (src/metrici.js). Rulate cu `node --test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ETICHETE_ACTIUNE, adaugaRefuz, citesteRefuzate, curseInCurand, faraRefuzate, indicatoriLivrator, istoricLivrator,
  livratoriActivi, mesajPas, motivFaraAcceptare, numeLivratorDemo, poateStergeLivrator, valideazaNumeLivrator,
} from "../src/livrator.js";
import { comenziIncheiateRestaurant, comenziRestaurant, indicatori } from "../src/metrici.js";

test("motivFaraAcceptare: un livrator dezactivat nu poate accepta", () => {
  assert.match(motivFaraAcceptare({ id: 1, nume: "A", online: true, activ: false }, 0), /dezactivat/);
  assert.equal(motivFaraAcceptare({ id: 1, nume: "A", online: true, activ: true }, 0), null);
});

test("mesajPas: confirmarea spune ce s-a întâmplat, nu textul butonului", () => {
  assert.equal(mesajPas("spre_restaurant", "Pizza Margherita"), "Ai pornit spre restaurant: „Pizza Margherita”.");
  assert.equal(mesajPas("preluata", "X"), "Ai preluat comanda: „X”.");
  assert.equal(mesajPas("spre_client", "X"), "Ai pornit spre client: „X”.");
  assert.equal(mesajPas("livrata", "X"), "Ai predat comanda: „X”.");
  assert.notEqual(mesajPas("spre_restaurant", "X").split(":")[0], ETICHETE_ACTIUNE.spre_restaurant);
});

test("citesteRefuzate validează textul din localStorage", () => {
  for (const v of [null, undefined, "", "nu e json", "[]", "5", "null"]) assert.deepEqual(citesteRefuzate(v), {}, String(v));
  assert.deepEqual(citesteRefuzate(JSON.stringify({ 1: [3, 3, "4", -1, null, {}], 2: "x", " ": [1], 3: [] })), { 1: ["3", "4"] });
});

test("adaugaRefuz și faraRefuzate: refuzul e per livrator", () => {
  let r = adaugaRefuz({}, 1, 7);
  r = adaugaRefuz(r, 1, 7);
  assert.deepEqual(r, { 1: ["7"] });
  assert.equal(adaugaRefuz(r, null, 8), r);
  const curse = [{ id: 7 }, { id: 8 }];
  assert.deepEqual(faraRefuzate(curse, r, 1).map((c) => c.id), [8]);
  assert.deepEqual(faraRefuzate(curse, r, "1").map((c) => c.id), [8]);
  assert.deepEqual(faraRefuzate(curse, r, 2).map((c) => c.id), [7, 8]);
  assert.deepEqual(faraRefuzate(null, r, 1), []);
});

test("curseInCurand: comenzi cu livrare, plasate sau acceptate, fără livrator", () => {
  const comenzi = [
    { id: 1, livrare: "standard", livrata: false, stare: "plasata" },
    { id: 2, livrare: "express", livrata: false, stare: "acceptata", livrareStare: "neasignata" },
    { id: 3, livrare: "ridicare", livrata: false, stare: "plasata" },
    { id: 4, livrare: "standard", livrata: false, stare: "in_preparare" },
    { id: 5, livrare: "standard", livrata: false, stare: "acceptata", livrareStare: "asignata", livratorId: 1 },
    { id: 6, livrare: "standard", livrata: true },
  ];
  assert.deepEqual(curseInCurand(comenzi).map((c) => c.id), [1, 2]);
  assert.deepEqual(curseInCurand(null), []);
});

test("istoricLivrator și indicatoriLivrator: doar comenzile predate de el, media din istoric", () => {
  const livrata = (id, livratorId, start, final, pret, reducere = 0) => ({
    id, livrare: "standard", livrata: true, stare: "livrata", livrareStare: "livrata", livratorId, pret, reducere,
    istoric: [{ stare: "in_livrare", la: start }, { stare: "livrata", la: final }],
  });
  const comenzi = [
    livrata(1, 1, "2026-11-22T10:00:00.000Z", "2026-11-22T10:20:00.000Z", 50, 10),
    livrata(2, 1, "2026-11-22T12:00:00.000Z", "2026-11-22T12:30:00.000Z", 30),
    livrata(3, 2, "2026-11-22T12:00:00.000Z", "2026-11-22T12:10:00.000Z", 99),
    { id: 4, livrare: "standard", livrata: false, stare: "in_livrare", livrareStare: "spre_client", livratorId: 1, pret: 10 },
    { id: 5, livrare: "standard", livrata: true, livratorId: 1, pret: 20 },
  ];
  assert.deepEqual(istoricLivrator(comenzi, 1).map((c) => c.id), [2, 1, 5]);
  assert.deepEqual(indicatoriLivrator(comenzi, 1), { numar: 3, medieLivrareMin: 25, valoare: 90 });
  assert.deepEqual(indicatoriLivrator([], 1), { numar: 0, medieLivrareMin: null, valoare: 0 });
  assert.deepEqual(istoricLivrator(comenzi, null), []);
});

test("valideazaNumeLivrator, numeLivratorDemo, poateStergeLivrator, livratoriActivi", () => {
  const lista = [{ id: 1, nume: "Andrei (livrator demo)", online: false, activ: true }, { id: 2, nume: "Ioana (livrator demo)", online: false, activ: false }];
  assert.equal(valideazaNumeLivrator("", lista), "Scrie numele livratorului.");
  assert.match(valideazaNumeLivrator("A", lista), /între 2 și 40/);
  assert.equal(valideazaNumeLivrator("andrei", lista), "Există deja un livrator cu acest nume.");
  assert.equal(valideazaNumeLivrator("Andrei", lista, 1), null);
  assert.equal(valideazaNumeLivrator("Ana", lista), null);
  assert.equal(numeLivratorDemo(" Ana "), "Ana (livrator demo)");
  assert.equal(numeLivratorDemo("Ana Demo"), "Ana Demo");
  const comenzi = [{ id: 9, livrare: "standard", livrata: false, stare: "gata", livrareStare: "asignata", livratorId: 1 }];
  assert.equal(poateStergeLivrator(comenzi, 1), false);
  assert.equal(poateStergeLivrator(comenzi, 2), true);
  assert.deepEqual(livratoriActivi(lista).map((l) => l.id), [1]);
});

test("comenziIncheiateRestaurant: doar comenzile încheiate ale restaurantului, cele mai noi primele", () => {
  const comenzi = [
    { id: 1, restaurant: "Burger Van", livrata: true, pret: 10, stare: "livrata", istoric: [{ stare: "livrata", la: "2026-11-22T10:00:00.000Z" }] },
    { id: 2, restaurant: "Burger Van", livrata: false, pret: 20, stare: "anulata", istoric: [{ stare: "anulata", la: "2026-11-22T12:00:00.000Z" }] },
    { id: 3, restaurant: "Burger Van", livrata: false, pret: 30, stare: "plasata" },
    { id: 4, restaurant: "Sushi Kyo", livrata: true, pret: 40 },
  ];
  assert.deepEqual(comenziIncheiateRestaurant(comenzi, "Burger Van").map((c) => c.id), [2, 1]);
  assert.deepEqual(comenziIncheiateRestaurant(null, "Burger Van"), []);
  const ale = comenziRestaurant(comenzi, "Burger Van");
  assert.equal(ale.length, 3);
  assert.equal(indicatori(ale).numar, 3);
  assert.equal(indicatori(ale).valoare, 40);
});
