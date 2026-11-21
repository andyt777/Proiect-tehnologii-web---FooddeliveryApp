import styles from "./Logo.module.css"; // Etapa 8: stilul semnului (CSS Modules)

// Semnul Savoro: un bol cu aburi în formă de „S”. Același desen e și favicon-ul (index.html).
// Redesign „Pădure”: cerc crem cu bolul verde, ca să se vadă pe antetul verde în ambele teme.
export default function Logo({ size = 32 }) { // prop opțional `size`, cu valoare implicită 32px
  return ( // componenta întoarce un SVG
    <svg className={styles.mark} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">{/* decorativ: numele e scris lângă */}
      <circle cx="16" cy="16" r="16" fill="var(--hartie)" />{/* cercul de fundal, crem */}
      <path d="M7 16.5h18a9 9 0 0 1-18 0Z" fill="var(--padure)" />{/* bolul: o jumătate de cerc verde */}
      <path // aburii, desenați ca două linii curbe
        d="M18.5 5.5c-2.2 1.1-2.2 3 0 4.1s2.2 3 0 4.1M13 7.5c-1.4.7-1.4 1.9 0 2.6s1.4 1.9 0 2.6" // coordonatele curbelor
        stroke="var(--padure)" // culoarea liniei, verde
        strokeWidth="1.8" // grosimea liniei
        strokeLinecap="round" // capete rotunjite
        fill="none" // fără umplere, doar contur
      />{/* sfârșitul aburilor */}
    </svg>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
