import { CircleCheck, Clock } from "lucide-react"; // iconițe: bifă și ceas
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { DURATE_LIVRARE } from "../livrare.js"; // textele cu timpul estimat
import { formatLei } from "../format.js"; // formatarea sumelor în lei

// „Bonul” din zona de sus: următoarea comandă care e pe drum, calculată din listă.
export default function BonComanda({ comenzi }) { // primește toată lista de comenzi prin props
  const peDrum = comenzi.filter((c) => !c.livrata); // doar comnzile nelivrate
  const urmatoarea = peDrum[0]; // prima dintre ele (undefined dacă nu există)
  const totalPeDrum = peDrum.reduce((suma, c) => suma + c.pret, 0); // suma prețurilor comenzilor pe drum

  if (!urmatoarea) { // nu e nicio comandă pe drum
    return ( // afișăm varianta „gata”
      <aside className="receipt receipt-done" aria-label="Comenzi pe drum">{/* aside = conținut secundar */}
        <CircleCheck size={28} aria-hidden="true" />{/* iconiță decorativă */}
        <p>{comenzi.length > 0 ? "Toate comenzile au ajuns." : "Nicio comandă încă."}</p>{/* mesaj diferit dacă lista e goală */}
      </aside>
    ); // sfârșitul JSX-ului pentru cazul gol
  } // sfârșitul ramurii if

  const Iconita = ICONITE_CATEGORIE[urmatoarea.categorie]; // componenta iconiței; numele începe cu majusculă ca să poată fi folosită ca <Iconita />

  return ( // varianta normală a bonului
    <aside className="receipt" aria-label="Următoarea comandă">{/* containerul bonului */}
      <p className="receipt-label">Urmează să ajungă</p>{/* eticheta de sus */}
      <div className={`receipt-dish card-${urmatoarea.livrare}`}>{/* clasa depinde de tipul livrării (culori diferite) */}
        <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>{/* iconița categoriei */}
        <div>{/* textele preparatului */}
          <h3>{urmatoarea.preparat}</h3>{/* numele preparatului */}
          <p>{urmatoarea.restaurant}</p>{/* numele restaurantului */}
        </div>
      </div>
      <p className="eta"><Clock size={14} aria-hidden="true" />{DURATE_LIVRARE[urmatoarea.livrare]}</p>{/* timpul estimat */}
      <div className="receipt-total">{/* rândul de total */}
        <span>Total pe drum ({peDrum.length})</span>{/* câte comenzi sunt pe drum */}
        <strong>{formatLei(totalPeDrum)}</strong>{/* suma lor, formatată */}
      </div>
    </aside>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
