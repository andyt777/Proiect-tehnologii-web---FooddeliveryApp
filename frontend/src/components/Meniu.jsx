import GrilaPreparate from "./GrilaPreparate.jsx"; // grila de carduri, comună cu paginile restaurantului și a favoritelor
import CautareGoala from "./CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import { ScheletMeniu } from "./Schelete.jsx"; // cardurile în așteptare afișate cât se încarcă meniul
import { formatPreparate } from "../rezumat.js"; // „9 preparate”
import styles from "./Meniu.module.css"; // Etapa 8: stilurile secțiunii (CSS Modules)

// Secțiunea „Meniu” de pe pagina principală: grila de preparate care se pot pune în coș.
// `meniu` e lista deja filtrată de căutare și de categorie; coșul și favoritele le citește grila din starea comună.
// Redesign „Pădure”: titlul are id="meniu", ca „/#meniu” (din coșul gol) să ducă aici.
export default function Meniu({ meniu, totalMeniu, incarcare, cautare, categorie, onStergeFiltrele, titluRef }) { // titluRef: ComenziPage mută focusul aici după reîncercare
  const filtrat = cautare !== "" || categorie !== null; // căutarea sau categoria micșorează lista

  return ( // întoarcem JSX
    <section className={styles.section} aria-labelledby="meniu" aria-busy={incarcare}>{/* aria-busy: secțiunea încă se încarcă */}
      <div className="section-header">{/* titlul secțiunii */}
        <h2 id="meniu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Meniu</h2>{/* tabIndex -1: focus doar din cod */}
        {!incarcare && ( // numărul apare doar după încărcare (altfel ar spune „0 preparate”)
          <span className="section-meta">{filtrat ? `${meniu.length} din ${formatPreparate(totalMeniu)}` : formatPreparate(totalMeniu)}</span> // ex. „2 din 9 preparate”
        )}{/* sfârșitul randării condiționate */}
      </div>
      {incarcare ? ( // datele nu au sosit încă
        <>{/* mesajul și scheletele */}
          <p className="info">Se încarcă meniul…</p>{/* fără role="status": anunțul îl face o singură dată lista de comenzi */}
          <ScheletMeniu />{/* forme fără text, doar decor */}
        </>
      ) : filtrat && meniu.length === 0 ? ( // căutarea și/sau categoria nu au găsit niciun preparat
        <CautareGoala {...textGol(cautare, categorie)} onSterge={onStergeFiltrele} />// mesaj + buton care golește căutarea și categoria
      ) : ( // lista normală
        <GrilaPreparate preparate={meniu} />// grila de carduri
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
