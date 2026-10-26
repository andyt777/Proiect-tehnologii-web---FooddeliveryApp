// Semnul Savoro: un bol cu aburi în formă de „S”. Același desen e și favicon-ul (index.html).
export default function Logo({ size = 34 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="var(--accent)" />
      <path d="M7 16.5h18a9 9 0 0 1-18 0Z" fill="#ffffff" />
      <path
        d="M18.5 5.5c-2.2 1.1-2.2 3 0 4.1s2.2 3 0 4.1M13 7.5c-1.4.7-1.4 1.9 0 2.6s1.4 1.9 0 2.6"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
