// Pachetul C: rândul „Pentru tine” de pe pagina principală. Reguli simple, din istoricul comenzilor (nu e AI):
// 1. categoria din care ai comandat cele mai multe preparate -> preparatele ei din meniu pe care nu le-ai comandat încă;
// 2. dacă le-ai încercat pe toate: preparatele din meniu pe care le-ai comandat cel mai des.
// Fără istoric, nu recomandăm nimic (rândul nu apare). Comenzile anulate și respinse nu contează.
// Funcții pure (fără React), testate cu `node --test`.
import { stareComanda } from "./stari.js"; // starea derivată (anulată / respinsă)

export const RECOMANDARI_MAX = 4; // câte preparate arată rândul

const FARA_RECOMANDARI = Object.freeze({ preparate: Object.freeze([]), regula: null, categorie: null }); // rezultatul gol

// „Pizza Diavola × 2” -> { baza: „Pizza Diavola”, cantitate: 2 }; fără sufix, cantitatea e 1 (forma din cosInComenzi)
export function despartePreparat(preparat) { // primește numele din comandă
  if (typeof preparat !== "string") return { baza: "", cantitate: 0 }; // nume lipsă: nu contează
  const potrivire = preparat.match(/^(.*) × (\d+)$/); // sufixul cantității
  return potrivire ? { baza: potrivire[1], cantitate: Number(potrivire[2]) } : { baza: preparat, cantitate: 1 }; // numele de bază și cantitatea
} // sfârșitul funcției

// Recomandările: { preparate, regula: „categorie” | „populare” | null, categorie }
export function recomandari(comenzi, meniu, max = RECOMANDARI_MAX) { // primește comenzile, meniul și câte vrem
  if (!Array.isArray(comenzi) || !Array.isArray(meniu) || meniu.length === 0) return FARA_RECOMANDARI; // nimic de recomandat
  const pePreparat = new Map(); // numele de bază -> câte bucăți
  const peCategorie = new Map(); // categoria -> câte bucăți
  for (const c of comenzi) { // fiecare comandă o dată
    if (!c || typeof c !== "object") continue; // intrare ciudată
    const stare = stareComanda(c); // starea derivată
    if (stare === "anulata" || stare === "respinsa") continue; // nu au ajuns la client
    const { baza, cantitate } = despartePreparat(c.preparat); // numele și cantitatea
    if (baza === "" || cantitate <= 0) continue; // fără nume, fără număr
    pePreparat.set(baza, (pePreparat.get(baza) ?? 0) + cantitate); // bucățile preparatului
    if (typeof c.categorie === "string") peCategorie.set(c.categorie, (peCategorie.get(c.categorie) ?? 0) + cantitate); // și ale categoriei
  } // sfârșitul buclei
  if (pePreparat.size === 0) return FARA_RECOMANDARI; // fără istoric
  const categorii = [...new Set(meniu.map((p) => p.categorie))]; // categoriile din meniu, în ordinea lor (la egalitate câștigă prima)
  let favorita = null; // categoria cea mai comandată
  let maxim = 0; // câte bucăți are
  for (const categorie of categorii) { // în ordinea din meniu
    const numar = peCategorie.get(categorie) ?? 0; // bucățile ei
    if (numar > maxim) { favorita = categorie; maxim = numar; } // strict mai mare: egalitatea păstrează prima
  } // sfârșitul buclei
  if (favorita !== null) { // regula 1
    const noi = meniu.filter((p) => p.categorie === favorita && !pePreparat.has(p.preparat)); // preparatele neîncercate din categoria ei
    if (noi.length > 0) return { preparate: noi.slice(0, max), regula: "categorie", categorie: favorita }; // le arătăm
  } // sfârșitul if
  const populare = meniu.filter((p) => pePreparat.has(p.preparat)).sort((a, b) => pePreparat.get(b.preparat) - pePreparat.get(a.preparat)); // regula 2: cele mai comandate (sort stabil: la egalitate, ordinea din meniu)
  if (populare.length === 0) return FARA_RECOMANDARI; // istoricul nu are preparate din meniu (ex. doar comenzi speciale)
  return { preparate: populare.slice(0, max), regula: "populare", categorie: null }; // le arătăm
} // sfârșitul funcției

// Rândul de sub titlu, care spune regula folosită; "" când nu există recomandări
export function explicatieRecomandari(rezultat) { // primește rezultatul lui recomandari
  if (rezultat?.regula === "categorie") return `Comanzi cel mai des din categoria ${rezultat.categorie}, așa că îți arătăm preparatele ei pe care nu le-ai încercat încă.`; // regula 1
  if (rezultat?.regula === "populare") return "Ai încercat deja tot din categoria ta preferată, așa că îți arătăm preparatele pe care le-ai comandat cel mai des."; // regula 2
  return ""; // fără recomandări
} // sfârșitul funcției
