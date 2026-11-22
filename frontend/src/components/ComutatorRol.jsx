import { useEffect, useRef, useState } from "react"; // useState: panoul deschis; useRef: elementele; useEffect: clicul în afară
import { Check, UsersRound } from "lucide-react"; // iconițele comutatorului
import { ROLURI } from "../stari.js"; // cele patru roluri, în ordinea fixă
import { ETICHETE_ROL } from "../rol.js"; // textele rolurilor
import styles from "./ComutatorRol.module.css"; // stilurile (CSS Modules)

// Pachetul B: comutatorul de roluri din antet. Un <details> (se deschide cu Enter / Spațiu, fără JavaScript),
// cu un buton pentru fiecare rol și nota obligatorie: e o demonstrație, nu securitate.
// Butoane, nu radio: cu săgețile, un grup radio ar schimba rolul (și pagina) la fiecare apăsare.
export default function ComutatorRol({ rol, onAlege }) { // rolul curent și funcția apelată la alegere
  const [deschis, setDeschis] = useState(false); // panoul e la vedere?
  const detaliiRef = useRef(null); // elementul <details>
  const sumarRef = useRef(null); // butonul <summary>, primește focusul la închidere

  // Un clic în afara panoului îl închide
  useEffect(() => { // rulează când se deschide sau se închide
    if (!deschis) return; // închis: nu ascultăm nimic
    function laClic(e) { // clic oriunde în pagină
      if (detaliiRef.current && !detaliiRef.current.contains(e.target)) detaliiRef.current.open = false; // în afară: închidem (onToggle actualizează state-ul)
    } // sfârșitul funcției
    document.addEventListener("pointerdown", laClic); // ascultăm clicurile
    return () => document.removeEventListener("pointerdown", laClic); // cleanup
  }, [deschis]); // dependența: deschis / închis

  function inchide() { // închide panoul și întoarce focusul pe buton
    if (detaliiRef.current) detaliiRef.current.open = false; // <details> se închide
    sumarRef.current?.focus(); // focusul nu se pierde pe <body>
  } // sfârșitul funcției

  function handleKeyDown(e) { // Esc închide panoul, ca la un meniu
    if (e.key === "Escape" && detaliiRef.current?.open) { e.preventDefault(); inchide(); } // doar când e deschis
  } // sfârșitul funcției

  function alege(nou) { // un buton de rol
    inchide(); // panoul dispare
    onAlege(nou); // Layout schimbă rolul și pagina
  } // sfârșitul funcției

  return ( // JSX-ul comutatorului
    <details ref={detaliiRef} className={styles.comutator} onToggle={(e) => setDeschis(e.currentTarget.open)} onKeyDown={handleKeyDown}>{/* onToggle: state-ul urmează elementul */}
      <summary ref={sumarRef} className={styles.buton}>{/* butonul din antet */}
        <UsersRound size={18} aria-hidden="true" />{/* iconiță decorativă */}
        <span className={styles.text}>Rol: {ETICHETE_ROL[rol]}</span>{/* rolul curent; pe telefon doar iconița, textul rămâne pentru cititoare */}
      </summary>
      <div className={styles.panou}>{/* panoul care plutește sub antet */}
        <p id="rol-titlu" className={styles.titlu}>Vezi aplicația ca</p>{/* titlul grupului */}
        <ul className={styles.lista} aria-labelledby="rol-titlu">{/* rolurile */}
          {ROLURI.map((r) => ( // un buton pentru fiecare rol
            <li key={r}>{/* rolul e unic */}
              <button type="button" className={styles.optiune} aria-pressed={rol === r} onClick={() => alege(r)}>{/* aria-pressed: rolul ales */}
                <span>{ETICHETE_ROL[r]}</span>{/* numele rolului */}
                {rol === r && <Check size={16} aria-hidden="true" />}{/* bifa arată rolul curent, nu doar culoarea */}
              </button>
            </li>
          ))}{/* sfârșitul map-ului */}
        </ul>
        <p className={styles.nota}>Demo, nu securitate: oricine poate alege orice rol. Nu există conturi sau parole, iar serverul demo acceptă orice modificare.</p>{/* nota cerută de spec */}
      </div>
    </details>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
