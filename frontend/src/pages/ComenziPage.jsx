import { useEffect, useRef, useState } from "react"; // hook-urile React: useState pentru date care se schimbă, useEffect pentru efecte secundare, useRef pentru titlul meniului
import { ArrowDown, CircleAlert, MapPin, RotateCw, Search, ShoppingBag, X } from "lucide-react"; // iconițele din bara de căutare, din hero și din mesajele de eroare (Etapa 8: soarele și luna au plecat în Layout)
import BonComanda from "../components/BonComanda.jsx"; // „bonul” din zona hero
import CategoriiCarduri from "../components/CategoriiCarduri.jsx"; // cardurile „Ce poftești azi?”
import CautareGoala from "../components/CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import ComandaForm from "../components/ComandaForm.jsx"; // Etapa 7: formularul „Comandă specială”
import ComandaList from "../components/ComandaList.jsx"; // lista de comenzi
import CosDrawer from "../components/CosDrawer.jsx"; // panoul lateral al coșului
import Meniu from "../components/Meniu.jsx"; // grila de preparate
import RezumatBento from "../components/RezumatBento.jsx"; // plăcile cu cifrele comenzilor
import { ScheletComenzi } from "../components/Schelete.jsx"; // rândurile gri afișate cât se încarcă comenzile
import UndoToast from "../components/UndoToast.jsx"; // mesajul cu „Anulează” și confirmarea comenzii
import { createComanda, deleteComanda, fetchComenzi, fetchMeniu, updateComanda } from "../api.js"; // Etapa 6–7: citire, adăugare, modificare și ștergere, prin singurul fișier cu fetch
import { potrivesteCategoria } from "../categorii.js"; // filtrul de categorie al meniului
import { normalizeaza, potrivesteCautarea } from "../cautare.js"; // filtrarea după textul din câmpul de căutare
import { adaugaInCos, citesteCos, cosInComenzi, liniiCos, numarProduse, pastreazaDinMeniu, schimbaCantitate, scoateDinCos, totalCos } from "../cos.js"; // logica pură a coșului
import { formatComenzi, formatProduse } from "../format.js"; // funcții de formatare a textelor
import { formatRestaurante, restauranteDinMeniu } from "../rezumat.js"; // textele din hero, derivate din meniu
import { cuTranzitie } from "../tranzitie.js"; // învelește actualizările de state într-o animație
import styles from "./ComenziPage.module.css"; // Etapa 8: stilurile paginii (CSS Modules)

// Etapa 8: pagina principală („/”): tot conținutul din App.jsx de la Etapa 7 (state, efecte, funcții), mutat aproape neschimbat.
// Diferențe: antetul, tema și subsolul sunt în Layout; căutarea și coșul stau într-o bară sub antet, doar pe această pagină.

// Coșul de pornire: cel salvat data trecută, verificat de citesteCos (textul din localStorage nu e de încredere).
// Etapa 6: aici verificăm doar forma; produsele care nu mai sunt în meniu se scot după ce meniul sosește de la server.
function cosInitial() { // funcție apelată o singură dată, la prima randare
  try { // localStorage poate arunca eroare în unele browsere
    return citesteCos(localStorage.getItem("cos")); // coșul salvat, doar cu liniile bine formate
  } catch { // fără acces la localStorage
    return []; // pornim cu un coș gol
  } // sfârșitul try/catch
} // sfârșitul funcției

export default function ComenziPage() { // Etapa 8: pagina comenzilor; deține tot state-ul listei, al meniului și al coșului
  // Etapa 6: datele nu mai sunt scrise în cod; pornim cu liste goale și le cerem serverului după prima randare
  const [comenzi, setComenzi] = useState([]); // lista de comenzi + funcția care o înlocuiește
  const [meniu, setMeniu] = useState([]); // preparatele care se pot comanda
  const [loading, setLoading] = useState(true); // true cât timp așteptăm răspunsul serverului
  const [error, setError] = useState(null); // mesajul erorii (null = nicio eroare)
  const [reincercari, setReincercari] = useState(0); // crește la „Încearcă din nou”; efectul de încărcare depinde de el
  // Etapa 7: eroarea unei acțiuni pe o comandă deja afișată (bifare, ștergere, anulare); lista rămâne pe ecran
  const [eroareActiune, setEroareActiune] = useState(null); // mesajul (null = nicio eroare)
  const [eroareCos, setEroareCos] = useState(null); // Etapa 7: liniile din coș care n-au ajuns la server (null = nicio eroare)
  // ultima comandă ștearsă și locul ei în listă, pentru „Anulează” (null = mesaj ascuns)
  const [ultimaStearsa, setUltimaStearsa] = useState(null); // state pentru toast-ul de undo
  const [cos, setCos] = useState(cosInitial); // liniile coșului: [{ produsId, cantitate }]; inițializare leneșă, ca la temă (Etapa 8: tema e în Layout)
  const [cosDeschis, setCosDeschis] = useState(false); // panoul coșului e deschis?
  // ultima comandă plasată, pentru mesajul de confirmare (null = ascuns); obiect nou la fiecare plasare, ca timer-ul să repornească
  const [confirmare, setConfirmare] = useState(null); // state pentru toast-ul de confirmare
  const [cautare, setCautare] = useState(""); // textul din câmpul de căutare (input controlat)
  const [categorieActiva, setCategorieActiva] = useState(null); // categoria aleasă din „Ce poftești azi?” (null = toate)
  const meniuTitluRef = useRef(null); // titlul secțiunii „Meniu”, ca să-i putem da focus din coșul gol și din hero
  const cautareRef = useRef(null); // câmpul de căutare, primește focusul după „Șterge căutarea”
  const focusDupaReincercare = useRef(false); // true între clicul pe „Încearcă din nou” și randarea stării de încărcare (ref, nu state: nu trebuie să redeseneze nimic)
  const comenziTitluRef = useRef(null); // Etapa 7: titlul „Comenzile tale”, primește focusul când butonul apăsat dispare (ștergere, anulare)
  const focusPeComenzi = useRef(false); // Etapa 7: true între o ștergere / anulare reușită și randarea listei noi
  const inLucru = useRef(new Set()); // Etapa 7: id-urile comenzilor cu o cerere în curs; un al doilea clic pe aceeași comandă e ignorat

  // Etapa 6: încărcarea datelor de la server, după prima randare (și din nou la fiecare „Încearcă din nou”)
  useEffect(() => { // efect secundar: sincronizăm state-ul cu serverul
    let ignore = false; // devine true dacă efectul e anulat (componenta dispare sau pornește o încărcare nouă)
    async function load() { // useEffect nu poate primi direct o funcție async, deci o definim înăuntru
      try { // cererile pot eșua (server oprit, eroare HTTP, timeout)
        const [dateComenzi, dateMeniu] = await Promise.all([fetchComenzi(), fetchMeniu()]); // ambele cereri pornesc în paralel; așteptăm să se termine amândouă
        if (!ignore) { // răspunsul e încă cel dorit
          setComenzi(dateComenzi); // lista de comenzi de la server
          setMeniu(dateMeniu); // meniul de la server
          if (dateMeniu.length > 0) setCos((prev) => pastreazaDinMeniu(prev, dateMeniu)); // scoatem din coșul salvat produsele care nu mai există în meniu; un meniu gol (date stricate) nu golește coșul
        } // sfârșitul if
      } catch (err) { // una dintre cereri a eșuat
        if (!ignore) setError(err.message); // păstrăm doar mesajul (text simplu, ușor de afișat)
      } finally { // rulează și la succes, și la eroare
        if (!ignore) setLoading(false); // gata cu așteptarea, oricum s-a terminat
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției load
    load(); // pornim încărcarea
    return () => { ignore = true; }; // cleanup: un răspuns întârziat nu mai suprascrie state-ul (ex. în StrictMode, efectul rulează de două ori)
  }, [reincercari]); // rulează la prima randare și la fiecare reîncercare

  // „Încearcă din nou”: înapoi la starea de încărcare, fără reîncărcarea paginii
  function handleReincearca() { // apelată de butonul din mesajul de eroare
    focusDupaReincercare.current = true; // butonul apăsat va dispărea; efectul de mai jos mută focusul
    setError(null); // ascundem eroarea veche
    setEroareActiune(null); // și pe cea a unei acțiuni dinainte
    setLoading(true); // arătăm din nou „Se încarcă…” cât timp așteptăm
    setReincercari((n) => n + 1); // dependența efectului se schimbă, deci efectul rulează din nou
  } // sfârșitul funcției

  // După „Încearcă din nou”, panoul de eroare (cu butonul care avea focusul) dispare. Fără asta, focusul ar
  // cădea pe <body> și utilizatorul de tastatură ar o lua de la începutul paginii; îl ducem pe titlul „Meniu”.
  useEffect(() => { // rulează după randarea în care s-a schimbat `loading`
    if (!loading || !focusDupaReincercare.current) return; // doar imediat după o reîncercare
    focusDupaReincercare.current = false; // o singură dată
    meniuTitluRef.current?.focus(); // titlul există și în starea de încărcare
  }, [loading]); // dependența: starea de încărcare

  // Mesajul cu „Anulează” dispare singur după 5 secunde
  useEffect(() => { // rulează după fiecare randare în care `ultimaStearsa` s-a schimbat
    if (!ultimaStearsa) return; // nu e nimic de ascuns
    const timer = setTimeout(() => setUltimaStearsa(null), 5000); // ascundem mesajul după 5 secunde
    return () => clearTimeout(timer); // cleanup: anulăm timer-ul dacă se șterge altă comandă între timp
  }, [ultimaStearsa]); // lista de dependențe

  // Confirmarea comenzii dispare tot după 5 secunde
  useEffect(() => { // rulează când apare o confirmare nouă
    if (!confirmare) return; // nu e nimic de ascuns
    const timer = setTimeout(() => setConfirmare(null), 5000); // ascundem mesajul după 5 secunde
    return () => clearTimeout(timer); // cleanup: o plasare nouă repornește numărătoarea
  }, [confirmare]); // lista de dependențe

  // Coșul se păstrează între vizite: îl scriem în localStorage după fiecare schimbare
  useEffect(() => { // efect secundar: sincronizăm state-ul cu un sistem din afara React
    try { // scrierea poate eșua (mod privat, spațiu plin)
      localStorage.setItem("cos", JSON.stringify(cos)); // salvăm lista ca text JSON
    } catch { // prindem eroarea
      // coșul nu se poate păstra; aplicația merge în continuare
    } // sfârșitul try/catch
  }, [cos]); // doar când se schimbă coșul

  // După o ștergere sau o anulare, butonul apăsat dispare; ducem focusul pe titlul „Comenzile tale”,
  // ca utilizatorul de tastatură să nu ajungă la începutul paginii (preventScroll: pagina nu sare)
  useEffect(() => { // rulează după fiecare randare în care lista s-a schimbat
    if (!focusPeComenzi.current) return; // doar după o ștergere / anulare
    focusPeComenzi.current = false; // o singură dată
    comenziTitluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, [comenzi]); // dependența: lista de comenzi

  // Etapa 7: o cerere pe o comandă, cel mult una o dată; întoarce false dacă era deja una în curs
  function incepe(id) { // marchează comanda ca ocupată
    if (inLucru.current.has(id)) return false; // dublu clic: a doua cerere nu mai pleacă
    inLucru.current.add(id); // comanda e acum ocupată
    return true; // putem trimite cererea
  } // sfârșitul funcției

  // Etapa 7: întâi serverul, apoi state-ul. Pe ecran ajunge comanda salvată (cu id-ul de la server).
  // Nu prindem eroarea aici: ajunge înapoi în formular, care o afișează lângă câmpuri.
  async function handleAdd(comanda) { // primește comanda construită de formular (fără id)
    setUltimaStearsa(null); // închidem „Anulează”: comanda nouă poate primi id-ul celei șterse, iar readucerea ar eșua
    const salvata = await createComanda(comanda); // POST /comenzi; serverul întoarce comanda cu id
    setEroareActiune(null); // serverul răspunde din nou, deci eroarea veche nu mai e de actualitate
    cuTranzitie(() => setComenzi((prev) => [...prev, salvata])); // listă nouă, cu obiectul de la server la final
  } // sfârșitul funcției

  // Etapa 7: bifarea pleacă întâi la server (PATCH doar cu câmpul schimbat), apoi înlocuim comanda cu cea întoarsă
  async function handleToggleLivrata(id) { // primește id-ul comenzii bifate
    const comanda = comenzi.find((c) => c.id === id); // starea ei curentă: PATCH trimite doar valoarea inversă
    if (!comanda || !incepe(id)) return; // comandă necunoscută sau cerere deja în curs
    try { // cererea poate eșua
      const actualizata = await updateComanda(id, { livrata: !comanda.livrata }); // PATCH /comenzi/:id
      setEroareActiune(null); // a mers: ascundem o eroare veche
      cuTranzitie(() => // animăm schimbarea
        setComenzi((prev) => prev.map((c) => (c.id === id ? actualizata : c))) // în listă intră obiectul de la server, nu o copie făcută local
      ); // sfârșitul cuTranzitie
    } catch (err) { // serverul n-a salvat: bifa rămâne cum era
      setEroareActiune(`Nu am putut schimba starea comenzii „${comanda.preparat}”: ${err.message}.`); // mesajul apare deasupra listei, care rămâne pe ecran
    } finally { // oricum s-a terminat
      inLucru.current.delete(id); // comanda nu mai e ocupată
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  // Etapa 7: ștergerea e directă (fără dialog): DELETE la server, apoi scoatem comanda din listă.
  // Greșelile se repară cu „Anulează” din mesajul de jos, timp de 5 secunde.
  async function handleDelete(id) { // primește id-ul comenzii
    const index = comenzi.findIndex((c) => c.id === id); // poziția comenzii în lista completă, ca s-o putem pune la loc
    if (index === -1 || !incepe(id)) return; // comandă necunoscută sau cerere deja în curs
    const comanda = comenzi[index]; // obiectul întreg, pentru „Anulează”
    try { // cererea poate eșua
      await deleteComanda(id); // DELETE /comenzi/:id
      setEroareActiune(null); // a mers: ascundem o eroare veche
      setUltimaStearsa({ comanda, index }); // memorăm comanda și poziția pentru undo
      focusPeComenzi.current = true; // butonul de ștergere dispare odată cu rândul
      cuTranzitie(() => setComenzi((prev) => prev.filter((c) => c.id !== id))); // listă nouă, fără comanda ștearsă
    } catch (err) { // serverul n-a șters: comanda rămâne în listă
      setEroareActiune(`Nu am putut șterge comanda „${comanda.preparat}”: ${err.message}.`); // mesajul de deasupra listei
    } finally { // oricum s-a terminat
      inLucru.current.delete(id); // comanda nu mai e ocupată
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  // „Anulează”: comanda ștearsă se trimite din nou, cu id-ul ei vechi (json-server 0.17 îl păstrează),
  // apoi revine pe locul ei din listă, ca obiectul întors de server
  async function handleUndo() { // apelată de butonul din toast
    if (!ultimaStearsa) return; // mesajul tocmai a dispărut
    const { comanda, index } = ultimaStearsa; // destructurăm ce am salvat la ștergere
    setUltimaStearsa(null); // ascundem toast-ul (și butonul, deci un al doilea clic nu mai e posibil)
    try { // cererea poate eșua
      const readusa = await createComanda(comanda); // POST /comenzi cu tot cu id
      setEroareActiune(null); // a mers: ascundem o eroare veche
      focusPeComenzi.current = true; // butonul „Anulează” a dispărut
      cuTranzitie(() => // animăm reapariția
        setComenzi((prev) => [...prev.slice(0, index), readusa, ...prev.slice(index)]) // inserăm comanda între bucata dinainte și cea de după
      ); // sfârșitul cuTranzitie
    } catch (err) { // serverul n-a salvat-o
      setEroareActiune(`Nu am putut readuce comanda „${comanda.preparat}”: ${err.message}.`); // mesajul de deasupra listei
      comenziTitluRef.current?.focus({ preventScroll: true }); // butonul „Anulează” a dispărut; lista nu se schimbă, deci mutăm focusul aici
    } // sfârșitul try/catch
  } // sfârșitul funcției

  // Coșul: toate schimbările trec prin funcțiile pure din cos.js, cu forma setCos((prev) => ...)
  function handleAdauga(produsId) { // „Adaugă” din meniu
    setCos((prev) => adaugaInCos(prev, produsId)); // listă nouă cu produsul adăugat (sau cu +1)
  } // sfârșitul funcției

  function handleSchimbaCantitate(produsId, delta) { // „−” / „+” din meniu sau din coș
    setCos((prev) => schimbaCantitate(prev, produsId, delta)); // listă nouă; la 0 linia dispare
  } // sfârșitul funcției

  function handleScoate(produsId) { // coșul de gunoi din coș
    setCos((prev) => scoateDinCos(prev, produsId)); // listă nouă, fără linie
  } // sfârșitul funcției

  // Etapa 7: plasarea trimite câte un POST pentru fiecare linie din coș. Promise.allSettled așteaptă toate cererile,
  // chiar dacă unele eșuează: liniile salvate intră în listă și ies din coș, cele eșuate rămân în coș, cu un mesaj.
  // Întoarce true dacă toate au ajuns (CosDrawer resetează atunci livrarea).
  async function handlePlaseaza(livrare) { // primește tipul de livrare ales în coș
    const deTrimis = linii; // liniile din randarea curentă (coșul se poate schimba cât așteptăm)
    if (deTrimis.length === 0) return false; // nimic de plasat (butonul nici nu apare când coșul e gol)
    setEroareCos(null); // ascundem eroarea unei încercări anterioare
    setUltimaStearsa(null); // închidem „Anulează”: o comandă nouă poate primi id-ul celei șterse
    const comenziNoi = cosInComenzi(deTrimis, livrare, new Date().toISOString()); // o comandă fără id pentru fiecare linie
    const rezultate = await Promise.allSettled(comenziNoi.map((c) => createComanda(c))); // toate cererile pornesc deodată
    const salvate = []; // comenzile întoarse de server
    const liniiSalvate = []; // liniile din coș care le corespund
    const erori = []; // motivele cererilor eșuate
    rezultate.forEach((r, i) => { // același index ca în deTrimis
      if (r.status === "fulfilled") { // serverul a salvat comanda
        salvate.push(r.value); // obiectul cu id
        liniiSalvate.push(deTrimis[i]); // linia din coș
      } else { // cererea a eșuat
        erori.push(r.reason); // eroarea din api.js
      } // sfârșitul if/else
    }); // sfârșitul forEach
    if (salvate.length > 0) { // măcar o comandă a ajuns
      setCos((prev) => liniiSalvate.reduce((cos, l) => schimbaCantitate(cos, l.id, -l.cantitate), prev)); // scădem exact cantitatea trimisă (la 0 linia dispare); nu în animație, ca numărul de pe buton să fie corect imediat
      setConfirmare({ produse: numarProduse(liniiSalvate), total: totalCos(liniiSalvate) }); // mesajul de confirmare, doar pentru ce s-a salvat
    } // sfârșitul if
    if (erori.length > 0) { // unele linii n-au ajuns: panoul rămâne deschis
      const motiv = erori[0]?.message ?? "eroare necunoscută"; // primul motiv e de obicei același pentru toate (ex. server oprit)
      setEroareCos(salvate.length === 0 // nimic nu a ajuns
        ? `Comanda nu a fost plasată: ${motiv}. Produsele au rămas în coș.` // totul a eșuat
        : `Am plasat ${formatProduse(numarProduse(liniiSalvate))}, dar restul nu: ${motiv}. Ce nu s-a trimis a rămas în coș.`); // a mers doar o parte
    } else { // toate au ajuns
      setCosDeschis(false); // închidem panoul (browserul duce focusul înapoi pe butonul coșului)
    } // sfârșitul if/else
    if (salvate.length > 0) cuTranzitie(() => setComenzi((prev) => [...prev, ...salvate])); // doar lista de comenzi e animată; în ea intră obiectele de la server
    return erori.length === 0; // true = toate au ajuns
  } // sfârșitul funcției

  // Duce utilizatorul la meniu: focus pe titlu și derulare; folosită de butonul din hero și de coșul gol
  function mergiLaMeniu() { // fără parametri
    const titlu = meniuTitluRef.current; // titlul secțiunii „Meniu”
    if (!titlu) return; // în starea de eroare secțiunea „Meniu” nu e afișată
    const fluid = !window.matchMedia("(prefers-reduced-motion: reduce)").matches; // derulare lină doar dacă nu s-au cerut mai puține animații
    titlu.focus({ preventScroll: true }); // focus pe titlu (cititorul de ecran anunță „Meniu”), fără salt brusc
    titlu.scrollIntoView({ behavior: fluid ? "smooth" : "auto", block: "start" }); // derulăm până la meniu
  } // sfârșitul funcției

  // „Vezi meniul” din coșul gol: panoul s-a închis deja, ducem utilizatorul la meniu
  function handleVeziMeniul() { // apelată de CosDrawer
    setCosDeschis(false); // state-ul urmează dialogul închis
    mergiLaMeniu(); // același drum ca butonul din hero
  } // sfârșitul funcției

  // Căutarea: Esc golește câmpul (în plus față de „×”-ul pe care unele browsere îl pun în input[type=search])
  function handleCautareKeyDown(e) { // tastă apăsată în câmpul de căutare
    if (e.key === "Escape") setCautare(""); // golim textul; lista completă reapare
  } // sfârșitul funcției

  // „Șterge căutarea” din starea fără rezultate: butonul dispare, deci ducem focusul în câmp
  function handleStergeCautarea() { // apelată de CautareGoala (lista de comenzi)
    setCautare(""); // golim textul
    cautareRef.current.focus(); // utilizatorul poate scrie imediat altă căutare
  } // sfârșitul funcției

  // Meniul fără rezultate: butonul golește și căutarea, și categoria, apoi focusul merge tot în câmp
  function handleStergeFiltrele() { // apelată de CautareGoala (meniul)
    setCategorieActiva(null); // înapoi la „Toate”
    handleStergeCautarea(); // golim textul și mutăm focusul
  } // sfârșitul funcției

  // Valori derivate: se recalculează la fiecare randare
  const gata = !loading && !error; // datele au sosit cu bine
  const stare = loading ? "incarcare" : error ? "eroare" : "gata"; // aceeași informație, ca text, pentru bon
  const linii = liniiCos(cos, meniu); // coșul unit cu meniul: preparat, preț, cantitate, subtotal (gol cât meniul nu a sosit)
  const produseInCos = numarProduse(linii); // numărul de pe butonul coșului, doar din produsele care există în meniu
  const cautareActiva = normalizeaza(cautare) !== ""; // doar spațiile nu contează ca o căutare
  const textCautat = cautareActiva ? cautare.trim() : ""; // textul afișat în mesaje, fără spațiile de la margini
  const meniuAfisat = meniu.filter((p) => potrivesteCautarea(p, cautare) && potrivesteCategoria(p, categorieActiva)); // meniul filtrat de căutare și de categorie (tot meniul dacă nu e niciun filtru)
  const comenziAfisate = comenzi.filter((c) => potrivesteCautarea(c, cautare)); // comenzile filtrate doar de căutare; rezumatul rămâne pe toată lista
  const restaurante = restauranteDinMeniu(meniu); // ["Pizzeria Napoli", ...], pentru hero
  // anunțul cititoarelor de ecran: câte rezultate lasă filtrele (gol când nu e niciun filtru)
  const anuntFiltre = !gata || (!cautareActiva && !categorieActiva) ? "" : `${categorieActiva ? `${categorieActiva}: ` : ""}${formatProduse(meniuAfisat.length)}${cautareActiva ? ` și ${formatComenzi(comenziAfisate.length)} găsite` : ""}`; // ex. „Pizza: 3 produse” sau „2 produse și 1 comandă găsite”

  return ( // JSX-ul paginii
    <>{/* Fragment: bara de căutare și conținutul paginii, fără un <div> în plus */}
      <div className={styles.bar}>{/* Etapa 8: al doilea rând al antetului, doar pe această pagină (căutarea și coșul au state-ul aici) */}
        <div className={`wrap ${styles.barInner}`}>{/* containerul centrat, aliniat cu antetul */}
          <span className={styles.addressPill}><MapPin size={16} aria-hidden="true" />Livrare acasă · Acum</span>{/* adresa (doar decorativă deocamdată) */}
          <label className={styles.search}>{/* câmpul de căutare */}
            <Search size={18} aria-hidden="true" />{/* iconița lupă */}
            <input // inputul controlat: valoarea vine din state
              ref={cautareRef} // ca să-i putem da focus din cod
              type="search" // tastatura de pe telefon arată „Caută”
              placeholder="Caută preparate sau restaurante" // indiciul din câmpul gol
              aria-label="Caută" // nume accesibil (placeholder-ul nu ajunge)
              value={cautare} // componentă controlată
              onChange={(e) => setCautare(e.target.value)} // fiecare tastă actualizează state-ul, iar listele se filtrează la randare
              onKeyDown={handleCautareKeyDown} // Esc golește câmpul
              maxLength={100} // o căutare nu are nevoie de mai mult
            />
          </label>
          <span className="sr-only" role="status">{/* anunță numărul de rezultate, fără să mute focusul */}
            {anuntFiltre}{/* gol când nu se caută și nu e aleasă nicio categorie */}
          </span>
          <button // butonul coșului (comenzile pe drum rămân în rezumatul „Comenzile tale”)
            type="button" // buton simplu
            className={styles.cartPill} // clasa pentru stiluri
            onClick={() => { setEroareCos(null); setCosDeschis(true); }} // deschidem panoul; Etapa 7: fără eroarea unei plasări vechi
            aria-haspopup="dialog" // anunță că butonul deschide un dialog
            aria-label={gata ? `Coș: ${formatProduse(produseInCos)}` : "Coș (indisponibil momentan)"} // ex. „Coș: 3 produse”; fără meniu nu știm încă ce e în coș, deci nu spunem „0 produse”
          >
            <ShoppingBag size={18} aria-hidden="true" />{/* iconița sacoșă */}
            {produseInCos > 0 && <span key={produseInCos} className={`${styles.cartCount} ${styles.bump}`}>{produseInCos}</span>}{/* key = valoarea: la fiecare schimbare elementul e nou și animația pornește; ascuns la 0 */}
          </button>
        </div>
      </div>

      <section className={styles.hero} aria-labelledby="hero-titlu">{/* zona mare de sus, cu fotografie pe toată lățimea */}
        <picture className={styles.heroFoto}>{/* fotografia potrivită ecranului: portret pe telefon, peisaj în rest */}
          <source media="(max-width: 640px)" srcSet="/img/hero-900.webp" width="828" height="1100" />{/* telefon: fișierul îngust (aceeași regulă ca preload-ul din index.html) */}
          <img src="/img/hero-1600.webp" alt="" width="1600" height="1000" fetchPriority="high" decoding="async" />{/* decorativă (titlul spune tot); fetchPriority: prima imagine cerută */}
        </picture>
        <div className={`wrap ${styles.heroInner}`}>{/* containerul centrat, peste fotografie */}
          <div className={styles.heroText}>{/* coloana cu texte */}
            {gata && restaurante.length > 0 && <p className={styles.eyebrow}>{restaurante.join(" · ")}</p>}{/* restaurantele din meniu, ex. „Pizzeria Napoli · Burger Van · Sushi Kyo” */}
            {loading && <p className={styles.eyebrow} aria-hidden="true"><span className={`skeleton skeleton-line ${styles.skeletonEyebrow}`} /></p>}{/* cât se încarcă: o linie gri */}
            <h2 id="hero-titlu" className={styles.display}>Cina ta preferată, <em>la ușă</em>.</h2>{/* titlul mare */}
            {gata && ( // textul apare doar când avem datele
              <p className={styles.heroSub}>{/* subtitlul, derivat din meniu */}
                {meniu.length > 0 ? `${formatProduse(meniu.length)} din ${formatRestaurante(restaurante.length)}.` : "Meniul nu are preparate momentan."}{/* ex. „9 produse din 3 restaurante.” */}
              </p>
            )}{/* sfârșitul randării condiționate */}
            {loading && <p className={styles.heroSub} aria-hidden="true"><span className={`skeleton skeleton-line ${styles.skeletonHero}`} /></p>}{/* cât se încarcă: o linie gri în locul textului */}
            {!error && ( // în starea de eroare meniul nu e afișat, deci butonul n-ar avea unde duce
              <button type="button" className={`btn-primary ${styles.heroCta}`} onClick={mergiLaMeniu}>{/* focus pe titlul meniului + derulare */}
                Vezi meniul{/* textul butonului */}
                <ArrowDown size={18} aria-hidden="true" />{/* iconiță decorativă */}
              </button>
            )}{/* sfârșitul randării condiționate */}
          </div>
          <div className={styles.heroBon}><BonComanda comenzi={comenzi} stare={stare} /></div>{/* învelișul poartă umbra (masca zimțată a bonului ar tăia un box-shadow pus chiar pe bon) */}
        </div>
      </section>

      <div className={`wrap ${styles.continut}`}>{/* conținutul principal; Etapa 8: <main> e în Layout, deci aici rămâne un <div> */}
        {error ? ( // starea de eroare: un singur mesaj, care spune ce s-a întâmplat și ce e de făcut
          <div className="error">{/* panoul de eroare */}
            <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
            <div className="error-body">{/* textul și butonul */}
              <p role="alert" data-testid="error">Nu am putut încărca datele: {error}. Rulează <code>npm run api</code>?</p>{/* role="alert": cititorul de ecran îl anunță imediat; Etapa 7: data-testid="error" */}
              <button type="button" className="btn-primary" onClick={handleReincearca}>{/* reîncearcă fără reîncărcarea paginii */}
                <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
                Încearcă din nou{/* textul butonului */}
              </button>
            </div>
          </div>
        ) : ( // se încarcă sau datele au sosit
          <>{/* Fragment: cele trei secțiuni */}
            <CategoriiCarduri // „Ce poftești azi?”, deasupra meniului
              meniu={meniu} // tot meniul: numerele de pe carduri nu depind de căutare
              activa={categorieActiva} // categoria aleasă (null = „Toate”)
              onAlege={setCategorieActiva} // primește numele categoriei sau null
              incarcare={loading} // true = carduri gri
            />
            <Meniu // grila de preparate, deasupra comenzilor
              meniu={meniuAfisat} // preparatele care se potrivesc cu căutarea și cu categoria
              totalMeniu={meniu.length} // câte are meniul întreg, pentru „2 din 9 produse”
              incarcare={loading} // true = schelete în loc de carduri
              cautare={textCautat} // textul căutat ("" = nu se caută)
              categorie={categorieActiva} // categoria aleasă (null = toate), pentru numărătoare și starea goală
              onStergeFiltrele={handleStergeFiltrele} // butonul din starea fără rezultate
              cos={cos} // ca fiecare card să-și știe cantitatea
              onAdauga={handleAdauga} // „Adaugă”
              onSchimba={handleSchimbaCantitate} // „−” / „+”
              titluRef={meniuTitluRef} // referința către titlu
            />
            <section aria-labelledby="comenzi-titlu" aria-busy={loading}>{/* secțiunea comenzilor */}
              <div className="section-header">{/* titlul secțiunii */}
                <h2 id="comenzi-titlu" className="titlu-focus" ref={comenziTitluRef} tabIndex={-1}>Comenzile tale</h2>{/* textul titlului; Etapa 7: primește focusul din cod după ștergere / anulare */}
                {gata && ( // numărul apare doar după încărcare
                  <span className="section-meta">{cautareActiva ? `${comenziAfisate.length} din ${formatComenzi(comenzi.length)}` : formatComenzi(comenzi.length)}</span> // la căutare: „1 din 6 comenzi”
                )}{/* sfârșitul randării condiționate */}
              </div>
              <RezumatBento comenzi={comenzi} stare={stare} />{/* cifrele, din toată lista (nu din cea căutată) */}
              <div className={styles.comenziGrid}>{/* Etapa 7: formularul în stânga (1fr), lista în dreapta (2fr); una sub alta pe telefon */}
                <section className={`panel ${styles.specialaPanel}`} aria-labelledby="speciala-titlu">{/* panoul formularului */}
                  <h3 id="speciala-titlu" className={styles.panelTitlu}>Comandă specială</h3>{/* titlul panoului */}
                  <ComandaForm onAdd={handleAdd} blocat={loading} />{/* pagina primește comanda validată și o trimite la server */}
                </section>
                <div className={styles.comenziLista}>{/* coloana listei */}
                  {eroareActiune && ( // Etapa 7: o bifare / ștergere / anulare a eșuat; lista rămâne dedesubt
                    <div className={`error ${styles.errorActiune}`}>{/* același panou de eroare, mai compact */}
                      <CircleAlert size={20} aria-hidden="true" />{/* iconiță decorativă */}
                      <p role="alert" data-testid="error">{eroareActiune}</p>{/* mesajul erorii paginii */}
                      <button type="button" className="btn-close" onClick={() => setEroareActiune(null)} aria-label="Închide mesajul de eroare">{/* utilizatorul îl poate ascunde */}
                        <X size={18} aria-hidden="true" />{/* iconiță decorativă */}
                      </button>
                    </div>
                  )}{/* sfârșitul randării condiționate */}
                  {loading ? ( // comenzile nu au sosit încă
                    <>{/* mesajul și scheletele */}
                      <p className="info" role="status" data-testid="loading">Se încarcă comenzile…</p>{/* role="status": textul e anunțat de cititoarele de ecran; Etapa 7: data-testid="loading" */}
                      <ScheletComenzi />{/* rânduri gri, doar decor */}
                    </>
                  ) : ( // datele au sosit; Etapa 7: lista rămâne pe ecran și când o acțiune eșuează (condiția e doar !loading)
                    <>{/* lista (sau mesajul fără rezultate) */}
                      {cautareActiva && comenziAfisate.length === 0 && comenzi.length > 0 ? ( // căutarea nu a găsit nicio comandă
                        <CautareGoala mesaj={`Nicio comandă pentru „${textCautat}”`} onSterge={handleStergeCautarea} />// mesaj + „Șterge căutarea”
                      ) : ( // lista (sau mesajul „Nu ai nicio comandă.” dacă lista e chiar goală)
                        <ComandaList // lista de comenzi
                          comenzi={comenziAfisate} // datele coboară prin props (filtrate de căutare)
                          onToggle={handleToggleLivrata} // evenimentele urcă prin callback-uri
                          onDelete={handleDelete} // Etapa 7: ștergere directă, la server; „Anulează” o poate readuce
                        />
                      )}{/* sfârșitul randării condiționate */}
                    </>
                  )}{/* sfârșitul randării condiționate */}
                </div>
              </div>
            </section>
          </>
        )}{/* sfârșitul celor trei stări */}
      </div>

      <CosDrawer // panoul coșului
        deschis={cosDeschis} // false = închis
        linii={linii} // liniile calculate mai sus
        disponibil={gata} // false = meniul nu a sosit, deci nu spunem „Coșul e gol”
        eroare={eroareCos} // Etapa 7: ce linii n-au ajuns la server (null = nicio eroare)
        onClose={() => setCosDeschis(false)} // X, Esc sau clic pe fundal
        onSchimba={handleSchimbaCantitate} // „−” / „+”
        onScoate={handleScoate} // coșul de gunoi
        onPlaseaza={handlePlaseaza} // „Plasează comanda”
        onVeziMeniul={handleVeziMeniul} // din coșul gol
      />
      <UndoToast stearsa={ultimaStearsa} onUndo={handleUndo} confirmare={confirmare} />{/* mesajul cu „Anulează” și confirmarea comenzii */}
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
