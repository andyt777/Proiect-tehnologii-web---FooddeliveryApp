import { Minus, Plus } from "lucide-react"; // iconițele minus și plus
import { CANTITATE_MAXIMA } from "../cos.js"; // limita de cantitate, ca să dezactivăm „+”
import styles from "./Stepper.module.css"; // Etapa 8: stilurile selectorului (CSS Modules)

// Selectorul de cantitate „− 2 +”, folosit atât pe cardul din meniu, cât și în coș.
// Nu schimbă nimic singur: anunță doar `delta` (-1 sau +1) prin `onSchimba`.
// Etapa 8: `className` (opțional) adaugă o clasă din modulul părintelui (cardul din meniu pune selectorul peste fotografie).
export default function Stepper({ preparat, cantitate, onSchimba, plusRef, className }) { // plusRef (opțional): părintele poate muta focusul pe „+”; className (opțional): clasă în plus
  return ( // întoarcem JSX
    <div className={className ? `${styles.stepper} ${className}` : styles.stepper} role="group" aria-label={`Cantitate: ${preparat}`}>{/* role="group": cititorul de ecran anunță cele trei elemente împreună */}
      <button // butonul „−”
        type="button" // nu trimite formularul din coș
        className={styles.btn} // clasa din modul
        onClick={() => onSchimba(-1)} // scădem cu 1
        aria-label={cantitate === 1 ? `Scoate ${preparat} din coș` : `Scade cantitatea pentru ${preparat}`} // la 1, „−” scoate linia, deci o spunem explicit
      >
        <Minus size={18} aria-hidden="true" />{/* iconiță decorativă */}
      </button>
      <span className={styles.value} aria-live="polite" aria-atomic="true">{cantitate}</span>{/* aria-live: noua cantitate e citită după fiecare clic */}
      <button // butonul „+”
        ref={plusRef} // referința primită de la părinte (poate lipsi)
        type="button" // nu trimite formularul din coș
        className={styles.btn} // clasa din modul
        onClick={() => cantitate < CANTITATE_MAXIMA && onSchimba(1)} // creștem cu 1, doar sub plafon
        aria-disabled={cantitate >= CANTITATE_MAXIMA} // aria-disabled, nu disabled: un buton `disabled` pierde focusul, iar utilizatorul de tastatură ar fi aruncat la începutul paginii
        aria-label={`Crește cantitatea pentru ${preparat}`} // nume accesibil, butonul are doar iconiță
      >
        <Plus size={18} aria-hidden="true" />{/* iconiță decorativă */}
      </button>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
