import { useState } from "react";
import FormularProfilRestaurant from "./FormularProfilRestaurant.jsx";
import { useMagazin } from "../magazin.js";
import { profilRestaurant, stareRestaurant } from "../program.js";
import { RESTAURANTE_INFO } from "../restaurante.js";
import styles from "./Panou.module.css";

// Restaurantele în /admin: starea fiecăruia acum și același formular de profil / program / pauză ca în /restaurant
export default function AdminRestaurante() {
  const { profiluri, reincarcaProfiluri, ceas } = useMagazin();
  const [slug, setSlug] = useState(RESTAURANTE_INFO[0].slug);
  const ales = RESTAURANTE_INFO.find((r) => r.slug === slug) ?? RESTAURANTE_INFO[0];
  const profil = profilRestaurant(profiluri, ales.nume);

  return (
    <section className={styles.sectiune} aria-labelledby="admin-restaurante-titlu">
      <h2 id="admin-restaurante-titlu" className={styles.sectiuneTitlu}>Restaurante</h2>
      <dl className={styles.indicatori}>
        {RESTAURANTE_INFO.map((r) => {
          const p = profilRestaurant(profiluri, r.nume);
          return <div key={r.slug}><dt>{r.nume}</dt><dd>{stareRestaurant(p, ceas).eticheta}{p ? "" : " (fără program)"}</dd></div>;
        })}
      </dl>
      <div className={styles.bara}>
        <div className={styles.alegere}>
          <label htmlFor="admin-restaurant-ales">Editează restaurantul</label>
          <select id="admin-restaurant-ales" value={ales.slug} onChange={(e) => setSlug(e.target.value)}>
            {RESTAURANTE_INFO.map((r) => <option key={r.slug} value={r.slug}>{r.nume}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.sectiuneMica}>
        <FormularProfilRestaurant key={`${ales.slug}-${profil ? "salvat" : "nou"}`} restaurant={ales} profil={profil} onSalvat={reincarcaProfiluri} />
      </div>
    </section>
  );
}
