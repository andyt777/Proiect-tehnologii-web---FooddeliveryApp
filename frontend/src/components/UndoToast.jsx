import { CircleCheck, Undo2 } from "lucide-react"; // iconițele: bifă (confirmare) și săgeata „înapoi”
import { formatLei, formatProduse } from "../format.js"; // texte pentru mesajul de confirmare

// Mesajele de jos: „Anulează” după ștergere și confirmarea după plasarea unei comenzi.
// Regiunea există mereu, ca cititoarele de ecran să anunțe textul când apare.
export default function UndoToast({ stearsa, onUndo, confirmare }) { // props: comanda ștearsă (sau null), funcția de anulare, confirmarea (sau null)
  return ( // întoarcem JSX
    <div className="toast-region" role="status" aria-live="polite">{/* aria-live: cititorul de ecran anunță ce apare aici */}
      {confirmare && ( // mesajul apare doar după o comandă plasată
        <div className="toast toast-ok">{/* cutia mesajului, fără buton */}
          <CircleCheck size={18} aria-hidden="true" />{/* iconiță decorativă */}
          <span>Comanda a fost plasată: {formatProduse(confirmare.produse)}, {formatLei(confirmare.total)}.</span>{/* ex. „3 produse, 154 lei” */}
        </div>
      )}{/* sfârșitul randării condiționate */}
      {stearsa && ( // randare condiționată: mesajul apare doar dacă există o comandă ștearsă
        <div className="toast">{/* cutia vizibilă a mesajului */}
          <span>„{stearsa.comanda.preparat}” a fost ștearsă.</span>{/* textul cu numele preparatului */}
          <button className="toast-undo" onClick={onUndo}>{/* la clic, App readuce comanda */}
            <Undo2 size={16} aria-hidden="true" />{/* iconiță decorativă */}
            Anulează{/* textul butonului */}
          </button>
        </div>
      )}{/* sfârșitul randării condiționate */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
