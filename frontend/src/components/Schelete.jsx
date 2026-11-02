// Etapa 6: „scheletele” afișate cât timp datele vin de la server: forme gri, cu aceeași așezare ca elementele reale,
// ca pagina să nu sară când apar datele. Sunt doar decor (aria-hidden); textul „Se încarcă…” de lângă ele e cel citit.

const CARDURI_MENIU = ["m1", "m2", "m3", "m4", "m5", "m6"]; // șase carduri: două rânduri pe desktop
const RANDURI_COMENZI = ["c1", "c2", "c3"]; // trei rânduri, cât lista din README

// Grila meniului, cu aceleași clase ca MeniuCard
export function ScheletMeniu() { // fără props
  return ( // întoarcem JSX
    <ul className="menu-grid" aria-hidden="true">{/* ascuns pentru cititoarele de ecran */}
      {CARDURI_MENIU.map((id) => ( // un card gri pentru fiecare cheie
        <li key={id} className="menu-card">{/* aceeași cutie ca un preparat */}
          <span className="thumb skeleton" />{/* locul iconiței */}
          <div className="menu-info schelet-text">{/* locul numelui și al restaurantului */}
            <span className="skeleton skeleton-line" />{/* numele */}
            <span className="skeleton skeleton-line skeleton-short" />{/* restaurantul */}
          </div>
          <div className="menu-action"><span className="skeleton skeleton-pill" /></div>{/* locul butonului „Adaugă” */}
        </li>
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Lista de comenzi, cu aceleași clase ca ComandaCard
export function ScheletComenzi() { // fără props
  return ( // întoarcem JSX
    <ul className="item-list" aria-hidden="true">{/* ascuns pentru cititoarele de ecran */}
      {RANDURI_COMENZI.map((id) => ( // un rând gri pentru fiecare cheie
        <li key={id} className="item-card">{/* aceeași așezare ca o comandă */}
          <span className="thumb skeleton" />{/* locul iconiței */}
          <div className="card-main schelet-text">{/* locul titlului și al detaliilor */}
            <span className="skeleton skeleton-line" />{/* titlul */}
            <span className="skeleton skeleton-line skeleton-short" />{/* restaurantul și livrarea */}
          </div>
          <div className="card-side"><span className="skeleton skeleton-pill" /></div>{/* locul bifei „Livrată” */}
        </li>
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
