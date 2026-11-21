// Plasarea comenzii pe /cos: validarea datelor (contact, adresă, livrare, programare, plată) și câmpurile noi ale comenzii.
// Funcții pure (fără React), ca validare.js; `acum` e parametru, ca testele să aibă mereu aceeași oră.
// Plata cu card e doar o simulare: nu există câmpuri pentru numărul cardului și nicio tranzacție reală.
import { TIPURI_LIVRARE } from "./constants.js"; // standard, express, ridicare
import { METODE_PLATA, campuriInitiale } from "./stari.js"; // metodele de plată și starea de pornire a comenzii
import { curataTelefon, valideazaNume, valideazaTelefon, valideazaTextAdresa } from "./profil.js"; // aceleași reguli ca în cont

export const AVANS_PROGRAMARE_MIN = 30; // o comandă programată e cu cel puțin 30 de minute în viitor
const PAS_ORA_MIN = 5; // ora minimă propusă e rotunjită la 5 minute
const FORMAT_ORA = /^([01]\d|2[0-3]):([0-5]\d)$/; // „HH:MM”, ce dă <input type="time">

// Ora „HH:MM” de azi, ca dată; null pentru un text greșit
export function momentProgramat(ora, acum = new Date()) { // primește ora din câmp și momentul de acum
  const potrivire = typeof ora === "string" ? ora.match(FORMAT_ORA) : null; // ore și minute
  if (!potrivire) return null; // format greșit
  const data = new Date(acum.getTime()); // copie: nu modificăm data primită
  data.setHours(Number(potrivire[1]), Number(potrivire[2]), 0, 0); // aceeași zi, ora aleasă (fusul orar al browserului)
  return data; // data programată
} // sfârșitul funcției

// Cea mai devreme oră care se poate programa azi („HH:MM”, rotunjită în sus la 5 minute); null dacă azi nu mai e posibil
export function oraMinimaProgramare(acum = new Date()) { // primește momentul de acum
  const minim = new Date(acum.getTime() + AVANS_PROGRAMARE_MIN * 60000); // acum + 30 de minute
  const pas = PAS_ORA_MIN * 60000; // 5 minute, în milisecunde
  const rotunjit = new Date(Math.ceil(minim.getTime() / pas) * pas); // rotunjit în sus
  if (rotunjit.toDateString() !== acum.toDateString()) return null; // a trecut de miezul nopții: nu mai e azi
  return `${String(rotunjit.getHours()).padStart(2, "0")}:${String(rotunjit.getMinutes()).padStart(2, "0")}`; // „HH:MM”
} // sfârșitul funcției

// Verifică datele de plasare; null dacă totul e bine, altfel { camp, mesaj } pentru primul câmp greșit (în ordinea din pagină)
export function valideazaCheckout({ nume, telefon, livrare, adresa, programare, ora, metodaPlata }, acum = new Date()) { // valorile din formular
  const mesajNume = valideazaNume(nume); // numele
  if (mesajNume) return { camp: "nume", mesaj: mesajNume }; // primul câmp
  const mesajTelefon = valideazaTelefon(telefon); // telefonul
  if (mesajTelefon) return { camp: "telefon", mesaj: mesajTelefon }; // al doilea câmp
  if (!TIPURI_LIVRARE.includes(livrare)) return { camp: "livrare", mesaj: "Alege un tip de livrare din listă." }; // doar valorile fixe
  if (livrare !== "ridicare") { // la ridicare nu e nevoie de adresă
    const mesajAdresa = valideazaTextAdresa(adresa); // adresa
    if (mesajAdresa) return { camp: "adresa", mesaj: mesajAdresa }; // lipsă sau greșită
  } // sfârșitul if
  if (programare !== "acum" && programare !== "programat") return { camp: "programare", mesaj: "Alege când vrei comanda." }; // doar cele două variante
  if (programare === "programat") { // o oră anume, azi
    const data = momentProgramat(ora, acum); // ora aleasă, ca dată
    if (!data) return { camp: "ora", mesaj: "Alege ora la care vrei comanda." }; // câmp gol sau greșit
    if (data.getTime() < acum.getTime() + AVANS_PROGRAMARE_MIN * 60000) { // prea devreme (sau deja trecută)
      const minim = oraMinimaProgramare(acum); // cea mai devreme oră posibilă
      return { camp: "ora", mesaj: minim ? `Alege o oră de azi, cel mai devreme ${minim}.` : "Azi nu mai poți programa o comandă. Alege „Cât mai repede”." }; // ce poate face utilizatorul
    } // sfârșitul if
  } // sfârșitul if
  if (!METODE_PLATA.includes(metodaPlata)) return { camp: "plata", mesaj: "Alege cum plătești." }; // doar valorile fixe
  return null; // totul e în regulă
} // sfârșitul funcției

// Câmpurile adăugate fiecărei comenzi plasate din coș (datele sunt deja validate): starea, plata, contactul, adresa, programarea
export function detaliiCheckout({ nume, telefon, livrare, adresa, programare, ora, metodaPlata }, acum = new Date()) { // aceleași valori ca la validare
  return { // obiect nou
    ...campuriInitiale({ livrare, metodaPlata }, acum), // stare, plata, livratorId, timpPreparare, istoric (și livrareStare)
    adresa: livrare === "ridicare" ? null : adresa.trim(), // la ridicare nu există adresă
    contact: { nume: nume.trim(), telefon: curataTelefon(telefon) }, // cine primește comanda
    programataLa: programare === "programat" ? momentProgramat(ora, acum).toISOString() : null, // ora aleasă sau „cât mai repede”
  }; // sfârșitul obiectului
} // sfârșitul funcției
