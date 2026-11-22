import { Link } from "react-router-dom"; // fiecare card duce la pagina restaurantului
import { formatPreparate } from "../rezumat.js"; // „3 preparate”
import { preparateRestaurant } from "../restaurante.js"; // preparatele unui restaurant
import { useMagazin } from "../magazin.js";
import { profilRestaurant, stareRestaurant } from "../program.js";
import styles from "./RestauranteRand.module.css"; // stilurile rândului (CSS Modules)

const SCHELETE = ["r1", "r2", "r3"]; // trei carduri în așteptare

// Redesign „Pădure”: rândul „Restaurante” de pe pagina principală; fiecare card deschide /restaurante/:slug.
// `restaurante` e lista deja filtrată de ComenziPage (categoria și căutarea); `meniu` e tot meniul, pentru numărătoare.
export default function RestauranteRand({ restaurante, meniu, incarcare }) { // props: lista de afișat, meniul și starea de încărcare
  const { profiluri, ceas } = useMagazin();
  if (!incarcare && restaurante.length === 0) return null; // filtrele nu lasă niciun restaurant: starea goală a meniului explică de ce

  return ( // întoarcem JSX
    <section className={styles.section} aria-labelledby="restaurante">{/* secțiunea are numele titlului ei */}
      <div className="section-header">{/* titlul secțiunii */}
        <h2 id="restaurante">Restaurante</h2>{/* textul titlului */}
      </div>
      {incarcare ? ( // meniul nu a sosit încă
        <ul className={styles.rand} aria-hidden="true">{/* doar decor */}
          {SCHELETE.map((id) => ( // un card în așteptare pentru fiecare cheie
            <li key={id} className={styles.card}><span className={`${styles.foto} skeleton`} /><span className="skeleton skeleton-line" /></li>// aceeași formă ca un card real
          ))}{/* sfârșitul map-ului */}
        </ul>
      ) : ( // datele au sosit
        <ul className={styles.rand}>{/* rândul de carduri; pe telefon se derulează orizontal */}
          {restaurante.map((r) => { // un card pentru fiecare restaurant
            const stare = stareRestaurant(profilRestaurant(profiluri, r.nume), ceas);
            return (
            <li key={r.slug}>{/* slug-ul e unic */}
              <Link to={`/restaurante/${r.slug}`} className={styles.card}>{/* tot cardul e un link */}
                {!stare.deschis && <span className={styles.eticheta}>{stare.eticheta}</span>}
                <img className={styles.foto} src={r.imagine} alt="" width="720" height="540" loading="lazy" decoding="async" />{/* decorativă: numele e scris dedesubt */}
                <span className={styles.nume}>{r.nume}</span>{/* numele restaurantului (textul linkului) */}
                <span className={styles.detalii}>{r.bucatarie}, {formatPreparate(preparateRestaurant(meniu, r.nume).length)}</span>{/* ex. „Italiană, 3 preparate” */}
              </Link>
            </li>
            );
          })}
        </ul>
      )}{/* sfârșitul randării condiționate */}
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
