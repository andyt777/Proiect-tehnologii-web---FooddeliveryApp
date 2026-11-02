import { flushSync } from "react-dom"; // flushSync forțează React să aplice imediat schimbarea în DOM

// Rulează o actualizare de state ca „view transition”: rândurile alunecă la noile poziții,
// iar tema se schimbă cu o trecere lină. Fără suport în browser (sau cu animațiile oprite
// din sistem), actualizarea se face pe loc, la fel ca înainte.
export function cuTranzitie(actualizare) { // primește o funcție care schimbă state-ul
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { // browserul nu știe View Transitions sau utilizatorul a cerut mai puține animații
    actualizare(); // aplicăm schimbarea direct, fără animație
    return; // ieșim din funcție
  } // sfârșitul ramurii fără animație
  document.startViewTransition(() => flushSync(actualizare)); // browserul face „poză” înainte, aplicăm schimbarea sincron, apoi animă diferența
} // sfârșitul funcției
