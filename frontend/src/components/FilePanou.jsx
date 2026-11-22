import { useRef } from "react";
import styles from "./Panou.module.css";

// File (tabs) pentru paginile rolurilor: tiparul ARIA „tabs” cu activare automată.
// Săgețile stânga / dreapta, Home și End mută fila; doar fila aleasă e în ordinea Tab (roving tabindex).
// `file` = [{ id, titlu }]; panoul fiecărei file are id-ul `${prefix}-panou-${id}` și e randat de pagină cu <PanouFila>.
export default function FilePanou({ prefix, eticheta, file, activa, onAlege }) {
  const butoane = useRef(new Map());

  function alegeSiMuta(index) {
    const fila = file[(index + file.length) % file.length];
    onAlege(fila.id);
    butoane.current.get(fila.id)?.focus();
  }

  function handleKeyDown(e, index) {
    if (e.key === "ArrowRight") { e.preventDefault(); alegeSiMuta(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); alegeSiMuta(index - 1); }
    else if (e.key === "Home") { e.preventDefault(); alegeSiMuta(0); }
    else if (e.key === "End") { e.preventDefault(); alegeSiMuta(file.length - 1); }
  }

  return (
    <div role="tablist" aria-label={eticheta} className={styles.file}>
      {file.map((f, i) => (
        <button
          key={f.id}
          ref={(el) => { if (el) butoane.current.set(f.id, el); else butoane.current.delete(f.id); }}
          type="button"
          role="tab"
          id={`${prefix}-fila-${f.id}`}
          aria-selected={activa === f.id}
          aria-controls={`${prefix}-panou-${f.id}`}
          tabIndex={activa === f.id ? 0 : -1}
          className={styles.fila}
          onClick={() => onAlege(f.id)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          {f.titlu}
        </button>
      ))}
    </div>
  );
}

export function PanouFila({ prefix, id, children }) {
  return (
    <div role="tabpanel" id={`${prefix}-panou-${id}`} aria-labelledby={`${prefix}-fila-${id}`} tabIndex={0} className={styles.panouFila}>
      {children}
    </div>
  );
}
