import { CircleCheck, Clock, Trash2 } from "lucide-react"; // iconițe: bifă, ceas, coș de gunoi
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // texte pentru tipul și durata livrării
import { formatLei } from "../format.js"; // formatarea prețului

// O singură comandă din listă, primită prin props: un rând ca într-un meniu tipărit.
export default function ComandaCard({ comanda, onToggle, onDelete }) { // destructurăm props: datele comenzii și cele două callback-uri
  const Iconita = ICONITE_CATEGORIE[comanda.categorie]; // alegem iconița după categorie

  return ( // întoarcem JSX
    <li // fiecare card e un element de listă
      className={`item-card card-${comanda.livrare}${comanda.livrata ? " done" : ""}`} // clase dinamice: tipul livrării + „done” dacă e livrată
      // numele leagă rândul de el însuși între două randări, ca să alunece la noua poziție
      style={{ viewTransitionName: `comanda-${comanda.id}` }} // nume unic per comandă pentru View Transitions
    >
      <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>{/* iconița categoriei */}
      <div className="card-main">{/* partea principală a cardului */}
        <div className="card-top">{/* rândul de sus: titlu ..... preț */}
          {/* span-ul poartă linia care taie titlul, desenată treptat la bifare */}
          <h3><span className="title-text">{comanda.preparat}</span></h3>{/* numele preparatului */}
          <span className="dots" aria-hidden="true" />{/* punctele dintre titlu și preț, ca în meniu */}
          <span className="price">{formatLei(comanda.pret)}</span>{/* prețul formatat */}
        </div>
        <p className="card-meta">{/* rândul cu detalii */}
          <span className="restaurant">{comanda.restaurant}</span>{/* numele restaurantului */}
          <span className={`badge badge-${comanda.livrare}`}>{/* eticheta colorată a tipului de livrare */}
            <span className="dot" aria-hidden="true" />{/* bulina colorată */}
            {ETICHETE_LIVRARE[comanda.livrare]}{/* textul etichetei, ex. „Express” */}
          </span>
          <span className="eta">{/* starea / timpul estimat */}
            {comanda.livrata ? <CircleCheck size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}{/* bifă dacă e livrată, altfel ceas */}
            {comanda.livrata ? "Comandă încheiată" : DURATE_LIVRARE[comanda.livrare]}{/* textul corespunzător stării */}
          </span>
        </p>
      </div>
      <div className="card-side">{/* coloana din dreapta cu acțiuni */}
        <label className="status">{/* label-ul face tot textul clicabil pentru checkbox */}
          <input // checkbox controlat de React
            type="checkbox" // tipul inputului
            checked={comanda.livrata} // valoarea vine din state (componentă controlată)
            onChange={() => onToggle(comanda.id)} // la schimbare, anunțăm App, care actualizează state-ul
          />
          Livrată<span className="sr-only">: {comanda.preparat}</span>{/* textul ascuns vizual le spune cititoarelor de ecran despre ce comandă e vorba */}
        </label>
        <button // butonul de ștergere
          className="btn-danger" // stil de acțiune periculoasă
          onClick={() => onDelete(comanda.id)} // nu șterge direct: App deschide întâi dialogul de confirmare
          aria-label={`Șterge ${comanda.preparat}`} // nume accesibil, fiindcă butonul are doar iconiță
          title="Șterge comanda" // tooltip la hover
        >
          <Trash2 size={18} aria-hidden="true" />{/* iconița coș de gunoi */}
        </button>
      </div>
    </li>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
