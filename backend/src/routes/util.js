// Ajutoare comune pentru routere: 404 cu mesajul resursei și 400 cu erorile validării.
import { cerereGresita, negasit } from "../erori.js";
import { mesajErori } from "../validation.js";

export function gasesteSau404(colectie, id, mesaj) {
  const element = colectie.gaseste(id);
  if (!element) throw negasit(mesaj);
  return element;
}

// Primește rezultatul unui validator; aruncă 400 dacă are erori, altfel întoarce datele curate
export function dateValide({ erori, date }) {
  if (erori.length > 0) throw cerereGresita(mesajErori(erori));
  return date;
}
