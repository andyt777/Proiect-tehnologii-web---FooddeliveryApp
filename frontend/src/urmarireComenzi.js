// Notificările din aplicație: cât timp clientul are comenzi în curs, Layout cere /comenzi la fiecare 10 secunde
// (doar cât fila e vizibilă) și arată un mesaj când o comandă își schimbă starea (de exemplu, restaurantul a acceptat-o).
// Logica de comparare e în notificari.js (pură, testată); aici sunt doar cronometrul, cererea și state-ul.
import { useCallback, useEffect, useRef, useState } from "react"; // hook-urile React
import { fetchComenzi } from "./api.js"; // GET /comenzi, prin singurul fișier cu fetch
import { adaugaNotificari, areComenziActive, hartaStari, schimbariStare } from "./notificari.js"; // compararea a două citiri
import { stareComanda } from "./stari.js"; // starea derivată a unei comenzi

export const INTERVAL_URMARIRE_MS = 10000; // cât de des întrebăm serverul
const DURATA_NOTIFICARE_MS = 6000; // cât stă un mesaj pe ecran

// Hook-ul folosit o singură dată, în Layout
export function useUrmarireComenzi() { // fără parametri
  const [notificari, setNotificari] = useState([]); // mesajele de pe ecran: [{ cheie, id, text }]
  const instantaneu = useRef(null); // ultima citire: Map id -> stare (null până la prima citire)
  const abonati = useRef(new Set()); // paginile care vor comenzile schimbate (lista de pe „/”, pagina comenzii)
  const versiune = useRef(0); // crește la fiecare schimbare făcută de client; o citire pornită înainte de ea e veche

  // Cronometrul: o citire la pornire, apoi la fiecare INTERVAL_URMARIRE_MS; fila ascunsă nu face cereri
  useEffect(() => { // rulează o dată, la montarea Layout-ului
    let oprit = false; // devine true la demontare
    let inCurs = false; // o singură cerere o dată
    async function verifica() { // o citire a listei
      if (oprit || inCurs || document.hidden) return; // demontat, cerere deja plecată sau fila nu se vede
      const inainte = instantaneu.current; // citirea de dinainte
      if (inainte !== null && !areComenziActive(inainte)) return; // nicio comandă în curs: nu deranjăm serverul
      inCurs = true; // cererea pleacă
      const versiuneLaPlecare = versiune.current; // dacă se schimbă până la răspuns, răspunsul poate fi dinaintea schimbării
      try { // cererea poate eșua
        const comenzi = await fetchComenzi(); // GET /comenzi
        if (oprit || versiune.current !== versiuneLaPlecare) return; // componenta a dispărut sau răspunsul e mai vechi decât o acțiune a clientului
        const schimbari = inainte === null ? [] : schimbariStare(inainte, comenzi); // prima citire doar memorează
        instantaneu.current = hartaStari(comenzi); // noua citire devine baza de comparație
        if (schimbari.length > 0) { // ceva s-a schimbat
          setNotificari((prev) => adaugaNotificari(prev, schimbari, Date.now())); // mesajele noi
          for (const abonat of abonati.current) abonat(schimbari.map((s) => s.comanda)); // paginile își actualizează comenzile
        } // sfârșitul if
      } catch { // server oprit sau răspuns greșit
        // fără mesaj: paginile își arată singure erorile; încercăm din nou la următoarea bătaie
      } finally { // oricum s-a terminat
        inCurs = false; // se poate pleca din nou
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției
    function laVizibilitate() { // fila a devenit vizibilă sau ascunsă
      if (!document.hidden) verifica(); // revenire în filă: citim imediat
    } // sfârșitul funcției
    verifica(); // prima citire
    const cronometru = setInterval(verifica, INTERVAL_URMARIRE_MS); // citirile periodice
    document.addEventListener("visibilitychange", laVizibilitate); // pauza cât fila e ascunsă
    return () => { // cleanup la demontare
      oprit = true; // un răspuns întârziat nu mai schimbă nimic
      clearInterval(cronometru); // oprim cronometrul
      document.removeEventListener("visibilitychange", laVizibilitate); // și ascultătorul
    }; // sfârșitul cleanup-ului
  }, []); // fără dependențe: o singură dată

  // Fiecare mesaj dispare singur; cel mai vechi pleacă primul
  useEffect(() => { // rulează când se schimbă lista de mesaje
    if (notificari.length === 0) return; // nimic de ascuns
    const timer = setTimeout(() => setNotificari((prev) => prev.slice(1)), DURATA_NOTIFICARE_MS); // scoatem primul mesaj
    return () => clearTimeout(timer); // cleanup: lista nouă repornește numărătoarea
  }, [notificari]); // dependența: mesajele

  // Butonul X al unui mesaj
  const inchideNotificare = useCallback((cheie) => { // primește cheia mesajului
    setNotificari((prev) => prev.filter((n) => n.cheie !== cheie)); // listă fără el
  }, []); // funcție stabilă

  // O schimbare făcută chiar de client (anulare, bifă, plasare): o trecem în citire, ca să nu primească mesaj despre propria acțiune
  const noteazaComanda = useCallback((comanda) => { // primește comanda întoarsă de server
    if (!comanda || instantaneu.current === null) return; // prima citire o va prinde oricum
    const harta = new Map(instantaneu.current); // copie
    harta.set(comanda.id, stareComanda(comanda)); // starea nouă (sau comanda nouă, care pornește urmărirea)
    instantaneu.current = harta; // noua bază de comparație
    versiune.current += 1; // o citire aflată pe drum devine veche
  }, []); // funcție stabilă

  // Paginile se abonează la comenzile schimbate; întoarce funcția de dezabonare (potrivită pentru cleanup-ul unui efect)
  const laSchimbariComenzi = useCallback((abonat) => { // primește o funcție (comenziSchimbate) => void
    abonati.current.add(abonat); // o adăugăm
    return () => { abonati.current.delete(abonat); }; // dezabonarea
  }, []); // funcție stabilă

  return { notificari, inchideNotificare, noteazaComanda, laSchimbariComenzi }; // ce primește Layout
} // sfârșitul hook-ului
