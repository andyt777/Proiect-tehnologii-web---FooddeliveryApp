// O singură comandă din listă, primită prin props.
const ETICHETE_LIVRARE = { standard: "Standard", express: "Express", ridicare: "Ridicare personală" };
const DURATE_LIVRARE = { standard: "Sosește în ~45 min", express: "Sosește în ~20 min", ridicare: "O iei tu de la local" };
const ICONITE_CATEGORIE = { Pizza: "🍕", Burgers: "🍔", Asian: "🍣" };

export default function ComandaCard({ comanda }) {
  return (
    <li className={`item-card card-${comanda.livrare}${comanda.livrata ? " done" : ""}`}>
      <div className="card-main">
        <span className="thumb" aria-hidden="true">{ICONITE_CATEGORIE[comanda.categorie]}</span>
        <div>
          <p className="restaurant">{comanda.restaurant}</p>
          <h3>{comanda.preparat}</h3>
          <div className="meta">
            <span className={`badge badge-${comanda.livrare}`}>
              {ETICHETE_LIVRARE[comanda.livrare]}
            </span>
            <span className="eta">{comanda.livrata ? "Comandă încheiată" : DURATE_LIVRARE[comanda.livrare]}</span>
          </div>
        </div>
      </div>
      <div className="card-side">
        <span className="price">{comanda.pret} lei</span>
        <span className="status">{comanda.livrata ? "Livrată" : "Pe drum"}</span>
      </div>
    </li>
  );
}
