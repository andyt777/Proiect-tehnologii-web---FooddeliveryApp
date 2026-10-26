import { flushSync } from "react-dom";

// Rulează o actualizare de state ca „view transition”: rândurile alunecă la noile poziții,
// iar tema se schimbă cu o trecere lină. Fără suport în browser (sau cu animațiile oprite
// din sistem), actualizarea se face pe loc, la fel ca înainte.
export function cuTranzitie(actualizare) {
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    actualizare();
    return;
  }
  document.startViewTransition(() => flushSync(actualizare));
}
