import { useEffect, useRef } from "react"; // useRef: referințe la butoane; useEffect: mutăm focusul după randare
import { Plus } from "lucide-react"; // iconița plus de pe „Adaugă”
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { imaginePreparat } from "../imagini.js"; // fotografia preparatului (sau null)
import { formatLei } from "../format.js"; // formatarea prețului
import styles from "./MeniuCard.module.css"; // Etapa 8: stilurile cardului (CSS Modules)

// Un preparat din meniu: fotografie, nume ..... preț, restaurant și butonul de adăugare peste fotografie.
// Cât timp preparatul e în coș, butonul „Adaugă” e înlocuit de selectorul de cantitate.
export default function MeniuCard({ produs, cantitate, onAdauga, onSchimba }) { // props: preparatul, cantitatea din coș (0 = nu e în coș) și callback-urile
  const Iconita = ICONITE_CATEGORIE[produs.categorie]; // componenta iconiței categoriei (când nu avem fotografie)
  const imagine = imaginePreparat(produs.preparat); // „/img/....webp” sau null
  const adaugaRef = useRef(null); // butonul „Adaugă”
  const plusRef = useRef(null); // butonul „+” din selector
  // Butonul apăsat dispare la randare (Adaugă -> selector, sau selector -> Adaugă), iar focusul s-ar pierde.
  // Ținem minte unde trebuie să ajungă focusul și îl mutăm după ce React a desenat noul buton.
  const focusDupa = useRef(null); // "plus", "adauga" sau null

  useEffect(() => { // rulează după fiecare schimbare a cantității
    if (focusDupa.current === "plus") plusRef.current?.focus(); // după „Adaugă”: focus pe „+”, ca a doua apăsare să mai adauge una
    if (focusDupa.current === "adauga") adaugaRef.current?.focus(); // după ce linia a dispărut: focus înapoi pe „Adaugă”
    focusDupa.current = null; // cererea a fost îndeplinită
  }, [cantitate]); // doar când se schimbă cantitatea (și din coș, dar atunci focusDupa e null)

  function handleAdauga() { // clic pe „Adaugă”
    focusDupa.current = "plus"; // după randare, focusul trece pe „+”
    onAdauga(produs.id); // anunțăm ComenziPage
  } // sfârșitul funcției

  function handleSchimba(delta) { // clic pe „−” sau „+”
    if (cantitate + delta <= 0) focusDupa.current = "adauga"; // linia dispare, deci revine butonul „Adaugă”
    onSchimba(produs.id, delta); // anunțăm ComenziPage
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <li className={styles.card}>{/* un element al grilei de preparate */}
      {imagine ? ( // avem fotografia preparatului
        <img // fotografia, 4:3
          className={styles.foto} // colțuri rotunjite, aceeași formă în toate cardurile
          src={imagine} // ex. „/img/gyoza.webp”
          alt="" // decorativă: numele preparatului e chiar dedesubt
          width="720" // dimensiunile reale, ca browserul să rezerve locul înainte să sosească imaginea
          height="540" // la fel
          loading="lazy" // meniul e sub hero: se încarcă doar când ajunge aproape de ecran
          decoding="async" // decodarea nu blochează desenarea paginii
        />
      ) : ( // preparat fără fotografie
        <span className={`${styles.foto} ${styles.fotoGol}`} aria-hidden="true"><Iconita size={40} strokeWidth={1.5} /></span>// iconița categoriei, în aceeași cutie 4:3
      )}{/* sfârșitul randării condiționate */}
      <div className={styles.info}>{/* textele preparatului */}
        <div className="card-top">{/* titlu ..... preț, ca pe un meniu tipărit */}
          <h3>{produs.preparat}</h3>{/* numele preparatului */}
          <span className="dots" aria-hidden="true" />{/* punctele dintre titlu și preț */}
          <span className="price">{formatLei(produs.pret)}</span>{/* prețul unitar */}
        </div>
        <p className={styles.restaurant}>{produs.restaurant}</p>{/* restaurantul */}
      </div>
      <div className={styles.action}>{/* butonul / selectorul, așezat din CSS peste colțul fotografiei */}
        {cantitate > 0 ? ( // preparatul e deja în coș
          <Stepper preparat={produs.preparat} cantitate={cantitate} onSchimba={handleSchimba} plusRef={plusRef} className={styles.stepper} /> // selectorul − cantitate +; Etapa 8: clasa din modul îl pune peste fotografie
        ) : ( // nu e în coș
          <button // butonul de adăugare
            ref={adaugaRef} // ca să-i putem da focus înapoi
            type="button" // buton simplu
            className={styles.btnAdd} // clasa din modul
            onClick={handleAdauga} // adăugăm în coș
            aria-label={`Adaugă ${produs.preparat} în coș`} // începe cu textul vizibil („Adaugă”), ca să meargă și comanda vocală
          >
            <Plus size={18} aria-hidden="true" />{/* iconiță decorativă */}
            Adaugă{/* textul vizibil */}
          </button>
        )}{/* sfârșitul randării condiționate */}
      </div>
    </li>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
