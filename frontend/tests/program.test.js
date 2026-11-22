// Teste pentru profilul și programul restaurantelor (src/program.js), rulate cu `node --test`.
// Datele sunt construite cu new Date(an, lună, zi, oră, minut), deci în fusul orar local, ca esteDeschis.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ZILE, curataProfiluri, esteDeschis, estePreparatDisponibil, mesajeProbleme, momentVerificare, motivIndisponibil,
  problemeCos, profilDinFormular, profilRestaurant, randuriProgram, stareRestaurant, valideazaProfil, valoriFormularProfil,
} from "../src/program.js";

// 2026-11-23 e luni, 2026-11-28 e sâmbătă, 2026-11-29 e duminică
const luni = (h, m = 0) => new Date(2026, 10, 23, h, m);
const sambata = (h, m = 0) => new Date(2026, 10, 28, h, m);
const duminica = (h, m = 0) => new Date(2026, 10, 29, h, m);

function program(implicit, exceptii = {}) {
  return Object.fromEntries(ZILE.map((z) => [z, Object.hasOwn(exceptii, z) ? exceptii[z] : implicit]));
}

const NORMAL = { id: "burger-van", descriere: "", telefon: "", pauzat: false, program: program({ deschide: "10:00", inchide: "22:00" }, { duminica: null }) };
const NOAPTE = { id: "sushi-kyo", descriere: "", telefon: "", pauzat: false, program: program({ deschide: "12:00", inchide: "23:00" }, { sambata: { deschide: "18:00", inchide: "02:00" } }) };

test("esteDeschis: fără profil, fără program sau fără ceas, restaurantul e deschis (date vechi)", () => {
  assert.equal(esteDeschis(null, luni(3)), true);
  assert.equal(esteDeschis(undefined, luni(3)), true);
  assert.equal(esteDeschis({ id: "x", pauzat: false, program: null }, luni(3)), true);
  assert.equal(esteDeschis(NORMAL, null), true);
  assert.equal(esteDeschis(NORMAL, NaN), true);
});

test("esteDeschis: în interval, la margini și în afara lui", () => {
  assert.equal(esteDeschis(NORMAL, luni(9, 59)), false);
  assert.equal(esteDeschis(NORMAL, luni(10, 0)), true);
  assert.equal(esteDeschis(NORMAL, luni(15, 30)), true);
  assert.equal(esteDeschis(NORMAL, luni(21, 59)), true);
  assert.equal(esteDeschis(NORMAL, luni(22, 0)), false);
});

test("esteDeschis: o zi închisă (null) e închisă toată ziua", () => {
  assert.equal(esteDeschis(NORMAL, duminica(12)), false);
});

test("esteDeschis: primește și milisecunde", () => {
  assert.equal(esteDeschis(NORMAL, luni(12).getTime()), true);
  assert.equal(esteDeschis(NORMAL, luni(23).getTime()), false);
});

test("esteDeschis: programul care trece de miezul nopții continuă în ziua următoare", () => {
  assert.equal(esteDeschis(NOAPTE, sambata(17, 59)), false);
  assert.equal(esteDeschis(NOAPTE, sambata(18, 0)), true);
  assert.equal(esteDeschis(NOAPTE, sambata(23, 59)), true);
  assert.equal(esteDeschis(NOAPTE, duminica(0, 30)), true);
  assert.equal(esteDeschis(NOAPTE, duminica(1, 59)), true);
  assert.equal(esteDeschis(NOAPTE, duminica(2, 0)), false);
  assert.equal(esteDeschis(NOAPTE, duminica(11, 0)), false);
  assert.equal(esteDeschis(NOAPTE, duminica(12, 0)), true);
});

test("esteDeschis: noaptea de după o zi normală nu e deschisă", () => {
  assert.equal(esteDeschis(NOAPTE, sambata(1, 0)), false);
});

test("esteDeschis: închiderea la 00:00 înseamnă până la miezul nopții", () => {
  const p = { pauzat: false, program: program({ deschide: "18:00", inchide: "00:00" }) };
  assert.equal(esteDeschis(p, luni(23, 59)), true);
  assert.equal(esteDeschis(p, luni(0, 0)), false);
  assert.equal(esteDeschis(p, luni(17, 0)), false);
});

test("esteDeschis: pauza închide restaurantul oricând", () => {
  assert.equal(esteDeschis({ ...NORMAL, pauzat: true }, luni(12)), false);
  assert.equal(esteDeschis({ pauzat: true, program: null }, luni(12)), false);
});

test("esteDeschis: intervalele stricate contează ca zi închisă", () => {
  const p = { pauzat: false, program: program({ deschide: "25:00", inchide: "22:00" }, { marti: { deschide: "10:00", inchide: "10:00" } }) };
  assert.equal(esteDeschis(p, luni(12)), false);
});

test("stareRestaurant și motivIndisponibil", () => {
  assert.deepEqual(stareRestaurant(NORMAL, luni(12)), { deschis: true, motiv: null, eticheta: "Deschis" });
  assert.deepEqual(stareRestaurant(NORMAL, luni(23)), { deschis: false, motiv: "inchis", eticheta: "Închis acum" });
  assert.deepEqual(stareRestaurant({ ...NORMAL, pauzat: true }, luni(12)), { deschis: false, motiv: "pauza", eticheta: "În pauză" });
  assert.equal(motivIndisponibil({ disponibil: false }, null, luni(12)), "Indisponibil");
  assert.equal(motivIndisponibil({}, NORMAL, luni(23)), "Închis acum");
  assert.equal(motivIndisponibil({}, NORMAL, luni(12)), null);
  assert.equal(motivIndisponibil({ disponibil: true }, null, luni(3)), null);
});

test("estePreparatDisponibil: doar `disponibil: false` scoate preparatul", () => {
  assert.equal(estePreparatDisponibil({}), true);
  assert.equal(estePreparatDisponibil({ disponibil: true }), true);
  assert.equal(estePreparatDisponibil({ disponibil: false }), false);
  assert.equal(estePreparatDisponibil({ disponibil: "false" }), true);
});

test("curataProfiluri: Map după slug, câmpurile curățate, intrările stricate sărite", () => {
  const harta = curataProfiluri([
    null, "x", { id: "" }, { id: 5 },
    { id: "burger-van", descriere: 7, telefon: "0722123456", pauzat: "da", program: { luni: { deschide: "10:00", inchide: "22:00" }, marti: "x" }, parola: "y" },
    { id: "burger-van", descriere: "dublură" },
  ]);
  assert.equal(harta.size, 1);
  const p = harta.get("burger-van");
  assert.equal(p.descriere, "");
  assert.equal(p.pauzat, false);
  assert.equal(p.parola, undefined);
  assert.deepEqual(p.program.luni, { deschide: "10:00", inchide: "22:00" });
  assert.equal(p.program.marti, null);
  assert.equal(p.program.duminica, null);
  assert.equal(curataProfiluri({}).size, 0);
  assert.equal(curataProfiluri([{ id: "a", program: [] }]).get("a").program, null);
});

test("profilRestaurant găsește profilul după numele restaurantului", () => {
  const harta = curataProfiluri([NORMAL]);
  assert.equal(profilRestaurant(harta, "Burger Van").id, "burger-van");
  assert.equal(profilRestaurant(harta, "Sushi Kyo"), null);
  assert.equal(profilRestaurant(null, "Burger Van"), null);
});

test("valideazaProfil: date bune trec; telefonul e opțional", () => {
  const valori = valoriFormularProfil(null);
  assert.equal(valideazaProfil(valori), null);
  assert.equal(valideazaProfil({ ...valori, telefon: "0722 123 456" }), null);
});

test("valideazaProfil: descriere prea lungă, telefon greșit, ore lipsă sau egale", () => {
  const valori = valoriFormularProfil(null);
  assert.equal(valideazaProfil({ ...valori, descriere: "a".repeat(201) }).camp, "descriere");
  assert.equal(valideazaProfil({ ...valori, telefon: "123" }).camp, "telefon");
  const faraOra = { ...valori, program: { ...valori.program, marti: { deschis: true, deschide: "", inchide: "22:00" } } };
  assert.deepEqual(valideazaProfil(faraOra), { camp: "program-marti", mesaj: "Marți: scrie ora de deschidere și de închidere." });
  const egale = { ...valori, program: { ...valori.program, joi: { deschis: true, deschide: "10:00", inchide: "10:00" } } };
  assert.equal(valideazaProfil(egale).camp, "program-joi");
  const inchisFaraOre = { ...valori, program: { ...valori.program, joi: { deschis: false, deschide: "", inchide: "" } } };
  assert.equal(valideazaProfil(inchisFaraOre), null);
});

test("valoriFormularProfil și profilDinFormular fac drumul complet înapoi", () => {
  const valori = valoriFormularProfil(NOAPTE);
  assert.equal(valori.program.duminica.deschis, true);
  assert.equal(valori.program.sambata.inchide, "02:00");
  assert.deepEqual(profilDinFormular("sushi-kyo", valori), NOAPTE);
  const cuPauza = profilDinFormular("x", { ...valoriFormularProfil(NORMAL), descriere: "  Burgeri  ", telefon: "0722 123 456", pauzat: true });
  assert.equal(cuPauza.descriere, "Burgeri");
  assert.equal(cuPauza.telefon, "0722123456");
  assert.equal(cuPauza.pauzat, true);
  assert.equal(cuPauza.program.duminica, null);
});

test("randuriProgram: textul fiecărei zile, cu „a doua zi” peste miezul nopții", () => {
  const r = randuriProgram(NOAPTE);
  assert.equal(r.length, 7);
  assert.deepEqual(r[5], { zi: "sambata", eticheta: "Sâmbătă", text: "18:00–02:00 (a doua zi)" });
  assert.equal(randuriProgram(NORMAL)[6].text, "Închis");
  assert.deepEqual(randuriProgram(null), []);
});

test("problemeCos: preparat indisponibil, restaurant în pauză sau închis la momentul ales", () => {
  const harta = curataProfiluri([NORMAL, { ...NOAPTE, pauzat: true }]);
  const linii = [
    { id: "p1", preparat: "Pizza Margherita", restaurant: "Pizzeria Napoli", disponibil: false },
    { id: "p4", preparat: "Burger de vită", restaurant: "Burger Van" },
    { id: "p5", preparat: "Burger cu pui", restaurant: "Burger Van" },
    { id: "p7", preparat: "Platou sushi", restaurant: "Sushi Kyo" },
    { id: "p2", preparat: "Pizza Diavola", restaurant: "Pizzeria Napoli" },
  ];
  const noaptea = problemeCos(linii, harta, luni(23));
  assert.deepEqual(noaptea.map((p) => [p.produsId, p.motiv]), [["p1", "Indisponibil"], ["p4", "Restaurant închis"], ["p5", "Restaurant închis"], ["p7", "Restaurant în pauză"]]);
  assert.equal(mesajeProbleme(noaptea).length, 3);
  const ziua = problemeCos(linii, harta, luni(12));
  assert.deepEqual(ziua.map((p) => p.produsId), ["p1", "p7"]);
  assert.deepEqual(problemeCos(null, harta, luni(12)), []);
});

test("momentVerificare: ora programată de azi sau momentul de acum; null fără ceas", () => {
  const acum = luni(21).getTime();
  assert.equal(momentVerificare("acum", "", acum), acum);
  assert.equal(momentVerificare("programat", "21:45", acum), luni(21, 45).getTime());
  assert.equal(momentVerificare("programat", "", acum), acum);
  assert.equal(momentVerificare("acum", "", null), null);
});

test("o comandă programată în orele restaurantului trece, chiar dacă acum e închis", () => {
  const harta = curataProfiluri([NORMAL]);
  const linii = [{ id: "p4", preparat: "Burger", restaurant: "Burger Van" }];
  const acum = luni(9, 0).getTime();
  assert.equal(problemeCos(linii, harta, momentVerificare("acum", "", acum)).length, 1);
  assert.equal(problemeCos(linii, harta, momentVerificare("programat", "10:30", acum)).length, 0);
});
