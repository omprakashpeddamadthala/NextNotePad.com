/** One side of a trade-off: gains or costs. */
export function TradeoffList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "gain" | "cost";
}) {
  const accent = tone === "gain" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
