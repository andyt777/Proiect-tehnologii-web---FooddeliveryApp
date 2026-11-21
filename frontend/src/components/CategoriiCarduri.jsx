import { LayoutGrid } from "lucide-react"; // iconița plăcii „Toate”
import { CATEGORII, potrivesteCategoria } from "../categorii.js"; // lista de categorii și filtrul
import { IMAGINI_CATEGORIE } from "../imagini.js"; // fotografia fiecărei categorii
import { formatPreparate } from "../rezumat.js"; // „3 preparate”
import styles from "./CategoriiCarduri.module.css"; // Etapa 8: stilurile plăcilor (CSS Modules)

const SCHELETE = ["toate", "s1", "s2", "s3"]; // patru plăci în așteptare: „Toate” + cele trei categorii

// Rândul de categorii: „Toate” + câte o placă cu fotografie pentru fiecare categorie.
// Fiecare placă e un buton comutator (aria-pressed); ComenziPage ține categoria aleasă și filtrează restaurantele și meniul.
// Redesign „Pădure”: fotografie pătrată deasupra, numele dedesubt (ca un rând de descoperire), nu text peste fotografie.
export default function CategoriiCarduri({ meniu, activa, onAlege, incarcare }) { // meniu = tot meniul (nefiltrat), activa = numele categoriei sau null
  return ( // întoarcem JSX
    <section className={styles.section} aria-labelledby="categorii-titlu">{/* secțiunea are numele titlului ei */}
      <h2 id="categorii-titlu" className="sr-only">Categorii</h2>{/* titlul, doar pentru cititoare: plăcile se explică singure */}
      {incarcare ? ( // meniul nu a sosit încă
        <ul className={styles.rand} aria-hidden="true">{/* doar decor; anunțul „se încarcă” e în altă parte */}
          {SCHELETE.map((id) => ( // o placă în așteptare pentru fiecare cheie
            <li key={id} className={styles.schelet}><span className={`${styles.foto} skeleton`} /><span className="skeleton skeleton-line" /></li>// aceeași formă ca o placă reală
          ))}{/* sfârșitul map-ului */}
        </ul>
      ) : ( // datele au sosit
        <ul className={styles.rand}>{/* rândul; pe telefon se derulează orizontal */}
          <li>{/* placa „Toate” */}
            <button type="button" className={styles.placa} aria-pressed={activa === null} onClick={() => onAlege(null)}>{/* „Toate” anulează filtrul */}
              <span className={`${styles.foto} ${styles.toate}`} aria-hidden="true"><LayoutGrid size={30} /></span>{/* iconița, pe verde */}
              <span className={styles.nume}>Toate</span>{/* numele plăcii */}
              <span className={styles.numar}>{formatPreparate(meniu.length)}</span>{/* tot meniul */}
            </button>
          </li>
          {CATEGORII.map((cat) => { // o placă pentru fiecare categorie
            const numar = meniu.filter((p) => potrivesteCategoria(p, cat.nume)).length; // câte preparate are categoria
            const apasat = activa === cat.nume; // e categoria aleasă acum?
            return ( // JSX-ul plăcii
              <li key={cat.nume}>{/* numele e unic, deci bun ca key */}
                <button type="button" className={styles.placa} aria-pressed={apasat} onClick={() => onAlege(apasat ? null : cat.nume)}>{/* al doilea clic anulează filtrul */}
                  <img className={styles.foto} src={IMAGINI_CATEGORIE[cat.nume]} alt="" width="720" height="540" loading="lazy" decoding="async" />{/* decorativă: numele e scris dedesubt */}
                  <span className={styles.nume}>{cat.nume}</span>{/* ex. „Pizza” */}
                  <span className={styles.numar}>{formatPreparate(numar)}</span>{/* ex. „3 preparate” */}
                </button>
              </li>
            ); // sfârșitul JSX-ului plăcii
          })}{/* sfârșitul map-ului */}
        </ul>
      )}{/* sfârșitul randării condiționate */}
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
