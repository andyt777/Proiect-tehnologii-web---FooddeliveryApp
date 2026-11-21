import { CircleCheck, Undo2 } from "lucide-react"; // iconițele: bifă (confirmare) și săgeata „înapoi”
import { formatLei, formatProduse } from "../format.js"; // texte pentru mesajul de confirmare
import styles from "./UndoToast.module.css"; // Etapa 8: stilurile mesajelor (CSS Modules)

// Mesajele de jos. Redesign „Pădure”: regiunea stă în Layout (confirmarea plasării vine de pe /cos și se vede și pe „/”),
// iar „Anulează” e trimis acolo de ComenziPage printr-un portal. Regiunea există mereu, ca cititoarele de ecran să anunțe textul.

// Regiunea comună, în Layout. `ref` (prop obișnuit în React 19) primește un <div> gol, doar pentru portal:
// React nu amestecă astfel copiii lui (confirmarea) cu ce adaugă portalul (Anulează)
export function RegiuneToast({ ref, children }) { // children = confirmarea, dacă există
  return ( // întoarcem JSX
    <div className={styles.region} role="status" aria-live="polite">{/* aria-live: cititorul de ecran anunță ce apare aici */}
      {children}{/* confirmarea */}
      <div ref={ref} className={styles.slot} />{/* locul mesajelor trimise prin portal */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// „Comanda a fost plasată: 3 produse, 154 lei.”
export function ToastConfirmare({ confirmare }) { // { produse, total } sau null
  if (!confirmare) return null; // nimic de arătat
  return ( // întoarcem JSX
    <div className={`${styles.toast} ${styles.ok}`}>{/* cutia mesajului, fără buton */}
      <CircleCheck size={18} aria-hidden="true" />{/* iconiță decorativă */}
      <span>Comanda a fost plasată: {formatProduse(confirmare.produse)}, {formatLei(confirmare.total)}.</span>{/* ex. „3 produse, 154 lei” */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// „„Pizza Diavola” a fost ștearsă.” cu butonul „Anulează”
export default function UndoToast({ stearsa, onUndo }) { // props: comanda ștearsă (sau null) și funcția de anulare
  if (!stearsa) return null; // mesajul apare doar dacă există o comandă ștearsă
  return ( // întoarcem JSX
    <div className={styles.toast}>{/* cutia vizibilă a mesajului */}
      <span>„{stearsa.comanda.preparat}” a fost ștearsă.</span>{/* textul cu numele preparatului */}
      <button type="button" className={styles.undo} onClick={onUndo}>{/* la clic, ComenziPage readuce comanda */}
        <Undo2 size={16} aria-hidden="true" />{/* iconiță decorativă */}
        Anulează{/* textul butonului */}
      </button>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
