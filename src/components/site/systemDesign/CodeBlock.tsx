/** Dark, horizontally scrollable code listing. */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <figure className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
      <figcaption className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
        <span
          className="h-2 w-2 rounded-full bg-indigo-400"
          aria-hidden="true"
        />
        {label}
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-100">
        <code className="!bg-transparent !p-0 font-mono !text-[13px] !text-slate-100">
          {code}
        </code>
      </pre>
    </figure>
  );
}
