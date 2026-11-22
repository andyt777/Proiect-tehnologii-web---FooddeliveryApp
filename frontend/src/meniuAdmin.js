// Administrarea meniului din /restaurant: validarea formularului unui preparat și corpul trimis la /meniu.
// Funcții pure (fără React), ca validare.js; testate cu `node --test`. Validarea din browser nu e securitate.
import { CATEGORII } from "./categorii.js";
import { imaginePreparat } from "./imagini.js";

export const NUME_PREPARAT_MIN = 2;
export const NUME_PREPARAT_MAX = 60;
export const PRET_PREPARAT_MAX = 1000;
export const IMAGINE_MAX = 300;

// O imagine acceptată: o cale locală („/img/pizza.webp”) sau o adresă http(s). Altceva (ex. „javascript:”) e refuzat.
export function esteImagineSigura(text) {
  if (typeof text !== "string" || text === "" || text.length > IMAGINE_MAX) return false;
  if (text.startsWith("/")) return !text.startsWith("//") && /^\/[A-Za-z0-9._~\-/]+$/.test(text);
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Fotografia de pe card: cea salvată pe preparat (dacă e sigură), altfel cea locală după nume, altfel null
export function imagineProdus(produs) {
  return esteImagineSigura(produs?.imagine) ? produs.imagine : imaginePreparat(produs?.preparat);
}

// Valorile de pornire ale formularului: gol (cu categoria restaurantului) sau dintr-un preparat existent
export function valoriFormularPreparat(produs, categorieImplicita) {
  if (!produs) return { preparat: "", categorie: categorieImplicita ?? CATEGORII[0].nume, pret: "", imagine: "", disponibil: true };
  return {
    preparat: produs.preparat ?? "",
    categorie: produs.categorie ?? categorieImplicita ?? CATEGORII[0].nume,
    pret: Number.isFinite(produs.pret) ? String(produs.pret) : "",
    imagine: typeof produs.imagine === "string" ? produs.imagine : "",
    disponibil: produs.disponibil !== false,
  };
}

// Validarea: null sau { camp, mesaj } pentru primul câmp greșit.
// `meniu`, `restaurant` și `idEditat` opresc dublurile de nume în același restaurant (comenzile se leagă de meniu prin nume).
export function valideazaPreparat({ preparat, categorie, pret, imagine }, { meniu = [], restaurant = "", idEditat = null } = {}) {
  const nume = typeof preparat === "string" ? preparat.trim() : "";
  if (nume === "") return { camp: "preparat", mesaj: "Scrie numele preparatului." };
  if (nume.length < NUME_PREPARAT_MIN || nume.length > NUME_PREPARAT_MAX) return { camp: "preparat", mesaj: `Numele are între ${NUME_PREPARAT_MIN} și ${NUME_PREPARAT_MAX} de caractere.` };
  if (/ × \d+$/.test(nume)) return { camp: "preparat", mesaj: "Numele nu poate să se termine cu „× număr” (așa scriem cantitatea în comenzi)." };
  const dublura = Array.isArray(meniu) && meniu.some((p) => p?.restaurant === restaurant && p.id !== idEditat && typeof p.preparat === "string" && p.preparat.trim().toLowerCase() === nume.toLowerCase());
  if (dublura) return { camp: "preparat", mesaj: "Restaurantul are deja un preparat cu acest nume." };
  if (!CATEGORII.some((c) => c.nume === categorie)) return { camp: "categorie", mesaj: "Alege o categorie din listă." };
  const textPret = typeof pret === "string" ? pret.trim() : String(pret ?? "");
  if (textPret === "") return { camp: "pret", mesaj: "Scrie prețul, în lei." };
  if (!/^\d+$/.test(textPret)) return { camp: "pret", mesaj: "Prețul e un număr întreg de lei, fără virgulă." };
  const valoare = Number(textPret);
  if (valoare < 1 || valoare > PRET_PREPARAT_MAX) return { camp: "pret", mesaj: `Prețul e între 1 și ${PRET_PREPARAT_MAX} de lei.` };
  const textImagine = typeof imagine === "string" ? imagine.trim() : "";
  if (textImagine !== "" && !esteImagineSigura(textImagine)) return { camp: "imagine", mesaj: "Imaginea e o cale care începe cu „/” (ex. /img/pizza.webp) sau o adresă https://." };
  return null;
}

// Corpul trimis la POST / PATCH /meniu (valorile sunt deja validate). Fără id: îl pune serverul.
export function preparatDinFormular({ preparat, categorie, pret, imagine, disponibil }, restaurant) {
  const textImagine = typeof imagine === "string" ? imagine.trim() : "";
  return {
    preparat: preparat.trim(),
    restaurant,
    categorie,
    pret: Number(String(pret).trim()),
    imagine: textImagine === "" ? null : textImagine,
    disponibil: disponibil !== false,
  };
}
