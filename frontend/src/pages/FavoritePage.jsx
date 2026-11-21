import { useEffect, useRef } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina
import { Link } from "react-router-dom"; // drumul spre meniu din starea goală
import { CircleAlert, Heart, RotateCw } from "lucide-react"; // iconițele paginii
import GrilaPreparate from "../components/GrilaPreparate.jsx"; // grila de preparate, aceeași ca pe pagina principală
import { ScheletMeniu } from "../components/Schelete.jsx"; // cardurile în așteptare
import { esteFavorit, preparateFavorite } from "../favorite.js"; // logica pură a favoritelor
import { useMagazin } from "../magazin.js"; // meniul și favoritele din starea comună
import { formatPreparate } from "../rezumat.js"; // „2 preparate”
import styles from "./FavoritePage.module.css"; // stilurile paginii (CSS Modules)

// Redesign „Pădure”: preparatele salvate cu inima, la /favorite. Lista e în localStorage (vezi magazin.js),
// deci rămâne între vizite; un preparat care nu mai e în meniu dispare singur după încărcare.
export default function FavoritePage() { // componenta rutei /favorite
  const { meniu, favorite, incarcareMeniu, eroareMeniu, reincarcaMeniu } = useMagazin(); // starea comună
  const titluRef = useRef(null); // titlul paginii

  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // cititorul de ecran anunță pagina
  }, []); // fără dependențe: doar la deschidere

  // Scoaterea unei favorite face cardul (și inima apăsată) să dispară; mutăm focusul pe titlu înainte
  function handleInainteDeFavorit(id) { // primește id-ul preparatului
    if (esteFavorit(favorite, id)) titluRef.current?.focus(); // doar la scoatere: la adăugare cardul rămâne
  } // sfârșitul funcției

  const preparate = preparateFavorite(favorite, meniu); // preparatele favorite, cu datele din meniu

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <div className="section-header">{/* titlul paginii */}
        <h1 className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Favorite</h1>{/* tabIndex -1: focus doar din cod */}
        {!incarcareMeniu && !eroareMeniu && preparate.length > 0 && <span className="section-meta">{formatPreparate(preparate.length)}</span>}{/* ex. „2 preparate” */}
      </div>

      {incarcareMeniu ? ( // meniul nu a sosit încă
        <>{/* mesajul și scheletele */}
          <p className="info" role="status" data-testid="loading">Se încarcă favoritele…</p>{/* anunțat de cititoarele de ecran */}
          <ScheletMeniu numar={3} />{/* trei carduri în așteptare */}
        </>
      ) : eroareMeniu ? ( // meniul nu s-a putut încărca
        <div className="error">{/* panoul de eroare */}
          <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
          <div className="error-body">{/* textul și butonul */}
            <p role="alert" data-testid="error">Nu am putut încărca meniul: {eroareMeniu}. Favoritele apar după ce se încarcă.</p>{/* ce s-a întâmplat */}
            <button type="button" className="btn-primary" onClick={reincarcaMeniu}>{/* ce poate face utilizatorul */}
              <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
              Încearcă din nou{/* textul butonului */}
            </button>
          </div>
        </div>
      ) : preparate.length === 0 ? ( // nicio favorită
        <div className="empty">{/* starea goală */}
          <span className={styles.golIcon} aria-hidden="true"><Heart size={26} /></span>{/* iconiță decorativă */}
          <p>Nu ai preparate favorite</p>{/* mesajul principal */}
          <p className="empty-hint">Apasă inima de pe un preparat ca să-l găsești aici data viitoare.</p>{/* ce poate face utilizatorul */}
          <Link to="/#meniu" className="btn-primary">Vezi meniul</Link>{/* drumul spre meniu */}
        </div>
      ) : ( // lista de favorite
        <GrilaPreparate preparate={preparate} onInainteDeFavorit={handleInainteDeFavorit} />// aceeași grilă, cu inima plină
      )}{/* sfârșitul randării condiționate */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
