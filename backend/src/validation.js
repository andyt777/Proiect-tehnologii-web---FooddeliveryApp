// Punctul de intrare al validării: câte o funcție pentru fiecare resursă, fiecare în src/validation/.
// Toate întorc { erori, date }: `erori` = lista problemelor (goală = în regulă), `date` = doar câmpurile cunoscute, curățate.
export { valideazaComanda } from "./validation/comenzi.js";
export { valideazaPreparat } from "./validation/meniu.js";
export { valideazaLivrator } from "./validation/livratori.js";
export { valideazaRecenzie } from "./validation/recenzii.js";
export { valideazaProfilRestaurant } from "./validation/restaurante.js";
export { mesajErori } from "./validation/comune.js";
