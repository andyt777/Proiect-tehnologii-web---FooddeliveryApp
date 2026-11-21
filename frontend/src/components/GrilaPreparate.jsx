import MeniuCard from "./MeniuCard.jsx"; // cardul unui preparat
import { useMagazin } from "../magazin.js"; // coșul și favoritele, din starea comună
import styles from "./GrilaPreparate.module.css"; // stilurile grilei (CSS Modules)

// Redesign „Pădure”: grila de preparate, aceeași pe pagina principală, pe pagina unui restaurant și pe /favorite.
// Coșul și favoritele vin din starea comună (Layout), deci cardurile se actualizează și când schimbi ceva din coș.
// onInainteDeFavorit (opțional): /favorite mută focusul înainte ca un card să dispară din listă.
export default function GrilaPreparate({ preparate, faraRestaurant = false, onInainteDeFavorit }) { // props: lista deja filtrată
  const { cos, adauga, schimba, favorite, comutaFavorit } = useMagazin(); // starea comună
  const cantitati = Object.fromEntries(cos.map((l) => [l.produsId, l.cantitate])); // { p1: 2, p4: 1 } pentru căutare rapidă

  function handleFavorit(id) { // inima de pe un card
    onInainteDeFavorit?.(id); // pagina poate pregăti focusul
    comutaFavorit(id); // adăugăm sau scoatem
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <ul className={styles.grid}>{/* grila de carduri */}
      {preparate.map((produs) => ( // un card pentru fiecare preparat
        <MeniuCard // cardul preparatului
          key={produs.id} // id-ul e unic și stabil
          produs={produs} // datele preparatului
          cantitate={cantitati[produs.id] ?? 0} // 0 dacă nu e în coș
          favorit={favorite.includes(produs.id)} // inima plină sau goală
          onAdauga={adauga} // „Adaugă”
          onSchimba={schimba} // „−” / „+”
          onFavorit={handleFavorit} // inima
          faraRestaurant={faraRestaurant} // pe pagina restaurantului nu repetăm numele lui
        />
      ))}{/* sfârșitul map-ului */}
    </ul>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
