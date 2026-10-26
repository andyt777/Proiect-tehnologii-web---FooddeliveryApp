import ComandaCard from "./ComandaCard.jsx";

// Primește lista și funcțiile și le transmite fiecărui card.
// Ordinea afișată e derivată: întâi comenzile pe drum, apoi cele livrate, sub un separator.
export default function ComandaList({ comenzi, onToggle, onDelete }) {
  if (comenzi.length === 0) {
    return (
      <div className="empty">
        <FarfurieGoala />
        <p>Nu ai nicio comandă.</p>
        <p className="empty-hint">Comenzile pe care le plasezi apar aici.</p>
      </div>
    );
  }

  // sort e stabil: în fiecare grup rămâne ordinea din listă
  const ordonate = [...comenzi].sort((a, b) => a.livrata - b.livrata);
  const livrate = comenzi.filter((c) => c.livrata).length;
  const primaLivrata = livrate > 0 && livrate < comenzi.length ? ordonate[comenzi.length - livrate].id : null;

  return (
    <ul className="item-list">
      {ordonate.map((comanda) => (
        <ComandaRand
          key={comanda.id}
          comanda={comanda}
          separator={comanda.id === primaLivrata ? livrate : 0}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

// Cardul, precedat de separatorul „Livrate” când e prima comandă livrată
function ComandaRand({ separator, ...props }) {
  return (
    <>
      {separator > 0 && (
        <li className="group-divider" role="presentation" style={{ viewTransitionName: "separator-livrate" }}>
          Livrate · {separator}
        </li>
      )}
      <ComandaCard {...props} />
    </>
  );
}

// Ilustrația pentru lista goală: o farfurie goală, cu tacâmuri, în stilul iconițelor
function FarfurieGoala() {
  return (
    <svg className="empty-illus" width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <circle cx="60" cy="48" r="34" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      <circle cx="60" cy="48" r="22" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 5" />
      <path d="M14 22v14a4 4 0 0 0 4 4v34M18 22v12M22 22v14a4 4 0 0 1-4 4" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" />
      <path d="M102 74V22c4 3 6 9 6 16v6h-6" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
