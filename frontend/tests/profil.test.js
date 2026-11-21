// Teste pentru contul clientului (src/profil.js), rulate cu `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ADRESE_MAXIME, PROFIL_GOL, adaugaAdresa, adresaImplicita, alegeImplicita, citesteProfil, curataTelefon, editeazaAdresa,
  salveazaContact, stergeAdresa, valideazaAdresa, valideazaContact, valideazaNume, valideazaTelefon,
} from "../src/profil.js";

const ACASA = { id: "a1", eticheta: "Acasă", text: "Str. Lalelelor 5, București" };
const BIROU = { id: "a2", eticheta: "Birou", text: "Bd. Unirii 10, București" };

test("citesteProfil: nimic salvat, JSON stricat sau alt tip -> profilul gol", () => {
  for (const text of [null, undefined, "", "{nu e json", "[]", "42", "null"]) assert.deepEqual(citesteProfil(text), PROFIL_GOL, String(text));
});

test("citesteProfil păstrează doar câmpurile și adresele bine formate", () => {
  const profil = citesteProfil(JSON.stringify({
    nume: "Ana Pop", telefon: "0722123456", implicita: "a2", admin: true,
    adrese: [ACASA, BIROU, { ...ACASA, text: "alt text, același id" }, { id: "a3", text: "ab" }, { id: 4, text: "Str. X 1" }, null, { id: "a5", text: "Str. Florilor 1", eticheta: 7 }],
  }));
  assert.deepEqual(profil, { nume: "Ana Pop", telefon: "0722123456", adrese: [ACASA, BIROU], implicita: "a2" });
});

test("citesteProfil: o implicită inexistentă devine prima adresă; tipurile greșite devin text gol; plafonul de adrese", () => {
  const profil = citesteProfil(JSON.stringify({ nume: 5, telefon: ["x"], adrese: [BIROU], implicita: "zzz" }));
  assert.equal(profil.nume, "");
  assert.equal(profil.telefon, "");
  assert.equal(profil.implicita, "a2");
  const multe = Array.from({ length: 15 }, (_, i) => ({ id: `x${i}`, text: `Strada ${i}, Cluj` }));
  assert.equal(citesteProfil(JSON.stringify({ adrese: multe })).adrese.length, ADRESE_MAXIME);
});

test("validarea numelui, a telefonului și a adresei", () => {
  assert.equal(valideazaNume("  "), "Scrie numele tău.");
  assert.match(valideazaNume("A"), /între 2 și 60/);
  assert.equal(valideazaNume("Ana"), null);
  for (const bun of ["0722123456", "0722 123 456", "+40 722-123-456", "0040722123456", "(0722).123.456"]) assert.equal(valideazaTelefon(bun), null, bun);
  for (const rau of ["", "123", "07221234567", "+41722123456", "abc0722123"]) assert.notEqual(valideazaTelefon(rau), null, rau);
  assert.equal(curataTelefon("+40 (722) 123-456"), "+40722123456");
  assert.equal(valideazaContact({ nume: "Ana", telefon: "1" }).camp, "telefon");
  assert.equal(valideazaContact({ nume: "Ana", telefon: "0722123456" }), null);
  assert.equal(valideazaAdresa({ eticheta: "x".repeat(31), text: "Str. A 1" }).camp, "eticheta");
  assert.equal(valideazaAdresa({ eticheta: "", text: "abc" }).camp, "text");
  assert.equal(valideazaAdresa({ text: "Str. Lalelelor 5" }), null);
});

test("adaugaAdresa: prima devine implicită; fără dubluri și fără depășirea plafonului", () => {
  let p = adaugaAdresa(PROFIL_GOL, { eticheta: " Acasă ", text: " Str. Lalelelor 5, București " }, "a1");
  assert.deepEqual(p.adrese, [ACASA]);
  assert.equal(p.implicita, "a1");
  p = adaugaAdresa(p, BIROU, "a2");
  assert.equal(p.implicita, "a1", "implicita nu se schimbă la a doua adresă");
  assert.equal(adaugaAdresa(p, { text: ACASA.text }, "a3"), p, "aceeași adresă de două ori");
  assert.equal(adaugaAdresa(p, { text: "Altă stradă 3" }, "a1"), p, "id dublu");
  assert.equal(PROFIL_GOL.adrese.length, 0, "profilul gol rămâne neschimbat");
});

test("editeazaAdresa, alegeImplicita, stergeAdresa și adresaImplicita", () => {
  let p = { nume: "", telefon: "", adrese: [ACASA, BIROU], implicita: "a1" };
  p = editeazaAdresa(p, "a2", { eticheta: "Serviciu", text: "Bd. Unirii 12, București" });
  assert.deepEqual(p.adrese[1], { id: "a2", eticheta: "Serviciu", text: "Bd. Unirii 12, București" });
  assert.equal(editeazaAdresa(p, "nu-exista", { text: "Str. X 1" }), p);
  p = alegeImplicita(p, "a2");
  assert.equal(adresaImplicita(p).id, "a2");
  assert.equal(alegeImplicita(p, "nu-exista"), p);
  p = stergeAdresa(p, "a2");
  assert.equal(p.implicita, "a1", "ștergerea implicitei alege prima rămasă");
  p = stergeAdresa(p, "a1");
  assert.equal(p.implicita, null);
  assert.equal(adresaImplicita(p), null);
});

test("salveazaContact curăță numele și telefonul", () => {
  assert.deepEqual(salveazaContact(PROFIL_GOL, { nume: " Ana Pop ", telefon: "0722 123 456" }), { nume: "Ana Pop", telefon: "0722123456", adrese: [], implicita: null });
});
