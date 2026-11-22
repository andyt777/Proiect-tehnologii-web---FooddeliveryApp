// Pachetul B: corpurile PATCH cerute de paginile /restaurant, /livrator și /admin, cu verificarea rolului înainte.
// Paginile citesc întâi comanda proaspătă de la server, apoi apelează funcțiile de aici: dacă între timp
// altcineva a schimbat-o (ex. clientul a anulat), primesc o eroare cu mesaj clar în loc de un PATCH greșit.
// Doar învelesc funcțiile din stari.js (care construiesc corpul); nu se construiește nimic de mână.
// Funcții pure, testate cu `node --test`. Ca tot ce e în browser, nu sunt securitate.
import { ETICHETE_PAS_LIVRARE, ETICHETE_STARE, aplicaPasLivrare, aplicaTranzitie, etichetaStare, poateAvansaLivrarea, poateTrece } from "./stari.js"; // regulile stărilor

// Corpul PATCH pentru o tranziție a comenzii, doar dacă rolul o poate face acum; altfel aruncă o eroare explicată
export function patchTranzitie(comanda, stareNoua, rol, acum = new Date(), detalii = {}) { // primește comanda proaspătă, starea dorită, rolul, momentul și detaliile
  if (!poateTrece(comanda, stareNoua, rol)) { // trecerea nu mai e permisă
    throw new Error(`Comanda e acum „${etichetaStare(comanda)}” și nu mai poate trece în „${ETICHETE_STARE[stareNoua] ?? stareNoua}”. Lista arată starea nouă.`); // ce s-a întâmplat
  } // sfârșitul if
  return aplicaTranzitie(comanda, stareNoua, acum, detalii); // corpul, din stari.js
} // sfârșitul funcției

// Corpul PATCH pentru un pas al livrării, doar dacă pasul e permis acum; altfel aruncă o eroare explicată
export function patchPasLivrare(comanda, pasNou, acum = new Date(), extra = {}) { // primește comanda proaspătă, pasul dorit, momentul și { livratorId }
  if (!poateAvansaLivrarea(comanda, pasNou)) { // pasul nu mai e permis
    throw new Error(`Livrarea nu mai poate trece la „${ETICHETE_PAS_LIVRARE[pasNou] ?? pasNou}”: comanda e acum „${etichetaStare(comanda)}”. Lista arată starea nouă.`); // ce s-a întâmplat
  } // sfârșitul if
  return aplicaPasLivrare(comanda, pasNou, acum, extra); // corpul, din stari.js
} // sfârșitul funcției
