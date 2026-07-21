export function CarrotCount({ count }: { count: number }) {
  return (
    <div
      id="tour-carrot-count"
      className="shrink-0 rounded-2xl bg-carrot-light/30 px-5 py-3 text-center"
    >
      <p className="text-xs font-medium text-carrot-dark">누적 당근</p>
      <p className="text-2xl font-extrabold text-carrot-dark">🥕 {count}</p>
    </div>
  );
}
