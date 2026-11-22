// Pachetul B: comutatorul de roluri din antet (Client, Restaurant, Livrator, Admin).
// E doar o demonstrație: oricine poate alege orice rol, nu există conturi, parole sau verificări pe server.
// Rolul ales stă în localStorage (cheia „rol”); textul de acolo nu e de încredere, deci trece prin citesteRol.
// Funcții pure (fără React sau localStorage), testate cu `node --test`.
import { ROLURI } from "./stari.js"; // rolurile cunoscute de tabelul tranzițiilor

export const ROL_IMPLICIT = "client"; // fără nimic salvat, aplicația pornește ca pentru client

// Textele afișate pentru fiecare rol
export const ETICHETE_ROL = Object.freeze({ client: "Client", restaurant: "Restaurant", livrator: "Livrator", admin: "Admin" }); // cheia = valoarea salvată

// Pagina fiecărui rol; clientul rămâne pe pagina principală
export const RUTE_ROL = Object.freeze({ client: "/", restaurant: "/restaurant", livrator: "/livrator", admin: "/admin" }); // cheia = rolul

// true pentru un rol cunoscut
export function esteRol(valoare) { // primește orice valoare
  return ROLURI.includes(valoare); // doar cele patru texte fixe
} // sfârșitul funcției

// Rolul salvat în localStorage (text JSON, ex. "\"admin\""); orice altceva înseamnă rolul implicit
export function citesteRol(text) { // primește textul brut (sau null)
  if (typeof text !== "string") return ROL_IMPLICIT; // nimic salvat
  let valoare; // rezultatul parsării
  try { // JSON.parse aruncă la text invalid
    valoare = JSON.parse(text); // ex. "admin"
  } catch { // text stricat
    return ROL_IMPLICIT; // pornim ca client
  } // sfârșitul try/catch
  return esteRol(valoare) ? valoare : ROL_IMPLICIT; // doar un rol cunoscut
} // sfârșitul funcției
