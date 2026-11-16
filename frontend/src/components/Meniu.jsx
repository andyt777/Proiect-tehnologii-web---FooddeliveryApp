import MeniuCard from "./MeniuCard.jsx"; // cardul unui preparat
import CautareGoala from "./CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import { ScheletMeniu } from "./Schelete.jsx"; // cardurile gri afișate cât se încarcă meniul
import { formatProduse } from "../format.js"; // „9 produse”
import styles from "./Meniu.module.css"; // Etapa 8: stilurile secțiunii (CSS Modules)

// Secțiunea „Meniu”: grila de preparate care se pot pune în coș.
// Cantitățile vin din coș (state-ul din ComenziPage), deci cardurile se actualizează și când schimbi ceva din coș.
// Etapa 6: meniul vine de la server, deci secțiunea are și starea „se încarcă”; `meniu` e lista deja filtrată de căutare și de categorie.
export default function Meniu({ meniu, totalMeniu, incarcare, cautare, categorie, onStergeFiltrele, cos, onAdauga, onSchimba, titluRef }) { // titluRef: ComenziPage mută focusul aici din coșul gol și din hero
  const cantitati = Object.fromEntries(cos.map((l) => [l.produsId, l.cantitate])); // { p1: 2, p4: 1 } pentru căutare rapidă; derivat la fiecare randare
  const cauta = cautare !== ""; // ComenziPage trimite textul căutat doar când căutarea e activă
  const filtrat = cauta || categorie !== null; // căutarea sau categoria micșorează lista

  return ( // întoarcem JSX
    <section className={styles.section} aria-labelledby="meniu-titlu" aria-busy={incarcare}>{/* aria-busy: cititoarele de ecran știu că secțiunea încă se încarcă */}
      <div className="section-header">{/* titlul secțiunii, la fel ca la „Comenzile tale” */}
        <h2 id="meniu-titlu" className={`${styles.title} titlu-focus`} ref={titluRef} tabIndex={-1}>Meniu</h2>{/* tabIndex -1: poate primi focus din cod, dar nu intră în ordinea Tab; titlu-focus: fără contur la acest focus */}
        {!incarcare && ( // numărul apare doar după încărcare (altfel ar spune „0 produse”)
          <span className="section-meta">{filtrat ? `${meniu.length} din ${formatProduse(totalMeniu)}` : formatProduse(totalMeniu)}</span> // la căutare sau categorie: „2 din 9 produse”
        )}{/* sfârșitul randării condiționate */}
      </div>
      {incarcare ? ( // datele nu au sosit încă
        <>{/* mesajul și scheletele, fără element în plus */}
          <p className="info">Se încarcă meniul…</p>{/* fără role="status": anunțul „se încarcă” îl face o singură dată lista de comenzi, ca să nu se audă de două ori */}
          <ScheletMeniu />{/* forme gri, doar decor */}
        </>
      ) : filtrat && meniu.length === 0 ? ( // căutarea și/sau categoria nu au găsit niciun preparat
        <CautareGoala {...textGol(cautare, categorie)} onSterge={onStergeFiltrele} />// mesaj + buton care golește căutarea și categoria
      ) : ( // lista normală
        <ul className={styles.grid}>{/* grila de carduri */}
          {meniu.map((produs) => ( // un card pentru fiecare preparat
            <MeniuCard // cardul preparatului
              key={produs.id} // id-ul e unic și stabil
              produs={produs} // datele preparatului
              cantitate={cantitati[produs.id] ?? 0} // 0 dacă nu e în coș
              onAdauga={onAdauga} // callback-urile urcă până în ComenziPage
              onSchimba={onSchimba} // la fel pentru „−” / „+”
            />
          ))}{/* sfârșitul map-ului */}
        </ul>
      )}{/* sfârșitul randării condiționate */}
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Textele stării goale: spun exact ce s-a filtrat (căutarea, categoria sau amândouă)
function textGol(cautare, categorie) { // cautare = textul căutat ("" = nu se caută); categorie = nume sau null
  if (cautare !== "" && categorie !== null) return { // ambele filtre active
    mesaj: `Niciun preparat din ${categorie} pentru „${cautare}”`, // ex. „Niciun preparat din Pizza pentru „sushi””
    indiciu: "Încearcă alt text sau altă categorie.", // ce poate face utilizatorul
    eticheta: "Șterge filtrele", // butonul golește și căutarea, și categoria
  }; // sfârșitul obiectului
  if (categorie !== null) return { // doar categoria
    mesaj: `Niciun preparat în categoria ${categorie}`, // se întâmplă doar dacă meniul nu are categoria
    indiciu: "Alege altă categorie sau vezi tot meniul.", // ce poate face utilizatorul
    eticheta: "Șterge filtrele", // același buton
  }; // sfârșitul obiectului
  return { mesaj: `Niciun preparat pentru „${cautare}”` }; // doar căutarea: indiciul și butonul implicite din CautareGoala
} // sfârșitul funcției
