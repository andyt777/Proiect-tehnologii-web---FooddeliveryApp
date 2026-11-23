// Valorile fixe ale aplicației, aceleași ca în frontend (constants.js, livrare.js, stari.js, categorii.js,
// meniuAdmin.js, profil.js, program.js, recenzii.js, livrator.js, cupoane.js).
// Backend-ul nu importă din frontend: cele două pornesc separat. Testul frontend/tests/backendConstante.test.js
// verifică că valorile au rămas identice.

export const RESTAURANTE = Object.freeze([
  Object.freeze({ nume: "Pizzeria Napoli", categorie: "Pizza", slug: "pizzeria-napoli" }),
  Object.freeze({ nume: "Burger Van", categorie: "Burgers", slug: "burger-van" }),
  Object.freeze({ nume: "Sushi Kyo", categorie: "Asian", slug: "sushi-kyo" }),
]);
export const CATEGORII = Object.freeze(["Pizza", "Burgers", "Asian"]);
export const TIPURI_LIVRARE = Object.freeze(["standard", "express", "ridicare"]);

// Comenzi
export const PREPARAT_MAX = 60;
export const PREPARAT_COMANDA_MAX = 100;
export const STARI_COMANDA = Object.freeze(["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata", "anulata", "respinsa"]);
export const PASI_LIVRARE = Object.freeze(["neasignata", "asignata", "spre_restaurant", "preluata", "spre_client", "livrata"]);
export const METODE_PLATA = Object.freeze(["card_simulat", "numerar"]);
export const STARI_PLATA = Object.freeze(["neplatita", "platita", "rambursata"]);
export const MOTIV_MAX = 200;
export const TIMP_PREPARARE_MIN = 5;
export const TIMP_PREPARARE_MAX = 180;
export const PRET_MAXIM = 10000;
export const ISTORIC_MAXIM = 200;
export const CODURI_CUPON = Object.freeze(["SAVORO10", "PRIMA20"]);
export const COD_MAX = 20;

// Contact și adresă (profil.js)
export const NUME_MIN = 2;
export const NUME_MAX = 60;
export const ADRESA_MIN = 5;
export const ADRESA_MAX = 160;
export const FORMAT_TELEFON = /^(\+40|0040|0)\d{9}$/;

// Meniu (meniuAdmin.js)
export const NUME_PREPARAT_MIN = 2;
export const NUME_PREPARAT_MAX = 60;
export const PRET_PREPARAT_MAX = 1000;
export const IMAGINE_MAX = 300;

// Livratori (livrator.js); numele salvat primește sufixul „ (livrator demo)”
export const NUME_LIVRATOR_MIN = 2;
export const NUME_LIVRATOR_MAX = 40;
export const SUFIX_LIVRATOR_DEMO = " (livrator demo)";

// Recenzii (recenzii.js)
export const NOTA_MIN = 1;
export const NOTA_MAX = 5;
export const TEXT_RECENZIE_MAX = 500;

// Profilul restaurantului (program.js)
export const ZILE = Object.freeze(["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"]);
export const DESCRIERE_MAX = 200;
export const FORMAT_ORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
