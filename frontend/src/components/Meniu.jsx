import MeniuCard from "./MeniuCard.jsx"; // cardul unui preparat
import { formatProduse } from "../format.js"; // „9 produse”

// Secțiunea „Meniu”: grila de preparate care se pot pune în coș.
// Cantitățile vin din coș (state-ul din App), deci cardurile se actualizează și când schimbi ceva din coș.
export default function Meniu({ meniu, cos, onAdauga, onSchimba, titluRef }) { // titluRef: App mută focusul aici din coșul gol
  const cantitati = Object.fromEntries(cos.map((l) => [l.produsId, l.cantitate])); // { p1: 2, p4: 1 } pentru căutare rapidă; derivat la fiecare randare

  return ( // întoarcem JSX
    <section className="menu-section" aria-labelledby="meniu-titlu">{/* secțiunea are ca nume titlul ei */}
      <div className="section-header">{/* titlul secțiunii, la fel ca la „Comenzile mele” */}
        <h2 id="meniu-titlu" className="menu-title" ref={titluRef} tabIndex={-1}>Meniu</h2>{/* tabIndex -1: poate primi focus din cod, dar nu intră în ordinea Tab */}
        <span className="section-meta">{formatProduse(meniu.length)}</span>{/* câte preparate are meniul */}
      </div>
      <ul className="menu-grid">{/* grila de carduri */}
        {meniu.map((produs) => ( // un card pentru fiecare preparat
          <MeniuCard // cardul preparatului
            key={produs.id} // id-ul e unic și stabil
            produs={produs} // datele preparatului
            cantitate={cantitati[produs.id] ?? 0} // 0 dacă nu e în coș
            onAdauga={onAdauga} // callback-urile urcă până în App
            onSchimba={onSchimba} // la fel pentru „−” / „+”
          />
        ))}{/* sfârșitul map-ului */}
      </ul>
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
