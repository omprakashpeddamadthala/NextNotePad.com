/** A request path drawn as labelled boxes joined by arrows. Wraps on small screens. */
export function FlowDiagram({ steps }: { steps: string[] }) {
  return (
    <figure className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 shadow-sm sm:text-sm">
              {step}
            </span>
            {i < steps.length - 1 && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0 text-indigo-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">Flow: {steps.join(", then ")}</figcaption>
    </figure>
  );
}
