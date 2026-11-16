import ComandaCard from "./ComandaCard.jsx"; // componenta pentru o singură comandă
import styles from "./ComandaList.module.css"; // Etapa 8: stilurile listei (CSS Modules)

// Primește lista și funcțiile și le transmite fiecărui card.
// Ordinea afișată e derivată: întâi comenzile pe drum, apoi cele livrate, fiecare grup sub separatorul lui.
export default function ComandaList({ comenzi, onToggle, onDelete }) { // props: lista și callback-urile din ComenziPage
  if (comenzi.length === 0) { // lista e goală
    return ( // afișăm starea „gol”
      <div className="empty">{/* containerul stării goale */}
        <FarfurieGoala />{/* ilustrația definită mai jos */}
        <p data-testid="empty">Nu ai nicio comandă.</p>{/* mesajul principal; Etapa 7: data-testid="empty", doar când nu există nicio comandă */}
        <p className="empty-hint">Comenzile din coș și cererile speciale apar aici.</p>{/* mesajul secundar; Etapa 7: și formularul adaugă comenzi */}
      </div>
    ); // sfârșitul JSX-ului pentru lista goală
  } // sfârșitul ramurii if

  // sort e stabil: în fiecare grup rămâne ordinea din listă
  const ordonate = [...comenzi].sort((a, b) => a.livrata - b.livrata); // copie sortată (sort modifică array-ul, deci nu sortăm state-ul direct); false(0) înaintea lui true(1)
  const livrate = comenzi.filter((c) => c.livrata).length; // câte comenzi sunt livrate
  const peDrum = comenzi.length - livrate; // restul sunt pe drum

  return ( // lista propriu-zisă
    <ul className={styles.list}>{/* o singură listă; separatoarele sunt rânduri ale ei */}
      {ordonate.map((comanda, i) => ( // pentru fiecare comandă randăm un rând
        <ComandaRand // componenta ajutătoare definită mai jos
          key={comanda.id} // key unic și stabil, ca React să știe ce element s-a mutat sau a dispărut
          comanda={comanda} // datele comenzii
          separator={separatorInainte(ordonate, i, peDrum, livrate)} // separatorul dinaintea rândului (sau null)
          onToggle={onToggle} // transmitem callback-ul mai departe
          onDelete={onDelete} // la fel pentru ștergere
        />
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Separatorul unui grup apare înaintea primei lui comenzi, oricând grupul are cel puțin o comandă
// (și când există un singur grup: titlul spune ce fel de comenzi sunt în listă)
function separatorInainte(ordonate, i, peDrum, livrate) { // lista sortată, poziția rândului și mărimea grupurilor
  const comanda = ordonate[i]; // rândul curent
  const primaDinGrup = i === 0 || ordonate[i - 1].livrata !== comanda.livrata; // rândul de dinainte e din alt grup (sau nu există)
  if (!primaDinGrup) return null; // în mijlocul grupului: fără separator
  return comanda.livrata ? { id: "livrate", text: "Livrate", numar: livrate } : { id: "pe-drum", text: "Pe drum", numar: peDrum }; // id-ul dă și numele unic pentru View Transitions
} // sfârșitul funcției

// Cardul, precedat de separatorul grupului când e prima comandă din grup
function ComandaRand({ separator, ...props }) { // scoatem `separator`, restul props-urilor merg în `props`
  return ( // întoarcem JSX
    <>{/* Fragment: grupează elemente fără să adauge un nod în DOM */}
      {separator && ( // separatorul apare doar înaintea primei comenzi din grup
        <li className={styles.divider} role="presentation" style={{ viewTransitionName: `separator-${separator.id}` }}>{/* role="presentation": nu e un element real al listei pentru cititoarele de ecran; nume unic per separator */}
          {separator.text} · {separator.numar}{/* ex. „Pe drum · 3” */}
        </li>
      )}{/* sfârșitul randării condiționate */}
      <ComandaCard {...props} />{/* spread: transmitem toate props-urile rămase cardului */}
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Ilustrația pentru lista goală: o farfurie goală, cu tacâmuri, în stilul iconițelor
function FarfurieGoala() { // componentă fără props
  return ( // întoarcem un SVG
    <svg className={styles.illus} width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">{/* decorativ */}
      <circle cx="60" cy="48" r="34" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />{/* farfuria; culorile vin din variabilele CSS ale temei */}
      <circle cx="60" cy="48" r="22" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 5" />{/* marginea interioară, punctată */}
      <path d="M14 22v14a4 4 0 0 0 4 4v34M18 22v12M22 22v14a4 4 0 0 1-4 4" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" />{/* furculița */}
      <path d="M102 74V22c4 3 6 9 6 16v6h-6" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* cuțitul */}
    </svg>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
