import { CircleAlert, CircleCheck, Clock } from "lucide-react"; // iconițe: avertisment, bifă și ceas
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { DURATE_LIVRARE } from "../livrare.js"; // textele cu timpul estimat
import { formatLei } from "../format.js"; // formatarea sumelor în lei

// „Bonul” din zona de sus: următoarea comandă care e pe drum, calculată din listă.
// Etapa 6: `stare` e „incarcare”, „eroare” sau „gata”; până sosesc datele bonul nu pretinde „Nicio comandă încă”.
export default function BonComanda({ comenzi, stare }) { // primește toată lista de comenzi și starea încărcării prin props
  if (stare === "incarcare") { // comenzile nu au sosit încă
    return ( // bonul cu forme gri în loc de text
      <aside className="receipt" aria-label="Următoarea comandă" aria-busy="true">{/* aria-busy: conținutul încă se încarcă */}
        <p className="receipt-label">Urmează să ajungă</p>{/* eticheta rămâne, ca bonul să nu-și schimbe forma */}
        <div className="receipt-dish" aria-hidden="true">{/* locul preparatului, doar decor */}
          <span className="thumb skeleton" />{/* locul iconiței */}
          <div className="schelet-text schelet-bon">{/* locul numelui și al restaurantului */}
            <span className="skeleton skeleton-line" />{/* numele */}
            <span className="skeleton skeleton-line skeleton-short" />{/* restaurantul */}
          </div>
        </div>
        <p className="sr-only">Se încarcă…</p>{/* textul citit în locul formelor gri */}
        <div className="receipt-total" aria-hidden="true">{/* rândul de total, fără sumă */}
          <span>Total pe drum</span>{/* eticheta */}
          <strong>—</strong>{/* liniuță, nu „0 lei” */}
        </div>
      </aside>
    ); // sfârșitul JSX-ului pentru încărcare
  } // sfârșitul ramurii if

  if (stare === "eroare") { // serverul nu a răspuns; detaliile și „Încearcă din nou” sunt în pagină
    return ( // varianta neutră a bonului
      <aside className="receipt receipt-done receipt-indisponibil" aria-label="Comenzi pe drum">{/* același aspect ca bonul „gata” */}
        <CircleAlert size={28} aria-hidden="true" />{/* iconiță decorativă */}
        <p>Comenzile nu sunt disponibile acum.</p>{/* nu spunem „0” sau „nicio comandă”: nu știm */}
      </aside>
    ); // sfârșitul JSX-ului pentru eroare
  } // sfârșitul ramurii if

  const peDrum = comenzi.filter((c) => !c.livrata); // doar comenzile nelivrate
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
