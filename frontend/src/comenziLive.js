// Pachetul B: comenzile paginilor /restaurant, /livrator și /admin, ținute la zi.
// Citește /comenzi la deschidere și apoi la fiecare INTERVAL_PANOU_MS (doar cât fila e vizibilă), ca restaurantul
// să vadă comenzile noi și livratorul cursele noi. `acum` (ms) se actualizează la fiecare citire reușită, deci
// paginile nu citesc ceasul în timpul randării (randarea rămâne pură).
// `aplica` face o acțiune sigură: citește comanda proaspătă, construiește corpul PATCH din ea, trimite, apoi
// spune urmăririi din Layout (noteazaComanda), ca pagina clientului să nu primească notificare despre propria acțiune.
import { useCallback, useEffect, useRef, useState } from "react"; // hook-urile React
import { fetchComanda, fetchComenzi, updateComanda } from "./api.js"; // cererile, prin singurul fișier cu fetch

export const INTERVAL_PANOU_MS = 10000; // cât de des cerem lista din nou

export function useComenziLive(noteazaComanda) { // primește funcția din Layout (useMagazin)
  const [comenzi, setComenzi] = useState([]); // lista de la server
  const [incarcare, setIncarcare] = useState(true); // true până la prima citire
  const [eroare, setEroare] = useState(null); // mesajul ultimei citiri eșuate (null = nicio eroare)
  const [acum, setAcum] = useState(null); // momentul ultimei citiri reușite (ms), pentru întârzieri
  const [reincercari, setReincercari] = useState(0); // crește la „Încearcă din nou”
  const versiune = useRef(0); // crește la fiecare acțiune proprie; o citire pornită înainte e veche

  useEffect(() => { // pornește citirile
    let oprit = false; // devine true la demontare sau la o reîncercare nouă
    let inCurs = false; // o singură cerere o dată
    async function citeste() { // o citire a listei
      if (oprit || inCurs || document.hidden) return; // demontat, cerere deja plecată sau fila nu se vede
      inCurs = true; // cererea pleacă
      const laPlecare = versiune.current; // dacă se schimbă până la răspuns, răspunsul e mai vechi decât o acțiune
      try { // cererea poate eșua
        const date = await fetchComenzi(); // GET /comenzi
        if (oprit || versiune.current !== laPlecare) return; // răspuns care nu mai contează
        setComenzi(date); // lista nouă
        setEroare(null); // serverul răspunde din nou
        setAcum(Date.now()); // ceasul paginii, în callback (nu la randare)
      } catch (err) { // server oprit, eroare HTTP sau timeout
        if (!oprit) setEroare(err.message); // mesajul românesc din api.js
      } finally { // oricum s-a terminat
        inCurs = false; // se poate pleca din nou
        if (!oprit) setIncarcare(false); // prima citire s-a terminat
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției
    function laVizibilitate() { // fila a devenit vizibilă sau ascunsă
      if (!document.hidden) citeste(); // revenire în filă: citim imediat
    } // sfârșitul funcției
    citeste(); // prima citire
    const cronometru = setInterval(citeste, INTERVAL_PANOU_MS); // citirile periodice
    document.addEventListener("visibilitychange", laVizibilitate); // pauza cât fila e ascunsă
    return () => { // cleanup
      oprit = true; // un răspuns întârziat nu mai schimbă nimic
      clearInterval(cronometru); // oprim cronometrul
      document.removeEventListener("visibilitychange", laVizibilitate); // și ascultătorul
    }; // sfârșitul cleanup-ului
  }, [reincercari]); // la deschidere și la fiecare reîncercare

  // „Încearcă din nou” după o eroare la prima citire
  const reincarca = useCallback(() => { // fără parametri
    setEroare(null); // ascundem eroarea
    setIncarcare(true); // „Se încarcă…”
    setReincercari((n) => n + 1); // efectul pornește din nou
  }, []); // funcție stabilă

  // O acțiune pe o comandă: citire proaspătă -> corpul PATCH (construieste) -> PATCH -> lista și urmărirea la zi.
  // `construieste(comanda)` aruncă o eroare cu mesaj românesc dacă acțiunea nu mai e permisă; atunci lista primește
  // comanda proaspătă, iar eroarea merge mai departe la pagină. Întoarce comanda actualizată.
  const aplica = useCallback(async (id, construieste) => { // primește id-ul și funcția care face corpul
    const proaspata = await fetchComanda(id); // starea de acum, nu cea din listă
    versiune.current += 1; // o citire periodică pornită înainte devine veche
    let patch; // corpul cererii
    try { // construieste poate refuza
      patch = construieste(proaspata); // din stari.js, prin actiuniComenzi.js
    } catch (err) { // acțiunea nu mai e permisă
      setComenzi((prev) => prev.map((c) => (c.id === proaspata.id ? proaspata : c))); // arătăm starea adevărată
      throw err; // pagina afișează mesajul
    } // sfârșitul try/catch
    const actualizata = await updateComanda(proaspata.id, patch); // PATCH /comenzi/:id
    versiune.current += 1; // și citirile pornite în timpul PATCH-ului sunt vechi
    noteazaComanda(actualizata); // fără notificare despre propria acțiune
    setComenzi((prev) => prev.map((c) => (c.id === actualizata.id ? actualizata : c))); // obiectul de la server, pe locul vechi
    return actualizata; // pentru mesajul paginii
  }, [noteazaComanda]); // noteazaComanda e stabilă (useCallback în urmarireComenzi.js)

  return { comenzi, incarcare, eroare, acum, reincarca, aplica }; // ce primesc paginile
} // sfârșitul hook-ului
