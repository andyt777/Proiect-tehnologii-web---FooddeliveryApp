import GrilaPreparate from "./GrilaPreparate.jsx";
import { explicatieRecomandari, recomandari } from "../recomandari.js";
import styles from "./PentruTine.module.css";

// Câte preparate arată rândul: trei, cât un rând întreg din grila de pe desktop
const NUMAR_RECOMANDARI = 3;

// Pachetul C: rândul „Pentru tine” de pe pagina principală. Recomandările vin din reguli simple aplicate
// istoricului de comenzi (recomandari.js), nu dintr-un model AI; regula folosită e spusă sub titlu.
// Fără istoric (sau fără preparate potrivite din meniu), rândul nu apare deloc.
export default function PentruTine({ comenzi, meniu }) {
  const rezultat = recomandari(comenzi, meniu, NUMAR_RECOMANDARI);
  if (rezultat.preparate.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="pentru-tine">
      <div className="section-header">
        <h2 id="pentru-tine">Pentru tine</h2>
      </div>
      <p className={styles.explicatie}>{explicatieRecomandari(rezultat)}</p>
      <GrilaPreparate preparate={rezultat.preparate} />
    </section>
  );
}
