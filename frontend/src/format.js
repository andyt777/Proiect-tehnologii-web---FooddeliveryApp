// Sume în lei, cu separatorul de mii românesc (1.250 lei)
export function formatLei(suma) {
  return `${suma.toLocaleString("ro-RO")} lei`;
}

// Acordul în română: 1 comandă, 2 comenzi, 20 de comenzi (de la 20 în sus apare „de”)
export function formatComenzi(numar) {
  if (numar === 1) return "1 comandă";
  const ultimeleDoua = numar % 100;
  const de = numar !== 0 && (ultimeleDoua === 0 || ultimeleDoua >= 20) ? "de " : "";
  return `${numar} ${de}comenzi`;
}
