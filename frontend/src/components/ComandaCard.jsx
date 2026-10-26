import { CircleCheck, Clock, Trash2 } from "lucide-react";
import { ICONITE_CATEGORIE } from "../categorii.js";
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js";
import { formatLei } from "../format.js";

// O singură comandă din listă, primită prin props: un rând ca într-un meniu tipărit.
export default function ComandaCard({ comanda, onToggle, onDelete }) {
  const Iconita = ICONITE_CATEGORIE[comanda.categorie];

  return (
    <li
      className={`item-card card-${comanda.livrare}${comanda.livrata ? " done" : ""}`}
      // numele leagă rândul de el însuși între două randări, ca să alunece la noua poziție
      style={{ viewTransitionName: `comanda-${comanda.id}` }}
    >
      <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>
      <div className="card-main">
        <div className="card-top">
          {/* span-ul poartă linia care taie titlul, desenată treptat la bifare */}
          <h3><span className="title-text">{comanda.preparat}</span></h3>
          <span className="dots" aria-hidden="true" />
          <span className="price">{formatLei(comanda.pret)}</span>
        </div>
        <p className="card-meta">
          <span className="restaurant">{comanda.restaurant}</span>
          <span className={`badge badge-${comanda.livrare}`}>
            <span className="dot" aria-hidden="true" />
            {ETICHETE_LIVRARE[comanda.livrare]}
          </span>
          <span className="eta">
            {comanda.livrata ? <CircleCheck size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
            {comanda.livrata ? "Comandă încheiată" : DURATE_LIVRARE[comanda.livrare]}
          </span>
        </p>
      </div>
      <div className="card-side">
        <label className="status">
          <input
            type="checkbox"
            checked={comanda.livrata}
            onChange={() => onToggle(comanda.id)}
          />
          Livrată<span className="sr-only">: {comanda.preparat}</span>
        </label>
        <button
          className="btn-danger"
          onClick={() => onDelete(comanda.id)}
          aria-label={`Șterge ${comanda.preparat}`}
          title="Șterge comanda"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
