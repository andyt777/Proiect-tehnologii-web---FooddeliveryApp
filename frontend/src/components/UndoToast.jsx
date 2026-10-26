import { Undo2 } from "lucide-react";

// Mesajul de după ștergere, cu „Anulează”. Regiunea există mereu, ca cititoarele de ecran
// să anunțe textul când apare.
export default function UndoToast({ stearsa, onUndo }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {stearsa && (
        <div className="toast">
          <span>„{stearsa.comanda.preparat}” a fost ștearsă.</span>
          <button className="toast-undo" onClick={onUndo}>
            <Undo2 size={16} aria-hidden="true" />
            Anulează
          </button>
        </div>
      )}
    </div>
  );
}
