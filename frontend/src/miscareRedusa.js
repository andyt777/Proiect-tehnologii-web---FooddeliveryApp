// Pachetul B: preferința „mișcare redusă” a sistemului de operare, citită din React.
// useSyncExternalStore ține componenta la zi dacă utilizatorul schimbă setarea cât pagina e deschisă.
import { useSyncExternalStore } from "react"; // abonarea la o sursă din afara React-ului

const INTEROGARE = "(prefers-reduced-motion: reduce)"; // aceeași interogare ca în index.css

function aboneaza(anunta) { // React ne dă funcția de apelat la schimbare
  const lista = window.matchMedia(INTEROGARE); // obiectul care urmărește interogarea
  lista.addEventListener("change", anunta); // setarea s-a schimbat
  return () => lista.removeEventListener("change", anunta); // dezabonarea
} // sfârșitul funcției

function citeste() { // valoarea de acum
  return window.matchMedia(INTEROGARE).matches; // true = utilizatorul vrea mai puțină mișcare
} // sfârșitul funcției

// true dacă sistemul cere mișcare redusă
export function useMiscareRedusa() { // fără parametri
  return useSyncExternalStore(aboneaza, citeste, () => false); // al treilea argument: valoarea pentru randarea pe server (nu e cazul aici)
} // sfârșitul hook-ului
