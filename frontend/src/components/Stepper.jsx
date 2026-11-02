import { Minus, Plus } from "lucide-react"; // iconițele minus și plus
import { CANTITATE_MAXIMA } from "../cos.js"; // limita de cantitate, ca să dezactivăm „+”

// Selectorul de cantitate „− 2 +”, folosit atât pe cardul din meniu, cât și în coș.
// Nu schimbă nimic singur: anunță doar `delta` (-1 sau +1) prin `onSchimba`.
export default function Stepper({ preparat, cantitate, onSchimba, plusRef }) { // plusRef (opțional): părintele poate muta focusul pe „+”
  return ( // întoarcem JSX
    <div className="stepper" role="group" aria-label={`Cantitate: ${preparat}`}>{/* role="group": cititorul de ecran anunță cele trei elemente împreună */}
      <button // butonul „−”
        type="button" // nu trimite formularul din coș
        className="stepper-btn" // clasa pentru stiluri
        onClick={() => onSchimba(-1)} // scădem cu 1
        aria-label={cantitate === 1 ? `Scoate ${preparat} din coș` : `Scade cantitatea pentru ${preparat}`} // la 1, „−” scoate linia, deci o spunem explicit
      >
        <Minus size={18} aria-hidden="true" />{/* iconiță decorativă */}
      </button>
      <span className="stepper-value" aria-live="polite" aria-atomic="true">{cantitate}</span>{/* aria-live: noua cantitate e citită după fiecare clic */}
      <button // butonul „+”
        ref={plusRef} // referința primită de la părinte (poate lipsi)
        type="button" // nu trimite formularul din coș
        className="stepper-btn" // clasa pentru stiluri
        onClick={() => cantitate < CANTITATE_MAXIMA && onSchimba(1)} // creștem cu 1, doar sub plafon
        aria-disabled={cantitate >= CANTITATE_MAXIMA} // aria-disabled, nu disabled: un buton `disabled` pierde focusul, iar utilizatorul de tastatură ar fi aruncat la începutul paginii
        aria-label={`Crește cantitatea pentru ${preparat}`} // nume accesibil, butonul are doar iconiță
      >
        <Plus size={18} aria-hidden="true" />{/* iconiță decorativă */}
      </button>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
