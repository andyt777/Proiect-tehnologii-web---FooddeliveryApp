// O colecție în memorie: lista de elemente și generatorul de id-uri. Datele se pierd la repornire (Etapa 10: MariaDB).
export function creeazaColectie(elemente, genereazaId) {
  const lista = elemente;

  return {
    toate: () => lista,
    gaseste: (id) => lista.find((e) => e.id === id) ?? null,
    exista: (id) => lista.some((e) => e.id === id),
    // `id` explicit doar pentru resursele cu id ales de client (slug-ul restaurantului)
    adauga(date, id = genereazaId(lista)) {
      const element = { id, ...date };
      lista.push(element);
      return element;
    },
    modifica(id, schimbari) {
      const index = lista.findIndex((e) => e.id === id);
      if (index === -1) return null;
      lista[index] = { ...lista[index], ...schimbari, id };
      return lista[index];
    },
    inlocuieste(id, date) {
      const index = lista.findIndex((e) => e.id === id);
      if (index === -1) return null;
      lista[index] = { id, ...date };
      return lista[index];
    },
    sterge(id) {
      const index = lista.findIndex((e) => e.id === id);
      if (index === -1) return false;
      lista.splice(index, 1);
      return true;
    },
  };
}

// nextId pentru id-uri numerice: cel mai mare + 1, calculat o dată, apoi doar crește (un id șters nu se refolosește)
export function idNumeric(elemente) {
  let nextId = Math.max(0, ...elemente.map((e) => (Number.isInteger(e.id) ? e.id : 0))) + 1;
  return () => nextId++;
}

// Id-uri text cu prefix („p1”, „p2”, ...), ca în meniul din seed
export function idCuPrefix(prefix, elemente) {
  const format = new RegExp(`^${prefix}(\d+)$`);
  let urmator = Math.max(0, ...elemente.map((e) => Number(format.exec(String(e.id))?.[1] ?? 0))) + 1;
  return (lista) => {
    while (lista.some((e) => e.id === `${prefix}${urmator}`)) urmator += 1;
    return `${prefix}${urmator++}`;
  };
}
