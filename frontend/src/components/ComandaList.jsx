import ComandaCard from "./ComandaCard.jsx";

export default function ComandaList({ comenzi }) {
  if (comenzi.length === 0) {
    return <p className="empty">Nu ai nicio comandă.</p>;
  }

  return (
    <ul className="item-list">
      {comenzi.map((comanda) => (
        <ComandaCard key={comanda.id} comanda={comanda} />
      ))}
    </ul>
  );
}
