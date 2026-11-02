import ComandaCard from "./ComandaCard.jsx"; // componenta pentru o singură comandă

// Primește lista și funcțiile și le transmite fiecărui card.
// Ordinea afișată e derivată: întâi comenzile pe drum, apoi cele livrate, sub un separator.
export default function ComandaList({ comenzi, onToggle, onDelete }) { // props: lista și callback-urile din App
  if (comenzi.length === 0) { // lista e goală
    return ( // afișăm starea „gol”
      <div className="empty">{/* containerul stării goale */}
        <FarfurieGoala />{/* ilustrația definită mai jos */}
        <p>Nu ai nicio comandă.</p>{/* mesajul principal */}
        <p className="empty-hint">Comenzile pe care le plasezi apar aici.</p>{/* mesajul secundar */}
      </div>
    ); // sfârșitul JSX-ului pentru lista goală
  } // sfârșitul ramurii if

  // sort e stabil: în fiecare grup rămâne ordinea din listă
  const ordonate = [...comenzi].sort((a, b) => a.livrata - b.livrata); // copie sortată (sort modifică array-ul, deci nu sortăm state-ul direct); false(0) înaintea lui true(1)
  const livrate = comenzi.filter((c) => c.livrata).length; // câte comenzi sunt livrate
  const primaLivrata = livrate > 0 && livrate < comenzi.length ? ordonate[comenzi.length - livrate].id : null; // id-ul primei livrate, doar dacă există ambele grupuri

  return ( // lista propriu-zisă
    <ul className="item-list">{/* lista neordonată */}
      {ordonate.map((comanda) => ( // pentru fiecare comandă randăm un rând
        <ComandaRand // componenta ajutătoare definită mai jos
          key={comanda.id} // key unic și stabil, ca React să știe ce element s-a mutat sau a dispărut
          comanda={comanda} // datele comenzii
          separator={comanda.id === primaLivrata ? livrate : 0} // numărul din separator, doar pentru prima livrată
          onToggle={onToggle} // transmitem callback-ul mai departe
          onDelete={onDelete} // la fel pentru ștergere
        />
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Cardul, precedat de separatorul „Livrate” când e prima comandă livrată
function ComandaRand({ separator, ...props }) { // scoatem `separator`, restul props-urilor merg în `props`
  return ( // întoarcem JSX
    <>{/* Fragment: grupează elemente fără să adauge un nod în DOM */}
      {separator > 0 && ( // separatorul apare doar când are un număr
        <li className="group-divider" role="presentation" style={{ viewTransitionName: "separator-livrate" }}>{/* role="presentation": nu e un element real al listei pentru cititoarele de ecran */}
          Livrate · {separator}{/* textul separatorului */}
        </li>
      )}{/* sfârșitul randării condiționate */}
      <ComandaCard {...props} />{/* spread: transmitem toate props-urile rămase cardului */}
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Ilustrația pentru lista goală: o farfurie goală, cu tacâmuri, în stilul iconițelor
function FarfurieGoala() { // componentă fără props
  return ( // întoarcem un SVG
    <svg className="empty-illus" width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">{/* decorativ */}
      <circle cx="60" cy="48" r="34" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />{/* farfuria; culorile vin din variabilele CSS ale temei */}
      <circle cx="60" cy="48" r="22" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 5" />{/* marginea interioară, punctată */}
      <path d="M14 22v14a4 4 0 0 0 4 4v34M18 22v12M22 22v14a4 4 0 0 1-4 4" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" />{/* furculița */}
      <path d="M102 74V22c4 3 6 9 6 16v6h-6" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* cuțitul */}
    </svg>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
