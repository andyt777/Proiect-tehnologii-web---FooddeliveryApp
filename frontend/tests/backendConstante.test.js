// Etapa 9: backend-ul validează cu aceleași valori fixe ca interfața. Cele două nu importă unul din altul
// (pornesc separat), deci testul acesta verifică că backend/src/constants.js nu a rămas în urmă.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as backend from "../../backend/src/constants.js";
import { PREPARAT_MAX, RESTAURANTE, TIPURI_LIVRARE } from "../src/constants.js";
import { CATEGORII } from "../src/categorii.js";
import { METODE_PLATA, MOTIV_MAX, PASI_LIVRARE, PRET_MAXIM, STARI_COMANDA, STARI_PLATA, TIMP_PREPARARE_MAX, TIMP_PREPARARE_MIN } from "../src/stari.js";
import { CUPOANE, COD_MAX } from "../src/cupoane.js";
import { ADRESA_MAX, ADRESA_MIN, NUME_MAX, NUME_MIN, valideazaTelefon } from "../src/profil.js";
import { IMAGINE_MAX, NUME_PREPARAT_MAX, NUME_PREPARAT_MIN, PRET_PREPARAT_MAX } from "../src/meniuAdmin.js";
import { NUME_LIVRATOR_MAX, NUME_LIVRATOR_MIN, numeLivratorDemo } from "../src/livrator.js";
import { NOTA_MAX, NOTA_MIN, TEXT_RECENZIE_MAX } from "../src/recenzii.js";
import { DESCRIERE_MAX, ZILE } from "../src/program.js";
import { RESTAURANTE_INFO } from "../src/restaurante.js";

test("restaurantele, categoriile și tipurile de livrare sunt aceleași în backend", () => {
  assert.deepEqual(backend.RESTAURANTE.map((r) => ({ nume: r.nume, categorie: r.categorie })), RESTAURANTE.map((r) => ({ nume: r.nume, categorie: r.categorie })));
  assert.deepEqual(backend.RESTAURANTE.map((r) => r.slug), RESTAURANTE_INFO.map((r) => r.slug));
  assert.deepEqual(backend.CATEGORII, CATEGORII.map((c) => c.nume));
  assert.deepEqual(backend.TIPURI_LIVRARE, TIPURI_LIVRARE);
});

test("stările comenzii, ale livrării și ale plății sunt aceleași în backend", () => {
  assert.deepEqual(backend.STARI_COMANDA, STARI_COMANDA);
  assert.deepEqual(backend.PASI_LIVRARE, PASI_LIVRARE);
  assert.deepEqual(backend.METODE_PLATA, METODE_PLATA);
  assert.deepEqual(backend.STARI_PLATA, STARI_PLATA);
  assert.deepEqual([backend.MOTIV_MAX, backend.TIMP_PREPARARE_MIN, backend.TIMP_PREPARARE_MAX, backend.PRET_MAXIM], [MOTIV_MAX, TIMP_PREPARARE_MIN, TIMP_PREPARARE_MAX, PRET_MAXIM]);
});

test("limitele formularelor sunt aceleași în backend", () => {
  assert.equal(backend.PREPARAT_MAX, PREPARAT_MAX);
  assert.deepEqual(backend.CODURI_CUPON, CUPOANE.map((c) => c.cod));
  assert.equal(backend.COD_MAX, COD_MAX);
  assert.deepEqual([backend.NUME_MIN, backend.NUME_MAX, backend.ADRESA_MIN, backend.ADRESA_MAX], [NUME_MIN, NUME_MAX, ADRESA_MIN, ADRESA_MAX]);
  assert.deepEqual([backend.NUME_PREPARAT_MIN, backend.NUME_PREPARAT_MAX, backend.PRET_PREPARAT_MAX, backend.IMAGINE_MAX], [NUME_PREPARAT_MIN, NUME_PREPARAT_MAX, PRET_PREPARAT_MAX, IMAGINE_MAX]);
  assert.deepEqual([backend.NUME_LIVRATOR_MIN, backend.NUME_LIVRATOR_MAX], [NUME_LIVRATOR_MIN, NUME_LIVRATOR_MAX]);
  assert.equal(numeLivratorDemo("Ana"), `Ana${backend.SUFIX_LIVRATOR_DEMO}`);
  assert.deepEqual([backend.NOTA_MIN, backend.NOTA_MAX, backend.TEXT_RECENZIE_MAX], [NOTA_MIN, NOTA_MAX, TEXT_RECENZIE_MAX]);
  assert.deepEqual(backend.ZILE, ZILE);
  assert.equal(backend.DESCRIERE_MAX, DESCRIERE_MAX);
});

test("telefonul: backend-ul acceptă exact numerele acceptate de interfață (după curățare)", () => {
  for (const telefon of ["0722123456", "+40722123456", "0040722123456", "072212345", "07221234567", "+4072212345", "abc"]) {
    assert.equal(backend.FORMAT_TELEFON.test(telefon), valideazaTelefon(telefon) === null, telefon);
  }
});
