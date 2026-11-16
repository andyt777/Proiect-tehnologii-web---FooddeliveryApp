import { Link } from "react-router-dom"; // Etapa 8: titlul duce la pagina de detaliu, fără reîncărcare
import { CircleCheck, Clock, Sparkles, Trash2, Utensils } from "lucide-react"; // iconițe: bifă, ceas, steluțe (comandă specială), coș de gunoi, tacâmuri (categorie necunoscută)
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { imagineComanda } from "../imagini.js"; // fotografia preparatului comandat (sau null)
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // texte pentru tipul și durata livrării
import { formatLei } from "../format.js"; // formatarea prețului
import { arePret } from "../rezumat.js"; // Etapa 7: comanda specială are pret: null până la confirmare
import styles from "./ComandaCard.module.css"; // Etapa 8: stilurile cardului (CSS Modules)

// O singură comandă din listă, primită prin props: un rând ca într-un meniu tipărit.
// Etapa 7: atributele data-testid (tabelul 7.3) sunt pe <li>, titlu, checkbox și butonul de ștergere.
// Etapa 8: titlul conține un link spre /comenzi/:id (data-testid="item-link"); atributele din Etapa 7 rămân pe aceleași elemente.
export default function ComandaCard({ comanda, onToggle, onDelete }) { // destructurăm props: datele comenzii și cele două callback-uri
  const Iconita = ICONITE_CATEGORIE[comanda.categorie] ?? Utensils; // alegem iconița după categorie (tacâmuri dacă e necunoscută)
  const imagine = comanda.speciala ? null : imagineComanda(comanda); // Etapa 7: preparatul cerut special nu are fotografie proprie; nu arătăm alt preparat în locul lui

  return ( // întoarcem JSX
    <li // fiecare card e un element de listă
      className={`${styles.card} ${styles[`livrare-${comanda.livrare}`] ?? ""}${comanda.livrata ? ` ${styles.done}` : ""}`} // clase dinamice din modul: tipul livrării + „done” dacă e livrată
      // numele leagă rândul de el însuși între două randări, ca să alunece la noua poziție
      style={{ viewTransitionName: `comanda-${comanda.id}` }} // nume unic per comandă pentru View Transitions
      data-testid="item" // Etapa 7: reperul cardului pentru verificarea automată
      data-id={comanda.id} // id-ul de la server: după reîncărcare, verificarea găsește exact această comandă
    >
      {imagine ? ( // avem o fotografie
        <img className={`thumb ${styles.thumbFoto}`} src={imagine} alt="" width="48" height="48" loading="lazy" decoding="async" />// miniatura, decorativă: numele e în titlu
      ) : ( // fără fotografie
        <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>// iconița categoriei, ca înainte
      )}{/* sfârșitul randării condiționate */}
      <div>{/* partea principală a cardului (Etapa 8: fără clasă; .card-main nu avea reguli) */}
        <div className="card-top">{/* rândul de sus: titlu ..... preț */}
          {/* span-ul poartă linia care taie titlul, desenată treptat la bifare */}
          <h3 data-testid="item-title">{/* titlul cardului; Etapa 7: data-testid rămâne pe h3 */}
            <Link to={`/comenzi/${comanda.id}`} className={styles.titleLink} data-testid="item-link">{/* Etapa 8: deschide pagina comenzii; verificarea citește titlul din link */}
              <span className={styles.titleText}>{comanda.preparat}</span>{/* numele preparatului */}
            </Link>
          </h3>
          <span className="dots" aria-hidden="true" />{/* punctele dintre titlu și preț, ca în meniu */}
          {arePret(comanda) ? ( // prețul e cunoscut
            <span className="price">{formatLei(comanda.pret)}</span> // prețul formatat
          ) : ( // Etapa 7: comanda specială, prețul îl stabilește restaurantul
            <span className="price price-asteptare">Preț la confirmare</span> // fără preț inventat
          )}{/* sfârșitul randării condiționate */}
        </div>
        <p className={styles.meta}>{/* rândul cu detalii */}
          <span className={styles.restaurant}>{comanda.restaurant}</span>{/* numele restaurantului */}
          <span className={`badge badge-${comanda.livrare}`}>{/* eticheta colorată a tipului de livrare */}
            <span className="dot" aria-hidden="true" />{/* bulina colorată */}
            {ETICHETE_LIVRARE[comanda.livrare]}{/* textul etichetei, ex. „Express” */}
          </span>
          {comanda.speciala && ( // Etapa 7: comanda făcută din formular
            <span className="badge badge-speciala"><Sparkles size={12} aria-hidden="true" />Comandă specială</span> // eticheta „Comandă specială”
          )}{/* sfârșitul randării condiționate */}
          <span className="eta">{/* starea / timpul estimat */}
            {comanda.livrata ? <CircleCheck size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}{/* bifă dacă e livrată, altfel ceas */}
            {comanda.livrata ? "Comandă încheiată" : DURATE_LIVRARE[comanda.livrare]}{/* textul corespunzător stării */}
          </span>
        </p>
      </div>
      <div className={styles.side}>{/* coloana din dreapta cu acțiuni */}
        <label className={styles.status}>{/* label-ul face tot textul clicabil pentru checkbox */}
          <input // checkbox controlat de React
            type="checkbox" // tipul inputului
            checked={comanda.livrata} // valoarea vine din state (componentă controlată); Etapa 7: se schimbă abia după răspunsul serverului
            onChange={() => onToggle(comanda.id)} // la schimbare, anunțăm ComenziPage, care trimite PATCH și apoi actualizează state-ul
            data-testid="item-toggle" // Etapa 7: reperul bifei pentru verificarea automată
          />
          Livrată<span className="sr-only">: {comanda.preparat}</span>{/* textul ascuns vizual le spune cititoarelor de ecran despre ce comandă e vorba */}
        </label>
        <button // butonul de ștergere
          type="button" // buton simplu
          className="btn-danger" // stil de acțiune periculoasă
          onClick={() => onDelete(comanda.id)} // Etapa 7: șterge direct (DELETE la server); greșeala se repară cu „Anulează” din mesajul de jos
          aria-label={`Șterge ${comanda.preparat}`} // nume accesibil, fiindcă butonul are doar iconiță
          title="Șterge comanda" // tooltip la hover
          data-testid="item-delete" // Etapa 7: reperul butonului de ștergere
        >
          <Trash2 size={18} aria-hidden="true" />{/* iconița coș de gunoi */}
        </button>
      </div>
    </li>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
