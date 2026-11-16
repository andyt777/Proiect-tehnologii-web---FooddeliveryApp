import { LayoutGrid } from "lucide-react"; // iconița cardului „Toate”
import { CATEGORII, potrivesteCategoria } from "../categorii.js"; // lista de categorii și filtrul
import { IMAGINI_CATEGORIE } from "../imagini.js"; // fotografia fiecărei categorii
import { formatPreparate } from "../rezumat.js"; // „3 preparate”
import styles from "./CategoriiCarduri.module.css"; // Etapa 8: stilurile cardurilor (CSS Modules)

const SCHELETE = ["toate", "s1", "s2", "s3"]; // patru carduri gri: „Toate” + cele trei categorii

// „Ce poftești azi?”: un card „Toate” și câte un card cu fotografie pentru fiecare categorie.
// Fiecare card e un buton comutator (aria-pressed); ComenziPage ține categoria aleasă și filtrează meniul.
export default function CategoriiCarduri({ meniu, activa, onAlege, incarcare }) { // meniu = tot meniul (nefiltrat), activa = numele categoriei sau null
  return ( // întoarcem JSX
    <section className={styles.section} aria-labelledby="categorii-titlu">{/* secțiunea are numele titlului ei */}
      <div className="section-header">{/* titlul, la fel ca la celelalte secțiuni */}
        <h2 id="categorii-titlu">Ce poftești azi?</h2>{/* textul titlului */}
        {!incarcare && <span className="section-meta">alege o categorie</span>}{/* indicația, doar după încărcare */}
      </div>
      {incarcare ? ( // meniul nu a sosit încă: nu știm câte preparate are fiecare categorie
        <ul className={styles.carduri} aria-hidden="true">{/* doar decor; anunțul „se încarcă” e în altă parte */}
          {SCHELETE.map((id) => ( // un card gri pentru fiecare cheie
            <li key={id}><span className={`${styles.card} skeleton`} /></li>// aceeași cutie ca un card real
          ))}{/* sfârșitul map-ului */}
        </ul>
      ) : ( // datele au sosit
        <ul className={styles.carduri}>{/* lista de carduri; pe telefon se derulează orizontal */}
          <li>{/* cardul „Toate” */}
            <button // buton comutator
              type="button" // buton simplu
              className={`${styles.card} ${styles.toate}`} // fără fotografie, pe fundal bleu deschis
              aria-pressed={activa === null} // apăsat când nu e aleasă nicio categorie
              onClick={() => onAlege(null)} // „Toate” anulează filtrul
            >
              <LayoutGrid className={styles.iconita} size={22} aria-hidden="true" />{/* iconiță decorativă */}
              <span className={styles.nume}>Toate</span>{/* numele cardului */}
              <span className={styles.numar}>{formatPreparate(meniu.length)}</span>{/* tot meniul */}
            </button>
          </li>
          {CATEGORII.map((cat) => { // un card pentru fiecare categorie
            const numar = meniu.filter((p) => potrivesteCategoria(p, cat.nume)).length; // câte preparate are categoria, din tot meniul
            const apasat = activa === cat.nume; // e categoria aleasă acum?
            return ( // JSX-ul cardului
              <li key={cat.nume}>{/* numele e unic, deci bun ca key */}
                <button // buton comutator
                  type="button" // buton simplu
                  className={`${styles.card} ${styles.foto}`} // card cu fotografie
                  aria-pressed={apasat} // anunță dacă filtrul e activ
                  onClick={() => onAlege(apasat ? null : cat.nume)} // al doilea clic pe aceeași categorie o anulează
                >
                  <img // fotografia categoriei
                    className={styles.img} // acoperă tot cardul (object-fit)
                    src={IMAGINI_CATEGORIE[cat.nume]} // ex. „/img/pizza-diavola.webp”
                    alt="" // decorativă: numele categoriei e scris pe card
                    width="720" // dimensiunile reale, ca browserul să rezerve locul
                    height="540" // la fel
                    loading="lazy" // se încarcă doar când ajunge aproape de ecran
                    decoding="async" // decodarea nu blochează desenarea paginii
                  />
                  <span className={styles.nume}><cat.Icon size={18} aria-hidden="true" />{cat.nume}</span>{/* iconița și numele */}
                  <span className={styles.numar}>{formatPreparate(numar)}</span>{/* ex. „3 preparate” */}
                </button>
              </li>
            ); // sfârșitul JSX-ului cardului
          })}{/* sfârșitul map-ului */}
        </ul>
      )}{/* sfârșitul randării condiționate */}
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
