import { useEffect, useRef } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina
import styles from "./DesprePage.module.css"; // stilurile paginii (CSS Modules)

// Etapa 8: pagina de prezentare, la /despre: ce este Savoro, cu ce e construit și cine a făcut fotografiile.
// Textul vine din README (descrierea aplicației și tabelul „Fotografii”), fără promisiuni despre etapele viitoare.

// Tehnologiile folosite acum în proiect (package.json), fiecare cu rolul ei
const STACK = [ // listă fixă, afișată ca listă de definiții
  { nume: "React", rol: "interfața: componente, props și state" }, // biblioteca de UI
  { nume: "Vite", rol: "serverul de dezvoltare și build-ul" }, // instrumentul de build
  { nume: "React Router", rol: "paginile: acasă, restaurantele, coșul, favoritele, detaliul unei comenzi, Despre și 404" }, // rutele din App.jsx
  { nume: "json-server", rol: "API-ul de test, cu datele din db.json" }, // serverul de date
  { nume: "CSS Modules", rol: "stilurile fiecărei componente, lângă ea" }, // fișierele .module.css
  { nume: "Lucide", rol: "iconițele" }, // pachetul lucide-react
  { nume: "Gabarito", rol: "fontul, de pe Google Fonts" }, // redesign „Pădure”: singura familie de litere
]; // sfârșitul listei

// Autorii fotografiilor (Unsplash), aceleași rânduri ca tabelul „Fotografii” din README
const FOTOGRAFII = [ // preparat, fotograf și pagina fotografiei
  { preparat: "Pizza Margherita (și fotografia mare de sus)", autor: "Aurélien Lemasson-Théobald", url: "https://unsplash.com/photos/x00CzBt4Dfk" }, // pizza-margherita, hero
  { preparat: "Pizza Diavola", autor: "Alan Hardman", url: "https://unsplash.com/photos/SU1LFoeEUkk" }, // pizza-diavola
  { preparat: "Pizza Quattro Formaggi", autor: "Alexey Demidov", url: "https://unsplash.com/photos/MVhg4ecfKBA" }, // pizza-quattro-formaggi
  { preparat: "Burger de vită cu cartofi", autor: "Jonathan Borba", url: "https://unsplash.com/photos/8l8Yl2ruUsg" }, // burger-vita
  { preparat: "Burger cu pui crocant", autor: "Tomi Saputra", url: "https://unsplash.com/photos/RjmgHpZPY9w" }, // burger-pui
  { preparat: "Burger vegetarian", autor: "Grooveland Designs", url: "https://unsplash.com/photos/Kjt-sJbgy8I" }, // burger-vegetarian
  { preparat: "Platou sushi (12 buc.)", autor: "Riccardo Bergamini", url: "https://unsplash.com/photos/O2yNzXdqOu0" }, // sushi-platou
  { preparat: "Ramen cu porc", autor: "Huyen Bui", url: "https://unsplash.com/photos/NHEL1M1Cv-A" }, // ramen-porc
  { preparat: "Gyoza cu legume (6 buc.)", autor: "Mikey Frost", url: "https://unsplash.com/photos/klTf2RN37Ts" }, // gyoza
]; // sfârșitul listei

export default function DesprePage() { // componenta rutei /despre
  const titluRef = useRef(null); // titlul paginii

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță pagina nouă (preventScroll: derularea o face Layout)
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, []); // fără dependențe: doar la deschidere

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <section className={styles.intro} aria-labelledby="despre-titlu">{/* ce este Savoro */}
        <h1 id="despre-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Despre Savoro</h1>{/* titlul paginii */}
        <p className={styles.lead}>{/* descrierea, din README */}
          Savoro îți ține comenzile de mâncare într-un singur loc: vezi ce e încă pe drum, ce a ajuns și bifezi comenzile livrate.
        </p>
        <p className={styles.paragraf}>{/* ce poate face utilizatorul acum */}
          Alegi preparate de la trei restaurante, le pui în coș și plasezi comanda. Păstrezi preparatele preferate cu inima de pe card.
          Pentru un preparat care nu e în meniu trimiți o „Comandă specială”, iar restaurantul îți confirmă prețul. Fiecare comandă are pagina ei.
        </p>
        <p className={styles.paragraf}>Proiect pentru disciplina Tehnologii Web, UNSTPB, anul universitar 2026–2027.</p>{/* contextul proiectului, ca text simplu */}
      </section>

      <div className={styles.grila}>{/* tehnologiile și fotografiile, una lângă alta pe ecranele late */}
        <section className="panel" aria-labelledby="stack-titlu">{/* foaia cu tehnologiile */}
          <h2 id="stack-titlu" className={styles.panelTitlu}>Cu ce e construit</h2>{/* titlul panoului */}
          <dl className={styles.stack}>{/* tehnologie | rol */}
            {STACK.map((t) => ( // un rând pentru fiecare tehnologie
              <div key={t.nume}>{/* numele e unic, deci bun ca key */}
                <dt>{t.nume}</dt>{/* ex. „React Router” */}
                <dd>{t.rol}</dd>{/* la ce folosește */}
              </div>
            ))}{/* sfârșitul map-ului */}
          </dl>
        </section>

        <section id="fotografii" className={`panel ${styles.fotografii}`} aria-labelledby="fotografii-titlu">{/* ancora din subsol: /despre#fotografii */}
          <h2 id="fotografii-titlu" className={styles.panelTitlu}>Fotografii</h2>{/* titlul panoului */}
          <p className={styles.nota}>Toate fotografiile sunt de pe Unsplash (licența Unsplash), redimensionate și convertite în WebP.</p>{/* licența */}
          <table className={styles.tabel}>{/* tabel: preparat | fotograf */}
            <thead>{/* capul tabelului */}
              <tr>{/* un rând */}
                <th scope="col">Preparat</th>{/* coloana preparatelor */}
                <th scope="col">Fotograf</th>{/* coloana autorilor, cu link spre fotografie */}
              </tr>
            </thead>
            <tbody>{/* rândurile */}
              {FOTOGRAFII.map((f) => ( // un rând pentru fiecare fotografie
                <tr key={f.url}>{/* adresa e unică, deci bună ca key */}
                  <td>{f.preparat}</td>{/* preparatul din fotografie */}
                  <td><a href={f.url} target="_blank" rel="noopener noreferrer">{f.autor}<span className="sr-only"> (pe Unsplash, se deschide într-o filă nouă)</span></a></td>{/* link extern, deci <a>, nu <Link> */}
                </tr>
              ))}{/* sfârșitul map-ului */}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
