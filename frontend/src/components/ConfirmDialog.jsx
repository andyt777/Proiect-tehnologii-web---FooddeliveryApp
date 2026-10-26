import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

// Confirmarea ștergerii, cu <dialog> propriu în loc de confirm() din browser.
// Se deschide cât timp primește o comandă; Esc, clicul pe fundal și „Renunță” o închid.
export default function ConfirmDialog({ comanda, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (comanda && !dialog.open) {
      dialog.showModal();
      dialog.querySelector(".btn-secondary").focus();
    }
    if (!comanda && dialog.open) dialog.close();
  }, [comanda]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onCancel}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      {comanda && (
        <div className="dialog-body">
          <span className="dialog-icon" aria-hidden="true"><Trash2 size={24} /></span>
          <h2 id="dialog-title">Ștergi comanda?</h2>
          <p>
            „{comanda.preparat}” de la {comanda.restaurant} dispare din listă.
          </p>
          <div className="dialog-actions">
            <button className="btn-secondary" onClick={onCancel}>Renunță</button>
            <button className="btn-confirm" onClick={() => onConfirm(comanda.id)}>Șterge comanda</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
