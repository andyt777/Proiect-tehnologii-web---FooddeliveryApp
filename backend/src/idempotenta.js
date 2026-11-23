// Protecția la comenzi duplicate: antetul „Idempotency-Key” la POST /comenzi.
// Prima cerere cu o cheie creează comanda; o cerere repetată cu aceeași cheie și același corp primește înapoi
// exact răspunsul de atunci (201, aceeași comandă, antetul „Idempotent-Replayed: true”), fără o comandă nouă.
// Aceeași cheie cu alt corp -> 409. Cheile se țin în memorie, cât trăiește serverul (cel mult CHEI_MAXIM, cele vechi ies primele).
// Doar cererile reușite păstrează cheia: după un 400 sau 409, clientul poate corecta și retrimite cu aceeași cheie.
import { cerereGresita, conflict } from "./erori.js";

export const ANTET_CHEIE = "Idempotency-Key";
export const CHEI_MAXIM = 1000;
const FORMAT_CHEIE = /^[\x21-\x7E]{1,200}$/;

// Cheia din antet; null dacă lipsește, 400 dacă are alt format
export function cheieDinCerere(req) {
  const cheie = req.get(ANTET_CHEIE);
  if (cheie === undefined) return null;
  if (!FORMAT_CHEIE.test(cheie)) throw cerereGresita(`${ANTET_CHEIE} trebuie să aibă între 1 și 200 de caractere vizibile, fără spații.`);
  return cheie;
}

export function creeazaRegistruIdempotenta(maxim = CHEI_MAXIM) {
  const intrari = new Map();
  return {
    // Răspunsul salvat pentru cheie (o copie) sau null dacă cheia e nouă
    cauta(cheie, corp) {
      const intrare = intrari.get(cheie);
      if (!intrare) return null;
      if (intrare.amprenta !== JSON.stringify(corp)) throw conflict(`Cheia ${ANTET_CHEIE} a fost deja folosită pentru o altă comandă. Trimite o cheie nouă pentru o comandă nouă.`);
      return structuredClone(intrare.raspuns);
    },
    salveaza(cheie, corp, raspuns) {
      intrari.set(cheie, { amprenta: JSON.stringify(corp), raspuns: structuredClone(raspuns) });
      while (intrari.size > maxim) intrari.delete(intrari.keys().next().value);
    },
  };
}
