import { useEffect, useRef } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina
import { Link, useParams } from "react-router-dom"; // useParams: slug-ul din adresă; Link: drumul înapoi
import { ArrowLeft, CircleAlert, RotateCw } from "lucide-react"; // iconițele paginii
import GrilaPreparate from "../components/GrilaPreparate.jsx"; // grila de preparate, aceeași ca pe pagina principală
import { ScheletMeniu } from "../components/Schelete.jsx"; // cardurile în așteptare
import NotFoundPage from "./NotFoundPage.jsx"; // un slug necunoscut arată pagina 404
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // opțiunile de livrare, aceleași pentru toate restaurantele
import { TIPURI_LIVRARE } from "../constants.js"; // ordinea tipurilor de livrare
import { useMagazin } from "../magazin.js"; // meniul din starea comună
import { formatPreparate } from "../rezumat.js"; // „3 preparate”
import { preparateRestaurant, restaurantDupaSlug } from "../restaurante.js"; // restaurantul din adresă și preparatele lui
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
  const { meniu, incarcareMeniu, eroareMeniu, reincarcaMeniu } = useMagazin(); // starea comună
  const titluRef = useRef(null); // titlul paginii

  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // cititorul de ecran anunță restaurantul
  }, []); // fără dependențe: doar la deschidere

  const preparate = preparateRestaurant(meniu, restaurant.nume); // preparatele lui, în ordinea din meniu

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
            <p className={styles.descriere}>{restaurant.descriere}</p>{/* descrierea, doar ce e în meniu */}
            <dl className={styles.livrare}>{/* opțiunile de livrare, din livrare.js */}
              {TIPURI_LIVRARE.map((tip) => ( // un rând pentru fiecare tip
                <div key={tip}>{/* o pereche termen / valoare */}
                  <dt>{ETICHETE_LIVRARE[tip]}</dt>{/* ex. „Express” */}
                  <dd>{DURATE_LIVRARE[tip]}</dd>{/* ex. „Sosește în ~20 min” */}
                </div>
              ))}{/* sfârșitul map-ului */}
            </dl>
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
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
