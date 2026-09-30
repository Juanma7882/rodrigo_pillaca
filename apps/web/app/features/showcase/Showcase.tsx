const items = ['Durlock', 'Steelframe', 'Pintura', 'Pisos'];

export function Showcase() {
  return (
    <ul data-testid="showcase" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <li key={item} className="rounded-lg border bg-card p-6 font-semibold">
          {item}
        </li>
      ))}
    </ul>
  );
}
