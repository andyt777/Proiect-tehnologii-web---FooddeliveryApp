import { CATEGORII } from "../categorii.js"; // categoriile, cu iconițele lor
import { ETICHETE_LIVRARE } from "../livrare.js"; // textele tipurilor de livrare
import { formatLei } from "../format.js"; // „331 lei”
import { formatFaraPret, rezumatComenzi } from "../rezumat.js"; // toate cifrele, calculate din listă; Etapa 7: textul pentru prețurile neconfirmate

const TIPURI_LIVRARE = Object.keys(ETICHETE_LIVRARE); // ["standard", "express", "ridicare"], în ordinea din livrare.js

// Rezumatul comenzilor ca „bento”: plăci de mărimi diferite, toate calculate din lista completă (nu din cea căutată).
// `stare` e „incarcare”, „eroare” sau „gata”; până la „gata” cifrele sunt liniuțe, nu zerouri (încă nu știm).
export default function RezumatBento({ comenzi, stare }) { // props: toată lista de comenzi și starea încărcării
  const gata = stare === "gata"; // avem date reale
  const r = rezumatComenzi(comenzi); // { numar, total, peDrum, livrate, peCategorie, peLivrare }
  const procent = r.numar > 0 ? Math.round((r.livrate / r.numar) * 100) : 0; // lățimea barei; fără împărțire la 0 (NaN)
  // în locul cifrelor, cât timp nu avem date: o liniuță vizibilă și un text pentru cititoarele de ecran
  const faraValoare = <><span aria-hidden="true">—</span><span className="sr-only">{stare === "incarcare" ? "se încarcă" : "indisponibil"}</span></>; // nu „0 lei”: încă nu știm

  // key = valoarea: când cifra se schimbă, elementul e randat din nou și animația „tick” pornește
  return ( // întoarcem JSX
    <div className="bento" aria-busy={stare === "incarcare"}>{/* grila de plăci */}
      <div className="tile tile-mare">{/* placa mare: totalul și categoriile */}
        <p className="tile-text">{/* cifra și eticheta, citite împreună */}
          <strong key={gata ? r.total : stare} className="tile-valoare tick">{gata ? formatLei(r.total) : faraValoare}</strong>{/* totalul cheltuit */}
          <span className="tile-eticheta">cheltuiți în total</span>{/* datele nu au date calendaristice, deci nu „luna asta” */}
          {gata && r.faraPret > 0 && <span className="tile-nota">{formatFaraPret(r.faraPret)}</span>}{/* Etapa 7: comenzile speciale nu intră în total până nu au preț */}
        </p>
        <ul className="bento-chips" aria-label="Comenzi pe categorii">{/* câte comenzi are fiecare categorie */}
          {CATEGORII.map((cat) => ( // o pastilă pentru fiecare categorie
            <li key={cat.nume}>{/* numele e unic, deci bun ca key */}
              <cat.Icon size={16} aria-hidden="true" />{/* iconița categoriei */}
              {cat.nume}{/* numele categoriei */}
              <span key={gata ? r.peCategorie[cat.nume] : stare} className="cat-count tick">{gata ? r.peCategorie[cat.nume] : faraValoare}</span>{/* numărul de comenzi */}
            </li>
          ))}{/* sfârșitul map-ului */}
        </ul>
      </div>

      <p className="tile tile-text">{/* placa „pe drum” */}
        <strong key={gata ? r.peDrum : stare} className="tile-valoare tick">{gata ? r.peDrum : faraValoare}</strong>{/* comenzi nelivrate */}
        <span className="tile-eticheta">pe drum</span>{/* eticheta */}
      </p>

      <div className="tile">{/* placa „livrate”, cu bara de progres */}
        <p className="tile-text">{/* cifra și eticheta */}
          <strong key={gata ? `${r.livrate}/${r.numar}` : stare} className="tile-valoare tick">{gata ? `${r.livrate} din ${r.numar}` : faraValoare}</strong>{/* ex. „3 din 6” */}
          <span className="tile-eticheta">livrate</span>{/* eticheta */}
        </p>
        <span className="bento-bara" aria-hidden="true"><span style={{ width: `${gata ? procent : 0}%` }} /></span>{/* doar decor: textul de deasupra spune deja același lucru */}
      </div>

      <div className="tile tile-lata">{/* placa lată: tipurile de livrare */}
        <p className="tile-eticheta">după tipul livrării</p>{/* titlul plăcii */}
        <ul className="bento-livrari" aria-label="Comenzi după tipul livrării">{/* câte o etichetă colorată pentru fiecare tip */}
          {TIPURI_LIVRARE.map((tip) => ( // aceleași clase ca etichetele de pe comenzi
            <li key={tip} className={`badge badge-${tip}`}>{/* culoarea tipului de livrare */}
              <span className="dot" aria-hidden="true" />{/* bulina colorată */}
              {ETICHETE_LIVRARE[tip]} ·{" "}{/* ex. „Express · ” */}
              <span key={gata ? r.peLivrare[tip] : stare} className="tick">{gata ? r.peLivrare[tip] : faraValoare}</span>{/* numărul de comenzi */}
            </li>
          ))}{/* sfârșitul map-ului */}
        </ul>
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
