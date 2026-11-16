import { useRef, useState } from "react"; // useState: câmpurile, eroarea și trimiterea; useRef: focus pe câmpuri
import { Send } from "lucide-react"; // iconița butonului de trimitere
import { PREPARAT_MAX, RESTAURANTE, TIPURI_LIVRARE } from "../constants.js"; // valorile fixe ale formularului
import { ETICHETE_LIVRARE } from "../livrare.js"; // textele afișate pentru tipurile de livrare
import { comandaSpecialaNoua, valideazaComandaSpeciala } from "../validare.js"; // validarea și obiectul trimis, funcții pure

const RESTAURANT_IMPLICIT = RESTAURANTE[0].nume; // „Pizzeria Napoli”, primul din listă
const LIVRARE_IMPLICITA = "standard"; // ca în coș, livrarea pornește de la Standard

// Etapa 7: „Comandă specială” — clientul cere unui restaurant un preparat care nu e în meniu.
// Formular controlat: state-ul React e sursa de adevăr pentru fiecare câmp (value + onChange).
// Nu apelează fetch: validează, trimite datele prin onAdd (primit de la App) și afișează eroarea, dacă apare.
export default function ComandaForm({ onAdd, blocat = false }) { // props: funcția de adăugare și blocat = lista încă se încarcă
  const [preparat, setPreparat] = useState(""); // textul din câmpul „Preparat”
  const [restaurant, setRestaurant] = useState(RESTAURANT_IMPLICIT); // restaurantul ales
  const [livrare, setLivrare] = useState(LIVRARE_IMPLICITA); // tipul de livrare ales
  const [eroare, setEroare] = useState(""); // mesajul de eroare ("" = niciuna)
  const [campGresit, setCampGresit] = useState(null); // câmpul marcat cu aria-invalid (null = niciunul)
  const [trimite, setTrimite] = useState(false); // true cât timp așteptăm serverul
  const [trimisa, setTrimisa] = useState(""); // confirmarea ultimei trimiteri reușite ("" = ascunsă)
  const preparatRef = useRef(null); // câmpul „Preparat”, ca să-i putem da focus
  const restaurantRef = useRef(null); // lista „Restaurant”
  const livrareRef = useRef(null); // lista „Livrare”

  async function handleSubmit(e) { // trimiterea formularului
    e.preventDefault(); // oprește reîncărcarea paginii
    if (trimite || blocat) return; // siguranță în plus față de butonul dezactivat
    setTrimisa(""); // ascundem confirmarea veche
    const problema = valideazaComandaSpeciala({ preparat, restaurant, livrare }); // null sau { camp, mesaj }
    if (problema) { // datele nu sunt bune: nu trimitem nimic
      setEroare(problema.mesaj); // mesajul apare lângă formular, nu cu alert
      setCampGresit(problema.camp); // câmpul greșit primește aria-invalid
      const refCamp = { preparat: preparatRef, restaurant: restaurantRef, livrare: livrareRef }[problema.camp]; // referința câmpului greșit (obiectul e creat aici, în handler, nu la randare)
      refCamp.current?.focus(); // utilizatorul ajunge direct la câmpul de corectat
      return; // ne oprim aici
    } // sfârșitul validării
    setEroare(""); // ștergem eroarea rămasă de la o încercare anterioară
    setCampGresit(null); // niciun câmp marcat
    setTrimite(true); // butonul se dezactivează și arată „Se trimite…”: un dublu clic nu creează două comenzi
    try { // cererea poate eșua (server oprit, eroare HTTP, timeout)
      await onAdd(comandaSpecialaNoua({ preparat, restaurant, livrare })); // App trimite la server și adaugă în listă ce s-a salvat
      setTrimisa(`Cererea pentru „${preparat.trim()}” a ajuns la ${restaurant}.`); // confirmarea, citită și de cititoarele de ecran
      setPreparat(""); // golim câmpurile doar după ce serverul a confirmat
      setRestaurant(RESTAURANT_IMPLICIT); // înapoi la valoarea implicită
      setLivrare(LIVRARE_IMPLICITA); // înapoi la valoarea implicită
    } catch (err) { // salvarea a eșuat: textul rămâne în câmp, ca utilizatorul să poată încerca din nou
      setEroare(`Cererea nu a fost trimisă: ${err.message}.`); // ex. „Cererea nu a fost trimisă: Serverul nu poate fi contactat.”
    } finally { // rulează oricum s-a terminat cererea
      setTrimite(false); // butonul revine în funcțiune
      preparatRef.current?.focus(); // focusul nu se pierde pe butonul dezactivat; câmpul e gata pentru următoarea cerere
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  // Schimbarea unui câmp: noua valoare în state; marcajul de eroare dispare de pe câmpul corectat
  function schimba(camp, setter) { // primește numele câmpului și funcția lui de actualizare
    return (e) => { // handler-ul de onChange
      setter(e.target.value); // textul / opțiunea din câmp, în momentul schimbării
      if (campGresit === camp) setCampGresit(null); // câmpul corectat nu mai e roșu (mesajul rămâne până la trimiterea următoare)
    }; // sfârșitul handler-ului
  } // sfârșitul funcției

  const descriere = (camp, extra) => [extra, campGresit === camp ? "speciala-eroare" : null].filter(Boolean).join(" ") || undefined; // aria-describedby: indicația câmpului și, dacă e cazul, mesajul de eroare

  return ( // întoarcem JSX
    <form className="speciala-form" onSubmit={handleSubmit} noValidate data-testid="form" aria-describedby="speciala-intro">{/* noValidate: mesajele sunt cele din cod, în română */}
      <p id="speciala-intro" className="speciala-intro">Ceri un preparat care nu e în meniu. Restaurantul îți confirmă prețul.</p>{/* ce face formularul */}
      <div className="camp">{/* câmpul „Preparat” */}
        <label htmlFor="speciala-preparat">Preparat</label>{/* eticheta, legată prin htmlFor */}
        <input // câmp text controlat
          id="speciala-preparat" // legătura cu eticheta
          ref={preparatRef} // pentru focus din cod
          type="text" // text pe un rând
          value={preparat} // valoarea vine din state
          onChange={schimba("preparat", setPreparat)} // fiecare tastă actualizează state-ul
          placeholder="Ex: Pizza cu trufe" // un exemplu
          maxLength={PREPARAT_MAX} // limita și în browser (validarea din cod rămâne necesară)
          autoComplete="off" // fără sugestii din formulare vechi
          aria-invalid={campGresit === "preparat"} // marcat când e gol sau prea lung
          aria-describedby={descriere("preparat", "speciala-contor")} // contorul și eroarea, citite după etichetă
          data-testid="form-title" // reperul pentru verificarea automată
        />
        <span id="speciala-contor" className="camp-ajutor">{preparat.length}/{PREPARAT_MAX} caractere</span>{/* contorul de caractere */}
      </div>
      <div className="camp">{/* câmpul „Restaurant” */}
        <label htmlFor="speciala-restaurant">Restaurant</label>{/* eticheta */}
        <select // listă derulantă controlată
          id="speciala-restaurant" // legătura cu eticheta
          ref={restaurantRef} // pentru focus din cod
          value={restaurant} // opțiunea aleasă vine din state
          onChange={schimba("restaurant", setRestaurant)} // alegerea nouă intră în state
          aria-invalid={campGresit === "restaurant"} // marcat dacă valoarea nu e din listă
          aria-describedby={descriere("restaurant")} // eroarea, dacă e cazul
          data-testid="form-restaurant" // numele câmpului din db.json
        >
          {RESTAURANTE.map((r) => ( // o opțiune pentru fiecare restaurant
            <option key={r.nume} value={r.nume}>{r.nume}</option> // value = exact textul salvat în db.json
          ))}{/* sfârșitul map-ului */}
        </select>
      </div>
      <div className="camp">{/* câmpul „Livrare” */}
        <label htmlFor="speciala-livrare">Livrare</label>{/* eticheta */}
        <select // listă derulantă controlată
          id="speciala-livrare" // legătura cu eticheta
          ref={livrareRef} // pentru focus din cod
          value={livrare} // opțiunea aleasă vine din state
          onChange={schimba("livrare", setLivrare)} // alegerea nouă intră în state
          aria-invalid={campGresit === "livrare"} // marcat dacă valoarea nu e din listă
          aria-describedby={descriere("livrare")} // eroarea, dacă e cazul
          data-testid="form-livrare" // numele câmpului din db.json
        >
          {TIPURI_LIVRARE.map((tip) => ( // o opțiune pentru fiecare tip
            <option key={tip} value={tip}>{ETICHETE_LIVRARE[tip]}</option> // value = „standard”, textul = „Standard”
          ))}{/* sfârșitul map-ului */}
        </select>
      </div>
      {eroare && ( // mesajul apare doar când există o eroare
        <p id="speciala-eroare" className="form-eroare" role="alert" data-testid="form-error">{eroare}</p> // role="alert": anunțat imediat de cititoarele de ecran
      )}{/* sfârșitul randării condiționate */}
      <p className="form-ok" role="status">{trimisa}</p>{/* confirmarea; regiunea există mereu, ca textul nou să fie anunțat */}
      <button type="submit" className="btn-primary" disabled={trimite || blocat} data-testid="form-submit">{/* dezactivat cât se trimite (și cât se încarcă lista) */}
        <Send size={18} aria-hidden="true" />{/* iconiță decorativă */}
        {trimite ? "Se trimite…" : "Trimite cererea"}{/* textul arată că se lucrează */}
      </button>
    </form>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
