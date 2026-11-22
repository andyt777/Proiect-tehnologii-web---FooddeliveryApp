import { useEffect, useRef, useState } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina; useState: recenziile
import { Link, useParams } from "react-router-dom"; // useParams: slug-ul din adresă; Link: drumul înapoi
import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react"; // iconițele paginii
import GrilaPreparate from "../components/GrilaPreparate.jsx"; // grila de preparate, aceeași ca pe pagina principală
import { ScheletMeniu } from "../components/Schelete.jsx"; // cardurile în așteptare
import NotFoundPage from "./NotFoundPage.jsx"; // un slug necunoscut arată pagina 404
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // opțiunile de livrare, aceleași pentru toate restaurantele
import { TIPURI_LIVRARE } from "../constants.js"; // ordinea tipurilor de livrare
import { useMagazin } from "../magazin.js"; // meniul din starea comună
import { formatPreparate } from "../rezumat.js"; // „3 preparate”
import { fetchRecenzii } from "../api.js";
import { formatData } from "../format.js";
import { ETICHETE_NOTA, NOTA_MAX, curataRecenzii, formatNota, formatRecenzii, medieRecenzii, recenziiRestaurant } from "../recenzii.js";
import { preparateRestaurant, restaurantDupaSlug } from "../restaurante.js"; // restaurantul din adresă și preparatele lui
import { profilRestaurant, randuriProgram, stareRestaurant } from "../program.js";
import styles from "./RestaurantPage.module.css"; // stilurile paginii (CSS Modules)

// Redesign „Pădure”: pagina unui restaurant, la /restaurante/:slug (ex. /restaurante/sushi-kyo).
// Antet verde cu fotografia care iese din bandă, apoi preparatele lui din /meniu, cu „Adaugă în coș”.
export default function RestaurantPage() { // componenta rutei
  const { slug } = useParams(); // text din adresă, ex. „sushi-kyo”
  const restaurant = restaurantDupaSlug(slug); // datele restaurantului sau null
  if (!restaurant) return <NotFoundPage />; // slug necunoscut: aceeași pagină ca orice adresă inexistentă
  return <PaginaRestaurant key={restaurant.slug} restaurant={restaurant} />; // key: alt restaurant = componentă nouă (focusul pornește iar de la titlu)
} // sfârșitul componentei

function PaginaRestaurant({ restaurant }) { // conținutul paginii, pentru un restaurant cunoscut
  const { meniu, incarcareMeniu, eroareMeniu, reincarcaMeniu, profiluri, ceas } = useMagazin(); // starea comună
  const profil = profilRestaurant(profiluri, restaurant.nume);
  const stare = stareRestaurant(profil, ceas);
  const program = randuriProgram(profil);
  const titluRef = useRef(null); // titlul paginii

  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // cititorul de ecran anunță restaurantul
  }, []); // fără dependențe: doar la deschidere

  const [recenzii, setRecenzii] = useState([]);

  // Pachetul C: recenziile reale de la /recenzii. La o eroare secțiunea lipsește: meniul rămâne principalul conținut.
  useEffect(() => {
    let ignore = false;
    fetchRecenzii()
      .then((lista) => { if (!ignore) setRecenzii(recenziiRestaurant(curataRecenzii(lista), restaurant.nume)); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [restaurant.nume]);

  const preparate = preparateRestaurant(meniu, restaurant.nume); // preparatele lui, în ordinea din meniu
  const medie = medieRecenzii(recenzii);

  return ( // JSX-ul paginii
    <>{/* Fragment: antetul verde și meniul */}
      <section className={`${styles.banda} pe-padure`} aria-labelledby="restaurant-titlu">{/* banda verde, continuarea antetului */}
        <div className={`wrap ${styles.bandaInner}`}>{/* containerul centrat */}
          <div className={styles.text}>{/* textele restaurantului */}
            <Link to="/#restaurante" className={styles.inapoi}>{/* drumul înapoi la rândul de restaurante */}
              <ArrowLeft size={18} aria-hidden="true" />{/* săgeata, decorativă */}
              Toate restaurantele{/* textul linkului */}
            </Link>
            <h1 id="restaurant-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>{restaurant.nume}</h1>{/* numele */}
            <p className={styles.bucatarie}>Bucătărie {restaurant.bucatarie.toLowerCase()}</p>{/* ex. „Bucătărie japoneză” */}
            <p className={styles.descriere}>{profil?.descriere || restaurant.descriere}</p>{/* descrierea: din profil, altfel cea statică */}
            {!stare.deschis && (
              <p className={styles.stareInchis}>
                <strong>{stare.eticheta}</strong>
                {stare.motiv === "pauza" ? ". Restaurantul nu primește comenzi acum." : ". Poți programa o comandă în orele lui."}
              </p>
            )}
            {profil?.telefon && <p className={styles.descriere}>Telefon: <a className={styles.telefon} href={`tel:${profil.telefon}`}>{profil.telefon}</a></p>}
            {medie && <p className={styles.medie}><strong>Nota {formatNota(medie.medie)} din {NOTA_MAX}</strong>, din {formatRecenzii(medie.numar)} ale clienților</p>}
            <dl className={styles.livrare}>{/* opțiunile de livrare, din livrare.js */}
              {TIPURI_LIVRARE.map((tip) => ( // un rând pentru fiecare tip
                <div key={tip}>{/* o pereche termen / valoare */}
                  <dt>{ETICHETE_LIVRARE[tip]}</dt>{/* ex. „Express” */}
                  <dd>{DURATE_LIVRARE[tip]}</dd>{/* ex. „Sosește în ~20 min” */}
                </div>
              ))}{/* sfârșitul map-ului */}
            </dl>
            {program.length > 0 && (
              <details className={styles.program}>
                <summary>Programul</summary>
                <dl>
                  {program.map((r) => <div key={r.zi}><dt>{r.eticheta}</dt><dd>{r.text}</dd></div>)}
                </dl>
              </details>
            )}
          </div>
          {restaurant.imagine && <img className={styles.foto} src={restaurant.imagine} alt="" width="720" height="540" fetchPriority="high" decoding="async" />}{/* decorativă; iese din bandă, peste hârtie */}
        </div>
      </section>

      <section className={`wrap ${styles.meniu}`} aria-labelledby="restaurant-meniu" aria-busy={incarcareMeniu}>{/* preparatele restaurantului */}
        <div className="section-header">{/* titlul secțiunii */}
          <h2 id="restaurant-meniu">Meniu</h2>{/* textul titlului */}
          {!incarcareMeniu && !eroareMeniu && <span className="section-meta">{formatPreparate(preparate.length)}</span>}{/* ex. „3 preparate” */}
        </div>
        {incarcareMeniu ? ( // meniul nu a sosit încă
          <>{/* mesajul și scheletele */}
            <p className="info" role="status" data-testid="loading">Se încarcă meniul…</p>{/* anunțat de cititoarele de ecran */}
            <ScheletMeniu numar={3} />{/* trei carduri în așteptare */}
          </>
        ) : eroareMeniu ? ( // meniul nu s-a putut încărca
          <div className="error">{/* panoul de eroare */}
            <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
            <div className="error-body">{/* textul și butonul */}
              <p role="alert" data-testid="error">Nu am putut încărca meniul: {eroareMeniu}.</p>{/* ce s-a întâmplat */}
              <button type="button" className="btn-primary" onClick={reincarcaMeniu}>{/* ce poate face utilizatorul */}
                <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
                Încearcă din nou{/* textul butonului */}
              </button>
            </div>
          </div>
        ) : preparate.length === 0 ? ( // restaurantul nu are preparate în meniul de acum
          <div className="empty">{/* starea goală */}
            <p>Niciun preparat momentan</p>{/* mesajul principal */}
            <p className="empty-hint">{restaurant.nume} nu are preparate în meniu acum. Vezi celelalte restaurante.</p>{/* ce poate face utilizatorul */}
            <Link to="/#restaurante" className="btn-secondary">Toate restaurantele</Link>{/* drumul înapoi */}
          </div>
        ) : ( // lista normală
          <GrilaPreparate preparate={preparate} faraRestaurant />// numele restaurantului e deja în titlu
        )}{/* sfârșitul randării condiționate */}
      </section>

      {medie && (
        <section className={`wrap ${styles.recenzii}`} aria-labelledby="restaurant-recenzii">
          <div className="section-header">
            <h2 id="restaurant-recenzii">Recenzii</h2>
            <span className="section-meta">{formatNota(medie.medie)} din {NOTA_MAX}, din {formatRecenzii(medie.numar)}</span>
          </div>
          <ul className={styles.listaRecenzii}>
            {recenzii.map((r) => (
              <li key={r.id} className={styles.recenzie}>
                <p className={styles.recenzieNota}><strong>{r.nota} din {NOTA_MAX}</strong>, {ETICHETE_NOTA[r.nota].toLowerCase()}</p>
                {r.text && <p className={styles.recenzieText}>{r.text}</p>}
                {r.creata && <p className={styles.recenzieData}><time dateTime={r.creata}>{formatData(r.creata)}</time></p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
