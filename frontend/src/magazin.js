// Redesign „Pădure”: starea comună tuturor paginilor (meniul, coșul, favoritele, livrarea aleasă și confirmarea plasării).
// Până acum stătea în ComenziPage; acum o folosesc și /restaurante/:slug, /cos și /favorite, deci o ține Layout
// și o dă paginilor prin <Outlet context={...} />. Logica rămâne în funcțiile pure din cos.js și favorite.js.
import { useEffect, useState } from "react"; // useState: datele; useEffect: cererea și salvarea în localStorage
import { useOutletContext } from "react-router-dom"; // paginile citesc starea dată de Layout
import { fetchMeniu } from "./api.js"; // GET /meniu, prin singurul fișier cu fetch
import { adaugaInCos, citesteCos, liniiCos, pastreazaDinMeniu, schimbaCantitate, scoateDinCos } from "./cos.js"; // logica pură a coșului
import { citesteFavorite, comutaFavorit, pastreazaFavoriteDinMeniu } from "./favorite.js"; // logica pură a favoritelor

const DURATA_CONFIRMARE_MS = 5000; // mesajul „Comanda a fost plasată” dispare singur după 5 secunde

// Citește o listă salvată; textul din localStorage nu e de încredere, deci trece prin funcția de verificare
function citesteSalvat(cheie, verifica) { // cheie = „cos” sau „favorite”; verifica = citesteCos sau citesteFavorite
  try { // localStorage poate arunca eroare (mod privat, browser blocat)
    return verifica(localStorage.getItem(cheie)); // doar elementele bine formate
  } catch { // fără acces la localStorage
    return []; // pornim cu o listă goală
  } // sfârșitul try/catch
} // sfârșitul funcției

// Scrie o listă în localStorage; o eroare nu oprește aplicația
function salveaza(cheie, valoare) { // primește cheia și lista
  try { // scrierea poate eșua (mod privat, spațiu plin)
    localStorage.setItem(cheie, JSON.stringify(valoare)); // lista ca text JSON
  } catch { // prindem eroarea
    // lista nu se poate păstra între vizite; aplicația merge în continuare
  } // sfârșitul try/catch
} // sfârșitul funcției

// Hook-ul folosit o singură dată, în Layout: creează starea și funcțiile care o schimbă
export function useStareMagazin() { // fără parametri
  const [meniu, setMeniu] = useState([]); // preparatele de la server
  const [incarcareMeniu, setIncarcareMeniu] = useState(true); // true cât așteptăm meniul
  const [eroareMeniu, setEroareMeniu] = useState(null); // mesajul erorii (null = nicio eroare)
  const [reincercari, setReincercari] = useState(0); // crește la „Încearcă din nou”; efectul de încărcare depinde de el
  const [cos, setCos] = useState(() => citesteSalvat("cos", citesteCos)); // liniile coșului: [{ produsId, cantitate }]
  const [favorite, setFavorite] = useState(() => citesteSalvat("favorite", citesteFavorite)); // id-urile preparatelor favorite
  const [livrare, setLivrare] = useState("standard"); // tipul de livrare ales în hero sau în coș (aceeași valoare peste tot)
  const [confirmare, setConfirmare] = useState(null); // ultima plasare reușită, pentru mesajul de jos (null = ascuns)

  // Meniul se cere după prima randare și din nou la fiecare reîncercare (același tipar ca în Etapa 6)
  useEffect(() => { // efect secundar: sincronizăm state-ul cu serverul
    let ignore = false; // devine true dacă efectul e anulat (StrictMode sau o reîncercare nouă)
    async function load() { // useEffect nu poate primi direct o funcție async
      try { // cererea poate eșua (server oprit, eroare HTTP, timeout)
        const date = await fetchMeniu(); // GET /meniu
        if (ignore) return; // răspunsul nu mai e cel dorit
        setMeniu(date); // meniul de la server
        if (date.length > 0) { // un meniu gol (date stricate) nu golește coșul și favoritele
          setCos((prev) => pastreazaDinMeniu(prev, date)); // scoatem din coș produsele care nu mai există
          setFavorite((prev) => pastreazaFavoriteDinMeniu(prev, date)); // la fel pentru favorite
        } // sfârșitul if
      } catch (err) { // cererea a eșuat
        if (!ignore) setEroareMeniu(err.message); // doar mesajul, text simplu
      } finally { // oricum s-a terminat
        if (!ignore) setIncarcareMeniu(false); // gata cu așteptarea
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției load
    load(); // pornim încărcarea
    return () => { ignore = true; }; // cleanup: un răspuns întârziat nu mai suprascrie state-ul
  }, [reincercari]); // la prima randare și la fiecare reîncercare

  useEffect(() => salveaza("cos", cos), [cos]); // coșul se păstrează între vizite
  useEffect(() => salveaza("favorite", favorite), [favorite]); // la fel favoritele

  // Confirmarea dispare singură; o plasare nouă (obiect nou) repornește numărătoarea
  useEffect(() => { // rulează când apare o confirmare nouă
    if (!confirmare) return; // nimic de ascuns
    const timer = setTimeout(() => setConfirmare(null), DURATA_CONFIRMARE_MS); // ascundem mesajul mai târziu
    return () => clearTimeout(timer); // cleanup: anulăm timer-ul vechi
  }, [confirmare]); // dependența: confirmarea

  // „Încearcă din nou”: înapoi la starea de încărcare, fără reîncărcarea paginii
  function reincarcaMeniu() { // apelată din butoanele de eroare
    setEroareMeniu(null); // ascundem eroarea veche
    setIncarcareMeniu(true); // „Se încarcă…” cât așteptăm
    setReincercari((n) => n + 1); // dependența efectului se schimbă, deci efectul rulează din nou
  } // sfârșitul funcției

  return { // obiect nou la fiecare randare; paginile îl primesc prin useMagazin()
    meniu, // lista de preparate
    incarcareMeniu, // true cât se încarcă
    eroareMeniu, // mesajul erorii sau null
    reincarcaMeniu, // „Încearcă din nou”
    cos, // liniile brute { produsId, cantitate }
    setCos, // pentru plasarea comenzii (scade exact cantitățile trimise)
    linii: liniiCos(cos, meniu), // coșul unit cu meniul: preparat, preț, cantitate, subtotal
    adauga: (produsId) => setCos((prev) => adaugaInCos(prev, produsId)), // „Adaugă în coș”
    schimba: (produsId, delta) => setCos((prev) => schimbaCantitate(prev, produsId, delta)), // „−” / „+”
    scoate: (produsId) => setCos((prev) => scoateDinCos(prev, produsId)), // coșul de gunoi
    favorite, // id-urile favorite
    comutaFavorit: (id) => setFavorite((prev) => comutaFavorit(prev, id)), // inima de pe card
    livrare, // tipul de livrare ales
    setLivrare, // schimbarea lui (hero sau coș)
    confirmare, // mesajul de jos după plasare
    setConfirmare, // folosit de pagina coșului
  }; // sfârșitul obiectului
} // sfârșitul hook-ului

// Paginile citesc starea comună dată de Layout prin <Outlet context={...} />
export function useMagazin() { // fără parametri
  return useOutletContext(); // obiectul întors de useStareMagazin (plus ce adaugă Layout)
} // sfârșitul funcției
