// Etapa 6: „scheletele” afișate cât timp datele vin de la server: forme fără text, cu aceeași așezare ca elementele reale,
// ca pagina să nu sară când apar datele. Sunt doar decor (aria-hidden); textul „Se încarcă…” de lângă ele e cel citit.
// Etapa 8: scheletele folosesc chiar modulele componentelor reale, deci au aceeași așezare fără reguli copiate.
import grilaStyles from "./GrilaPreparate.module.css"; // redesign: grila de preparate
import meniuCardStyles from "./MeniuCard.module.css"; // cardul unui preparat
import listaStyles from "./ComandaList.module.css"; // lista de comenzi
import cardStyles from "./ComandaCard.module.css"; // rândul unei comenzi

const CARDURI_MENIU = ["m1", "m2", "m3", "m4", "m5", "m6"]; // șase carduri: două rânduri pe desktop
const RANDURI_COMENZI = ["c1", "c2", "c3"]; // trei rânduri

// Grila meniului, cu aceleași clase ca GrilaPreparate și MeniuCard
export function ScheletMeniu({ numar = CARDURI_MENIU.length }) { // numar (opțional): pagina unui restaurant are trei preparate
  return ( // întoarcem JSX
    <ul className={grilaStyles.grid} aria-hidden="true">{/* ascuns pentru cititoarele de ecran */}
      {CARDURI_MENIU.slice(0, numar).map((id) => ( // un card pentru fiecare cheie
        <li key={id} className={meniuCardStyles.card}>{/* aceeași cutie ca un preparat */}
          <span className={`${meniuCardStyles.foto} skeleton`} />{/* locul fotografiei, tot 4:3 */}
          <div className={`${meniuCardStyles.info} schelet-text`}>{/* locul numelui și al restaurantului */}
            <span className="skeleton skeleton-line" />{/* numele */}
            <span className="skeleton skeleton-line skeleton-short" />{/* restaurantul */}
          </div>
        </li>
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Lista de comenzi, cu aceleași clase ca ComandaList și ComandaCard
export function ScheletComenzi() { // fără props
  return ( // întoarcem JSX
    <ul className={listaStyles.list} aria-hidden="true">{/* ascuns pentru cititoarele de ecran */}
      {RANDURI_COMENZI.map((id) => ( // un rând pentru fiecare cheie
        <li key={id} className={cardStyles.card}>{/* aceeași așezare ca o comandă */}
          <span className="thumb skeleton" />{/* locul miniaturii */}
          <div className="schelet-text">{/* locul titlului și al detaliilor */}
            <span className="skeleton skeleton-line" />{/* titlul */}
            <span className="skeleton skeleton-line skeleton-short" />{/* restaurantul și livrarea */}
          </div>
          <div className={cardStyles.side}><span className="skeleton skeleton-pill" /></div>{/* locul bifei „Livrată” */}
        </li>
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
