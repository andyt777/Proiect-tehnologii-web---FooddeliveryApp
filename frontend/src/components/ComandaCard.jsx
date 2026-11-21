import { Link } from "react-router-dom"; // Etapa 8: titlul duce la pagina de detaliu, fără reîncărcare
import { CircleCheck, CircleX, Clock, Trash2, Zap } from "lucide-react"; // iconițe: bifă, X (oprită), ceas, fulger (Express), coș de gunoi
import Miniatura from "./Miniatura.jsx"; // fotografia mică (sau iconița categoriei)
import { imagineComanda } from "../imagini.js"; // fotografia preparatului comandat (sau null)
import { ETICHETE_LIVRARE } from "../livrare.js"; // texte pentru tipul livrării
import { formatLei } from "../format.js"; // formatarea prețului
import { arePret } from "../rezumat.js"; // Etapa 7: comanda specială are pret: null până la confirmare
import { etichetaStare, stareComanda } from "../stari.js"; // fluxul complet: starea comenzii (cu valorile implicite pentru comenzile vechi)
import styles from "./ComandaCard.module.css"; // Etapa 8: stilurile cardului (CSS Modules)

// O singură comandă din listă, primită prin props.
// Etapa 7: atributele data-testid sunt pe <li>, titlu, checkbox și butonul de ștergere.
// Etapa 8: titlul (h3, data-testid="item-title") conține linkul spre /comenzi/:id (data-testid="item-link").
// Redesign „Pădure”: rând simplu, fără puncte de legătură; doar „Express” primește culoare (șofran).
export default function ComandaCard({ comanda, onToggle, onDelete }) { // destructurăm props: datele comenzii și cele două callback-uri
  const imagine = comanda.speciala ? null : imagineComanda(comanda); // Etapa 7: preparatul cerut special nu are fotografie proprie
  const stare = stareComanda(comanda); // fluxul complet: „plasata”, „in_preparare”, „anulata”...
  const oprita = stare === "anulata" || stare === "respinsa"; // ieșirile laterale
  const IconitaStare = comanda.livrata ? CircleCheck : oprita ? CircleX : Clock; // forma spune starea, nu doar textul

  return ( // întoarcem JSX
    <li // fiecare card e un element de listă
      className={comanda.livrata || oprita ? `${styles.card} ${styles.done}` : styles.card} // „done” dacă e livrată sau oprită
      style={{ viewTransitionName: `comanda-${comanda.id}` }} // nume unic per comandă: rândul alunecă la noua poziție
      data-testid="item" // Etapa 7: reperul cardului pentru verificarea automată
      data-id={comanda.id} // id-ul de la server: verificarea găsește exact această comandă
    >
      <Miniatura preparat={comanda.preparat} categorie={comanda.categorie} imagine={imagine} />{/* fotografia mică */}
      <div className={styles.main}>{/* titlul și detaliile */}
        <h3 data-testid="item-title" className={styles.titlu}>{/* titlul cardului; Etapa 7: data-testid rămâne pe h3 */}
          <Link to={`/comenzi/${comanda.id}`} className={styles.titleLink} data-testid="item-link">{/* Etapa 8: deschide pagina comenzii */}
            {comanda.preparat}{/* numele preparatului */}
          </Link>
        </h3>
        <p className={styles.meta}>{/* detaliile, fără separatoare între ele */}
          <span>{comanda.restaurant}</span>{/* numele restaurantului */}
          {comanda.livrare === "express" ? ( // singurul tip de livrare cu culoare
            <span className="tag tag-express"><Zap size={13} aria-hidden="true" />{ETICHETE_LIVRARE.express}</span> // „Express”, pe șofran
          ) : ( // standard sau ridicare: text simplu
            <span>{ETICHETE_LIVRARE[comanda.livrare] ?? comanda.livrare}</span> // ex. „Ridicare personală”
          )}{/* sfârșitul randării condiționate */}
          {comanda.speciala && <span className="tag tag-speciala">Comandă specială</span>}{/* Etapa 7: comanda făcută din formular */}
          <span className={oprita ? `${styles.eta} ${styles.oprita}` : styles.eta}>{/* fluxul complet: starea comenzii */}
            <IconitaStare size={15} aria-hidden="true" />{/* bifă, X sau ceas */}
            {etichetaStare(comanda)}{/* ex. „În preparare”, „Gata de ridicare”, „Anulată” */}
          </span>
        </p>
      </div>
      {arePret(comanda) ? ( // prețul e cunoscut
        <span className={`price ${styles.pret}`}>{formatLei(comanda.pret)}</span> // prețul formatat
      ) : ( // Etapa 7: comanda specială, prețul îl stabilește restaurantul
        <span className={`price price-asteptare ${styles.pret}`}>Preț la confirmare</span> // fără preț inventat
      )}{/* sfârșitul randării condiționate */}
      <div className={styles.side}>{/* acțiunile */}
        <label className={styles.status}>{/* label-ul face tot textul clicabil pentru checkbox */}
          <input // checkbox controlat de React
            type="checkbox" // tipul inputului
            checked={comanda.livrata} // Etapa 7: se schimbă abia după răspunsul serverului
            onChange={() => onToggle(comanda.id)} // ComenziPage trimite PATCH și apoi actualizează state-ul
            data-testid="item-toggle" // Etapa 7: reperul bifei
          />
          Livrată<span className="sr-only">: {comanda.preparat}</span>{/* textul ascuns spune despre ce comandă e vorba */}
        </label>
        <button // butonul de ștergere
          type="button" // buton simplu
          className="btn-danger" // stil de acțiune periculoasă
          onClick={() => onDelete(comanda.id)} // Etapa 7: șterge direct; greșeala se repară cu „Anulează”
          aria-label={`Șterge ${comanda.preparat}`} // nume accesibil, butonul are doar iconiță
          title="Șterge comanda" // tooltip la hover
          data-testid="item-delete" // Etapa 7: reperul butonului de ștergere
        >
          <Trash2 size={18} aria-hidden="true" />{/* iconița coș de gunoi */}
        </button>
      </div>
    </li>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
