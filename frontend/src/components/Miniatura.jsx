import { Utensils } from "lucide-react"; // tacâmuri: iconița pentru o categorie necunoscută
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { imaginePreparat } from "../imagini.js"; // fotografia preparatului (sau null)
import styles from "./Miniatura.module.css"; // stilurile miniaturii (CSS Modules)

// Redesign „Pădure”: fotografia mică a unui preparat (coș, sertar, lista de comenzi), cu iconița categoriei când lipsește.
// `imagine` (opțional) suprascrie căutarea după nume: lista de comenzi trimite null pentru comenzile speciale.
export default function Miniatura({ preparat, categorie, imagine }) { // props: numele, categoria și (opțional) fotografia
  const sursa = imagine === undefined ? imaginePreparat(preparat) : imagine; // fotografia aleasă sau cea după nume
  const Iconita = ICONITE_CATEGORIE[categorie] ?? Utensils; // iconița categoriei (tacâmuri dacă e necunoscută)
  if (sursa) return <img className={styles.foto} src={sursa} alt="" width="56" height="56" loading="lazy" decoding="async" />; // decorativă: numele e scris lângă
  return <span className={`thumb ${styles.foto}`} aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>; // iconița, în aceeași cutie
} // sfârșitul componentei
