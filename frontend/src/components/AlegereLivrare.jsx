import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // textele pentru tipurile de livrare
import { TIPURI_LIVRARE } from "../constants.js"; // ["standard", "express", "ridicare"], în ordinea din livrare.js
import styles from "./AlegereLivrare.module.css"; // stilurile alegerii (CSS Modules)

// Redesign „Pădure”: alegerea tipului de livrare, ca grup de butoane radio controlate.
// Aceeași valoare (din starea comună) în hero-ul paginii principale și pe pagina coșului.
// varianta = „compact” (pe verde, în hero: trei segmente și durata dedesubt) sau „lista” (pe /cos: câte un rând cu durata).
export default function AlegereLivrare({ valoare, onAlege, nume, varianta = "lista" }) { // nume = atributul name, unic pe pagină
  const compact = varianta === "compact"; // hero-ul
  return ( // întoarcem JSX
    <fieldset className={compact ? `${styles.grup} ${styles.compact}` : styles.grup}>{/* grupul de butoane radio */}
      <legend className={styles.legenda}>{compact ? "Cum primești comanda" : "Livrare"}</legend>{/* numele grupului, citit înaintea fiecărei opțiuni */}
      <div className={styles.optiuni}>{/* opțiunile */}
        {TIPURI_LIVRARE.map((tip) => ( // o opțiune pentru fiecare tip
          <label key={tip} className={styles.optiune}>{/* tot rândul e clicabil */}
            <input type="radio" name={nume} value={tip} checked={valoare === tip} onChange={() => onAlege(tip)} />{/* radio controlat */}
            <span className={styles.text}>{/* textele opțiunii */}
              <span className={styles.eticheta}>{ETICHETE_LIVRARE[tip]}</span>{/* ex. „Express” */}
              {!compact && <span className={styles.durata}>{DURATE_LIVRARE[tip]}</span>}{/* ex. „Sosește în ~20 min” */}
            </span>
          </label>
        ))}{/* sfârșitul map-ului */}
      </div>
      {compact && <p className={styles.durataCompact}>{DURATE_LIVRARE[valoare]}</p>}{/* durata opțiunii alese, sub segmente */}
    </fieldset>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
