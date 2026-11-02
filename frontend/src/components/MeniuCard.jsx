import { useEffect, useRef } from "react"; // useRef: referințe la butoane; useEffect: mutăm focusul după randare
import { Plus } from "lucide-react"; // iconița plus de pe „Adaugă”
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { formatLei } from "../format.js"; // formatarea prețului

// Un preparat din meniu: iconiță, nume ..... preț, restaurant și butonul de adăugare.
// Cât timp preparatul e în coș, butonul „Adaugă” e înlocuit de selectorul de cantitate.
export default function MeniuCard({ produs, cantitate, onAdauga, onSchimba }) { // props: preparatul, cantitatea din coș (0 = nu e în coș) și callback-urile
  const Iconita = ICONITE_CATEGORIE[produs.categorie]; // componenta iconiței categoriei
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
    onAdauga(produs.id); // anunțăm App
  } // sfârșitul funcției

  function handleSchimba(delta) { // clic pe „−” sau „+”
    if (cantitate + delta <= 0) focusDupa.current = "adauga"; // linia dispare, deci revine butonul „Adaugă”
    onSchimba(produs.id, delta); // anunțăm App
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <li className="menu-card">{/* un element al grilei de preparate */}
      <span className="thumb" aria-hidden="true"><Iconita size={22} strokeWidth={1.75} /></span>{/* iconița categoriei */}
      <div className="menu-info">{/* textele preparatului */}
        <div className="card-top">{/* titlu ..... preț, ca pe un meniu tipărit */}
          <h3>{produs.preparat}</h3>{/* numele preparatului */}
          <span className="dots" aria-hidden="true" />{/* punctele dintre titlu și preț */}
          <span className="price">{formatLei(produs.pret)}</span>{/* prețul unitar */}
        </div>
        <p className="menu-restaurant">{produs.restaurant}</p>{/* restaurantul */}
      </div>
      <div className="menu-action">{/* rândul cu butonul / selectorul */}
        {cantitate > 0 ? ( // preparatul e deja în coș
          <Stepper preparat={produs.preparat} cantitate={cantitate} onSchimba={handleSchimba} plusRef={plusRef} /> // selectorul − cantitate +
        ) : ( // nu e în coș
          <button // butonul de adăugare
            ref={adaugaRef} // ca să-i putem da focus înapoi
            type="button" // buton simplu
            className="btn-add" // clasa pentru stiluri
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
