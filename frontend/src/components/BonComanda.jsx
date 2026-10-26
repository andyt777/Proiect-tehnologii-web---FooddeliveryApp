import { CircleCheck, Clock } from "lucide-react";
import { ICONITE_CATEGORIE } from "../categorii.js";
import { DURATE_LIVRARE } from "../livrare.js";
import { formatLei } from "../format.js";

// „Bonul” din zona de sus: următoarea comandă care e pe drum, calculată din listă.
export default function BonComanda({ comenzi }) {
  const peDrum = comenzi.filter((c) => !c.livrata);
  const urmatoarea = peDrum[0];
  const totalPeDrum = peDrum.reduce((suma, c) => suma + c.pret, 0);

  if (!urmatoarea) {
    return (
      <aside className="receipt receipt-done" aria-label="Comenzi pe drum">
        <CircleCheck size={28} aria-hidden="true" />
        <p>{comenzi.length > 0 ? "Toate comenzile au ajuns." : "Nicio comandă încă."}</p>
      </aside>
    );
  }

  const Iconita = ICONITE_CATEGORIE[urmatoarea.categorie];

  return (
    <aside className="receipt" aria-label="Următoarea comandă">
      <p className="receipt-label">Urmează să ajungă</p>
      <div className={`receipt-dish card-${urmatoarea.livrare}`}>
        <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>
        <div>
          <h3>{urmatoarea.preparat}</h3>
          <p>{urmatoarea.restaurant}</p>
        </div>
      </div>
      <p className="eta"><Clock size={14} aria-hidden="true" />{DURATE_LIVRARE[urmatoarea.livrare]}</p>
      <div className="receipt-total">
        <span>Total pe drum ({peDrum.length})</span>
        <strong>{formatLei(totalPeDrum)}</strong>
      </div>
    </aside>
  );
}
