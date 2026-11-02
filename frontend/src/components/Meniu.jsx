import MeniuCard from "./MeniuCard.jsx"; // cardul unui preparat
import CautareGoala from "./CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import { ScheletMeniu } from "./Schelete.jsx"; // cardurile gri afișate cât se încarcă meniul
import { formatProduse } from "../format.js"; // „9 produse”

// Secțiunea „Meniu”: grila de preparate care se pot pune în coș.
// Cantitățile vin din coș (state-ul din App), deci cardurile se actualizează și când schimbi ceva din coș.
// Etapa 6: meniul vine de la server, deci secțiunea are și starea „se încarcă”; `meniu` e lista deja filtrată de căutare.
export default function Meniu({ meniu, totalMeniu, incarcare, cautare, onStergeCautarea, cos, onAdauga, onSchimba, titluRef }) { // titluRef: App mută focusul aici din coșul gol
  const cantitati = Object.fromEntries(cos.map((l) => [l.produsId, l.cantitate])); // { p1: 2, p4: 1 } pentru căutare rapidă; derivat la fiecare randare
  const cauta = cautare !== ""; // App trimite textul căutat doar când căutarea e activă

  return ( // întoarcem JSX
    <section className="menu-section" aria-labelledby="meniu-titlu" aria-busy={incarcare}>{/* aria-busy: cititoarele de ecran știu că secțiunea încă se încarcă */}
      <div className="section-header">{/* titlul secțiunii, la fel ca la „Comenzile mele” */}
        <h2 id="meniu-titlu" className="menu-title titlu-focus" ref={titluRef} tabIndex={-1}>Meniu</h2>{/* tabIndex -1: poate primi focus din cod, dar nu intră în ordinea Tab; titlu-focus: fără contur la acest focus */}
        {!incarcare && ( // numărul apare doar după încărcare (altfel ar spune „0 produse”)
          <span className="section-meta">{cauta ? `${meniu.length} din ${formatProduse(totalMeniu)}` : formatProduse(totalMeniu)}</span> // la căutare: „2 din 9 produse”
        )}{/* sfârșitul randării condiționate */}
      </div>
      {incarcare ? ( // datele nu au sosit încă
        <>{/* mesajul și scheletele, fără element în plus */}
          <p className="info">Se încarcă meniul…</p>{/* fără role="status": anunțul „se încarcă” îl face o singură dată lista de comenzi, ca să nu se audă de două ori */}
          <ScheletMeniu />{/* forme gri, doar decor */}
        </>
      ) : cauta && meniu.length === 0 ? ( // căutarea nu a găsit niciun preparat
        <CautareGoala mesaj={`Niciun preparat pentru „${cautare}”`} onSterge={onStergeCautarea} />// mesaj + „Șterge căutarea”
      ) : ( // lista normală
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
      )}{/* sfârșitul randării condiționate */}
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
