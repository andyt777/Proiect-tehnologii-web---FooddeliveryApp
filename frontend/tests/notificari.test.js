// Teste pentru notificările din aplicație (src/notificari.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { NOTIFICARI_MAXIME, adaugaNotificari, areComenziActive, hartaStari, mesajNotificare, schimbariStare } from "../src/notificari.js";

const VECHI = [
  { id: 1, preparat: "Pizza Margherita", livrata: false },
  { id: 2, preparat: "Burger vegetarian", livrata: true },
  { id: 3, preparat: "Platou sushi", livrata: false, livrare: "ridicare", stare: "in_preparare" },
];

test("hartaStari folosește starea derivată (cu valorile implicite) și sare peste comenzile fără id", () => {
  const harta = hartaStari([...VECHI, { preparat: "fără id" }, null]);
  assert.deepEqual([...harta.entries()], [[1, "plasata"], [2, "livrata"], [3, "in_preparare"]]);
  assert.equal(hartaStari("nu e listă").size, 0);
});

test("areComenziActive: true cât există o comandă neîncheiată", () => {
  assert.equal(areComenziActive(hartaStari(VECHI)), true);
  assert.equal(areComenziActive(hartaStari([{ id: 2, livrata: true }, { id: 4, livrata: false, stare: "anulata" }])), false);
  assert.equal(areComenziActive(new Map()), false);
});

test("schimbariStare: doar comenzile existente care și-au schimbat starea; cele noi și cele șterse nu contează", () => {
  const inainte = hartaStari(VECHI);
  const noi = [
    { id: 1, preparat: "Pizza Margherita", livrata: false, stare: "acceptata" },
    { id: 3, preparat: "Platou sushi", livrata: false, livrare: "ridicare", stare: "gata" },
    { id: 9, preparat: "Comandă nouă", livrata: false },
  ];
  const schimbari = schimbariStare(inainte, noi);
  assert.deepEqual(schimbari.map((s) => [s.id, s.deLa, s.la]), [[1, "plasata", "acceptata"], [3, "in_preparare", "gata"]]);
  assert.equal(schimbariStare(inainte, VECHI).length, 0, "fără schimbări, nicio notificare");
  assert.deepEqual(schimbariStare(inainte, null), []);
});

test("mesajNotificare: numele preparatului și textul stării (inclusiv „Gata de ridicare”)", () => {
  const [s] = schimbariStare(hartaStari(VECHI), [{ id: 3, preparat: "Platou sushi", livrata: false, livrare: "ridicare", stare: "gata" }]);
  assert.equal(mesajNotificare(s), "Platou sushi: Gata de ridicare");
  assert.equal(mesajNotificare({ id: 7, preparat: "", comanda: { livrata: true } }), "Comanda 7: Livrată");
});

test("adaugaNotificari păstrează cele mai noi NOTIFICARI_MAXIME mesaje, cu chei unice", () => {
  const schimbari = schimbariStare(hartaStari(VECHI), [{ id: 1, preparat: "Pizza", livrata: true }, { id: 3, preparat: "Sushi", livrata: true, livrare: "ridicare" }]);
  let lista = adaugaNotificari([], schimbari, 1);
  lista = adaugaNotificari(lista, schimbari, 2);
  assert.equal(lista.length, NOTIFICARI_MAXIME);
  assert.equal(new Set(lista.map((n) => n.cheie)).size, lista.length);
  assert.equal(lista.at(-1).text, "Sushi: Ridicată");
});
