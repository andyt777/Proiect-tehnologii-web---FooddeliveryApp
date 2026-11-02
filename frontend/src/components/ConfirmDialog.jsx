import { useEffect, useRef } from "react"; // useRef: acces direct la elementul DOM; useEffect: cod rulat după randare
import { Trash2 } from "lucide-react"; // iconița coș de gunoi

// Confirmarea ștergerii, cu <dialog> propriu în loc de confirm() din browser.
// Se deschide cât timp primește o comandă; Esc, clicul pe fundal și „Renunță” o închid.
export default function ConfirmDialog({ comanda, onConfirm, onCancel }) { // props: comanda de șters (sau null) și două callback-uri
  const ref = useRef(null); // referință către <dialog>, completată de React după randare
  const apasatPeFundal = useRef(false); // true doar dacă apăsarea mouse-ului a început chiar pe fundal

  useEffect(() => { // sincronizăm elementul <dialog> cu prop-ul `comanda`
    const dialog = ref.current; // elementul DOM real
    if (comanda && !dialog.open) { // avem o comandă, dar dialogul e închis
      dialog.showModal(); // îl deschidem ca modal (blochează restul paginii)
      dialog.querySelector(".btn-secondary").focus(); // focus pe „Renunță”, varianta sigură
    } // sfârșitul ramurii de deschidere
    if (!comanda && dialog.open) dialog.close(); // nu mai e nicio comandă: închidem dialogul
  }, [comanda]); // efectul rulează doar când se schimbă `comanda`

  return ( // întoarcem JSX
    <dialog // elementul nativ HTML pentru ferestre modale
      ref={ref} // legăm referința de acest element
      className="dialog" // clasa pentru stiluri
      aria-labelledby="dialog-title" // titlul dialogului pentru cititoarele de ecran
      onClose={onCancel} // se declanșează și la Esc
      onPointerDown={(e) => (apasatPeFundal.current = e.target === e.currentTarget)} // reținem unde a început apăsarea
      onClick={(e) => apasatPeFundal.current && e.target === e.currentTarget && onCancel()} // renunțare doar dacă și apăsarea, și eliberarea sunt pe fundal
    >
      {comanda && ( // conținutul apare doar când avem o comandă
        <div className="dialog-body">{/* containerul conținutului */}
          <span className="dialog-icon" aria-hidden="true"><Trash2 size={24} /></span>{/* iconiță decorativă */}
          <h2 id="dialog-title">Ștergi comanda?</h2>{/* id-ul e folosit de aria-labelledby */}
          <p>{/* textul explicativ */}
            „{comanda.preparat}” de la {comanda.restaurant} dispare din listă.{/* numele preparatului și al restaurantului */}
          </p>
          <div className="dialog-actions">{/* rândul de butoane */}
            <button className="btn-secondary" onClick={onCancel}>Renunță</button>{/* închide fără ștergere */}
            <button className="btn-confirm" onClick={() => onConfirm(comanda.id)}>Șterge comanda</button>{/* trimite id-ul către App ca să șteargă */}
          </div>
        </div>
      )}{/* sfârșitul randării condiționate */}
    </dialog>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
