import { useEffect, useState } from "react";
import { useMiscareRedusa } from "../miscareRedusa.js";
import { INALTIME_TRASEU, LATIME_TRASEU, PUNCTE_TRASEU, etapaInMiscare, pozitieTraseu, progresUrmator } from "../traseu.js";
import styles from "./Panou.module.css";

// Pachetul B: traseul simulat al unei curse, desenat ca SVG (fără hartă, fără GPS).
// Pagina îi dă key={`${id}-${pas}`}: la fiecare pas nou componenta pornește de la zero, deci progresul nu trebuie resetat într-un efect.
// Cu „mișcare redusă” cronometrul nu pornește: livratorul stă la jumătatea drumului curent, iar textul spune etapa.
export default function TraseuSimulat({ pas }) {
  const redusa = useMiscareRedusa();
  const [progres, setProgres] = useState(0);
  const inMiscare = etapaInMiscare(pas);

  useEffect(() => {
    if (!inMiscare || redusa) return;
    const cronometru = setInterval(() => setProgres((p) => progresUrmator(p)), 1000);
    return () => clearInterval(cronometru);
  }, [inMiscare, redusa]);

  const progresAfisat = inMiscare && redusa ? 0.5 : progres;
  const { x, y } = pozitieTraseu(pas, progresAfisat);
  const { start, restaurant, client } = PUNCTE_TRASEU;
  const descriere = inMiscare
    ? redusa
      ? `Livratorul e pe drum ${pas === "spre_restaurant" ? "spre restaurant" : "spre client"}.`
      : `Livratorul e pe drum ${pas === "spre_restaurant" ? "spre restaurant" : "spre client"}: ${Math.round(progres * 100)}% din drum (simulare).`
    : pas === "preluata"
      ? "Livratorul e la restaurant, cu comanda."
      : pas === "livrata"
        ? "Livratorul a ajuns la client."
        : "Livratorul e la punctul de plecare.";

  return (
    <figure className={styles.figura}>
      <svg className={styles.traseu} viewBox={`0 0 ${LATIME_TRASEU} ${INALTIME_TRASEU}`} role="img" aria-label={`Traseu simulat. ${descriere}`}>
        <polyline className={styles.traseuDrum} points={`${start.x},${start.y} ${restaurant.x},${restaurant.y} ${client.x},${client.y}`} />
        <circle className={styles.traseuPunct} cx={restaurant.x} cy={restaurant.y} r="9" />
        <text className={styles.traseuText} x={restaurant.x} y={restaurant.y - 18} textAnchor="middle">Restaurant</text>
        <circle className={styles.traseuPunct} cx={client.x} cy={client.y} r="9" />
        <text className={styles.traseuText} x={client.x} y={client.y + 30} textAnchor="middle">Client</text>
        <g className={styles.traseuLivrator} style={{ transform: `translate(${x}px, ${y}px)` }}>
          <circle r="11" />
        </g>
      </svg>
      <figcaption className={styles.indiciu}>{descriere} Poziția e o simulare care avansează singură; nu e o hartă reală și nu folosește GPS.</figcaption>
    </figure>
  );
}
