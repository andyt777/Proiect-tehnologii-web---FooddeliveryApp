import { useMagazin } from "../magazin.js"; // rolul curent și schimbarea lui
import { ETICHETE_ROL } from "../rol.js"; // textele rolurilor
import styles from "./Panou.module.css"; // stilurile comune ale panourilor (CSS Modules)

// Pachetul B: paginile /restaurant, /livrator și /admin se arată doar în rolul lor. Altfel, o explicație și un buton.
// Nu e o protecție: rolul e un comutator demo, oricine îl poate schimba (de aici sau din antet).
export default function PoartaRol({ rol, titlu, children }) { // rolul paginii, titlul ei și conținutul
  const { rol: rolCurent, setRol } = useMagazin(); // starea comună
  if (rolCurent === rol) return children; // rolul potrivit: pagina normală

  return ( // JSX-ul explicației
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <h1 className={styles.titlu}>{titlu}</h1>{/* titlul paginii, ca orice pagină */}
      <div className="empty">{/* starea „nu e pentru tine” */}
        <p>Pagina e pentru rolul {ETICHETE_ROL[rol]}</p>{/* mesajul principal */}
        <p className="empty-hint">Acum vezi aplicația ca {ETICHETE_ROL[rolCurent]}. Rolurile sunt un comutator demo, nu conturi: poți trece oricând la alt rol.</p>{/* ce se întâmplă și de ce */}
        <button type="button" className="btn-primary" onClick={() => setRol(rol)}>Treci la rolul {ETICHETE_ROL[rol]}</button>{/* ce poate face utilizatorul */}
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
