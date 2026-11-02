import { SearchX } from "lucide-react"; // iconița „căutare fără rezultat”

// Starea goală a căutării, folosită și de meniu, și de lista de comenzi.
// Butonul golește căutarea; App mută apoi focusul în câmpul de căutare (butonul dispare odată cu mesajul).
export default function CautareGoala({ mesaj, onSterge }) { // props: textul principal și callback-ul de ștergere
  return ( // întoarcem JSX
    <div className="empty">{/* același stil ca lista goală */}
      <span className="empty-icon" aria-hidden="true"><SearchX size={26} /></span>{/* iconiță decorativă */}
      <p>{mesaj}</p>{/* ex. „Niciun preparat pentru „sarmale”” */}
      <p className="empty-hint">Verifică scrierea sau caută după numele restaurantului.</p>{/* indicația */}
      <button type="button" className="btn-secondary" onClick={onSterge}>Șterge căutarea</button>{/* arată din nou toată lista */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
