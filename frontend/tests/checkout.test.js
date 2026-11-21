// Teste pentru plasarea comenzii pe /cos (src/checkout.js), rulate cu `node --test`.
// Datele sunt construite în ora locală (new Date(an, lună, zi, oră, minut)), ca și ora aleasă în câmpul <input type="time">.
import { test } from "node:test";
import assert from "node:assert/strict";
import { detaliiCheckout, momentProgramat, oraMinimaProgramare, valideazaCheckout } from "../src/checkout.js";

const ACUM = new Date(2026, 10, 22, 18, 2); // 22 noiembrie 2026, 18:02, ora locală
const BUNE = Object.freeze({ nume: "Ana Pop", telefon: "0722 123 456", livrare: "standard", adresa: "Str. Lalelelor 5, București", programare: "acum", ora: "", metodaPlata: "numerar" });

test("datele bune trec validarea", () => {
  assert.equal(valideazaCheckout(BUNE, ACUM), null);
  assert.equal(valideazaCheckout({ ...BUNE, metodaPlata: "card_simulat" }, ACUM), null);
});

test("primul câmp greșit, în ordinea din pagină", () => {
  assert.equal(valideazaCheckout({ ...BUNE, nume: "" }, ACUM).camp, "nume");
  assert.equal(valideazaCheckout({ ...BUNE, telefon: "123" }, ACUM).camp, "telefon");
  assert.equal(valideazaCheckout({ ...BUNE, livrare: "drona" }, ACUM).camp, "livrare");
  assert.equal(valideazaCheckout({ ...BUNE, adresa: "  " }, ACUM).camp, "adresa");
  assert.equal(valideazaCheckout({ ...BUNE, programare: "mâine" }, ACUM).camp, "programare");
  assert.equal(valideazaCheckout({ ...BUNE, metodaPlata: "card_real" }, ACUM).camp, "plata");
  assert.equal(valideazaCheckout({ ...BUNE, nume: "", telefon: "1" }, ACUM).camp, "nume");
});

test("la ridicare adresa nu e cerută", () => {
  assert.equal(valideazaCheckout({ ...BUNE, livrare: "ridicare", adresa: "" }, ACUM), null);
});

test("programarea: azi, cu cel puțin 30 de minute înainte", () => {
  const programat = { ...BUNE, programare: "programat" };
  assert.equal(valideazaCheckout({ ...programat, ora: "" }, ACUM).camp, "ora");
  assert.equal(valideazaCheckout({ ...programat, ora: "25:00" }, ACUM).camp, "ora");
  const prea = valideazaCheckout({ ...programat, ora: "18:20" }, ACUM);
  assert.equal(prea.camp, "ora");
  assert.match(prea.mesaj, /18:35/);
  assert.equal(valideazaCheckout({ ...programat, ora: "17:00" }, ACUM).camp, "ora", "o oră trecută nu e acceptată");
  assert.equal(valideazaCheckout({ ...programat, ora: "18:35" }, ACUM), null);
  assert.equal(valideazaCheckout({ ...programat, ora: "23:59" }, ACUM), null);
});

test("oraMinimaProgramare rotunjește în sus la 5 minute și e null după miezul nopții", () => {
  assert.equal(oraMinimaProgramare(ACUM), "18:35");
  assert.equal(oraMinimaProgramare(new Date(2026, 10, 22, 18, 0)), "18:30");
  assert.equal(oraMinimaProgramare(new Date(2026, 10, 22, 23, 40)), null);
  const tarziu = valideazaCheckout({ ...BUNE, programare: "programat", ora: "23:50" }, new Date(2026, 10, 22, 23, 40));
  assert.match(tarziu.mesaj, /Azi nu mai poți programa/);
});

test("momentProgramat: aceeași zi, ora aleasă; null la text greșit", () => {
  const data = momentProgramat("19:45", ACUM);
  assert.deepEqual([data.getDate(), data.getHours(), data.getMinutes()], [22, 19, 45]);
  assert.equal(momentProgramat("7:45", ACUM), null);
  assert.equal(momentProgramat(null, ACUM), null);
  assert.equal(ACUM.getHours(), 18, "data primită nu se modifică");
});

test("detaliiCheckout: starea de pornire, plata, contactul curățat, adresa și programarea", () => {
  const d = detaliiCheckout({ ...BUNE, metodaPlata: "card_simulat", programare: "programat", ora: "19:00" }, ACUM);
  assert.equal(d.stare, "plasata");
  assert.deepEqual(d.plata, { metoda: "card_simulat", stare: "platita" });
  assert.equal(d.livrareStare, "neasignata");
  assert.deepEqual(d.istoric, [{ stare: "plasata", la: ACUM.toISOString() }]);
  assert.deepEqual(d.contact, { nume: "Ana Pop", telefon: "0722123456" });
  assert.equal(d.adresa, "Str. Lalelelor 5, București");
  assert.equal(d.programataLa, new Date(2026, 10, 22, 19, 0).toISOString());
  const ridicare = detaliiCheckout({ ...BUNE, livrare: "ridicare", adresa: "" }, ACUM);
  assert.equal(ridicare.adresa, null);
  assert.equal(ridicare.programataLa, null);
  assert.equal(Object.hasOwn(ridicare, "livrareStare"), false);
  assert.deepEqual(ridicare.plata, { metoda: "numerar", stare: "neplatita" });
});
