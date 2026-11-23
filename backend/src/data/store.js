// Datele aplicației, în memorie. Pornesc dintr-o copie a seed.json (db.json-ul din Etapa 8), deci fiecare
// repornire (și fiecare app creat în teste) începe de la aceleași date.
import { readFileSync } from "node:fs";
import { creeazaColectie, idCuPrefix, idNumeric } from "./colectie.js";
import { creeazaRegistruIdempotenta } from "../idempotenta.js";

const SEED = JSON.parse(readFileSync(new URL("./seed.json", import.meta.url), "utf8"));

export function creeazaStore(seed = SEED) {
  const date = structuredClone(seed);
  return {
    comenzi: creeazaColectie(date.comenzi, idNumeric(date.comenzi)),
    meniu: creeazaColectie(date.meniu, idCuPrefix("p", date.meniu)),
    livratori: creeazaColectie(date.livratori, idNumeric(date.livratori)),
    recenzii: creeazaColectie(date.recenzii, idNumeric(date.recenzii)),
    restaurante: creeazaColectie(date.restaurante, () => {
      throw new Error("Restaurantele primesc id-ul (slug-ul) de la client");
    }),
    // cheile Idempotency-Key ale comenzilor deja create (vezi idempotenta.js)
    cheiComenzi: creeazaRegistruIdempotenta(),
  };
}
