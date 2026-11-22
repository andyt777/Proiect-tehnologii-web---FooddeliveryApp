import { useEffect, useRef } from "react"; // useRef: referințe la butoane; useEffect: mutăm focusul după randare
import { Link } from "react-router-dom"; // numele restaurantului duce la pagina lui
import { Heart, Plus } from "lucide-react"; // inima (favorite) și plusul de pe „Adaugă”
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { imagineProdus } from "../meniuAdmin.js";
import { formatLei } from "../format.js"; // formatarea prețului
import { restaurantDupaNume } from "../restaurante.js"; // slug-ul restaurantului, pentru link
import styles from "./MeniuCard.module.css"; // Etapa 8: stilurile cardului (CSS Modules)

// Un preparat din meniu: fotografie (cu inima de favorite), nume, restaurant, preț și „Adaugă”.
// Cât timp preparatul e în coș, butonul „Adaugă” e înlocuit de selectorul de cantitate.
// Redesign „Pădure”: cardul e plat, pe hârtie (fără umbră și fără contur); faraRestaurant ascunde restaurantul pe pagina lui.
export default function MeniuCard({ produs, cantitate, favorit, onAdauga, onSchimba, onFavorit, faraRestaurant = false, indisponibil = null }) { // props: preparatul, cantitatea din coș, dacă e favorit și callback-urile
  const Iconita = ICONITE_CATEGORIE[produs.categorie]; // iconița categoriei (când nu avem fotografie)
  const imagine = imagineProdus(produs);
  const restaurant = restaurantDupaNume(produs.restaurant); // { slug, ... } sau null
  const adaugaRef = useRef(null); // butonul „Adaugă”
  const plusRef = useRef(null); // butonul „+” din selector
  // Butonul apăsat dispare la randare (Adaugă -> selector, sau selector -> Adaugă), iar focusul s-ar pierde.
  // Ținem minte unde trebuie să ajungă focusul și îl mutăm după ce React a desenat noul buton.
  const focusDupa = useRef(null); // "plus", "adauga" sau null

  useEffect(() => { // rulează după fiecare schimbare a cantității
    if (focusDupa.current === "plus") plusRef.current?.focus(); // după „Adaugă”: focus pe „+”
    if (focusDupa.current === "adauga") adaugaRef.current?.focus(); // după ce linia a dispărut: focus înapoi pe „Adaugă”
    focusDupa.current = null; // cererea a fost îndeplinită
  }, [cantitate]); // doar când se schimbă cantitatea

  function handleAdauga() { // clic pe „Adaugă”
    focusDupa.current = "plus"; // după randare, focusul trece pe „+”
    onAdauga(produs.id); // anunțăm starea comună
  } // sfârșitul funcției

  function handleSchimba(delta) { // clic pe „−” sau „+”
    if (cantitate + delta <= 0) focusDupa.current = "adauga"; // linia dispare, deci revine butonul „Adaugă”
    onSchimba(produs.id, delta); // anunțăm starea comună
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <li className={`${styles.card} ${indisponibil ? styles.cardIndisponibil : ""}`}>{/* un element al grilei de preparate */}
      <div className={styles.media}>{/* fotografia și inima */}
        {indisponibil && <span className={styles.eticheta}>{indisponibil}</span>}
        {imagine ? ( // avem fotografia preparatului
          <img className={styles.foto} src={imagine} alt="" width="720" height="540" loading="lazy" decoding="async" />// decorativă: numele e chiar dedesubt
        ) : ( // preparat fără fotografie
          <span className={`${styles.foto} ${styles.fotoGol}`} aria-hidden="true"><Iconita size={40} strokeWidth={1.5} /></span>// iconița categoriei, în aceeași cutie 4:3
        )}{/* sfârșitul randării condiționate */}
        <button // inima: comutator de favorite
          type="button" // buton simplu
          className={styles.inima} // cerc alb peste colțul fotografiei
          onClick={() => onFavorit(produs.id)} // anunțăm starea comună
          aria-pressed={favorit} // anunță dacă preparatul e salvat
          aria-label={`Salvează ${produs.preparat} la favorite`} // același nume în ambele stări; aria-pressed spune starea
        >
          <Heart size={20} aria-hidden="true" fill={favorit ? "currentColor" : "none"} />{/* plină când e favorit: forma spune starea, nu doar culoarea */}
        </button>
      </div>
      <div className={styles.info}>{/* textele preparatului */}
        <h3 className={styles.nume}>{produs.preparat}</h3>{/* numele preparatului */}
        {!faraRestaurant && ( // pe pagina restaurantului, numele lui e deja în titlu
          restaurant ? ( // restaurant cunoscut: link spre pagina lui
            <Link to={`/restaurante/${restaurant.slug}`} className={styles.restaurant}>{produs.restaurant}</Link> // numele restaurantului
          ) : ( // restaurant necunoscut: doar text
            <p className={styles.restaurant}>{produs.restaurant}</p> // numele, fără link
          )
        )}{/* sfârșitul randării condiționate */}
        <div className={styles.jos}>{/* prețul și acțiunea, pe același rând */}
          <span className={`price ${styles.pret}`}>{formatLei(produs.pret)}</span>{/* prețul unitar */}
          {cantitate > 0 ? ( // preparatul e deja în coș
            <Stepper preparat={produs.preparat} cantitate={cantitate} onSchimba={handleSchimba} plusRef={plusRef} /> // selectorul − cantitate +
          ) : indisponibil ? (
            <button type="button" className={`btn-secondary ${styles.adauga}`} disabled aria-label={`${produs.preparat}: ${indisponibil}, nu se poate adăuga în coș`}>
              {indisponibil}
            </button>
          ) : ( // nu e în coș
            <button ref={adaugaRef} type="button" className={`btn-primary ${styles.adauga}`} onClick={handleAdauga} aria-label={`Adaugă ${produs.preparat} în coș`}>{/* începe cu textul vizibil, ca să meargă și comanda vocală */}
              <Plus size={18} aria-hidden="true" />{/* iconiță decorativă */}
              Adaugă{/* textul vizibil */}
            </button>
          )}{/* sfârșitul randării condiționate */}
        </div>
      </div>
    </li>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
