import Link from "next/link";
import type { ReactNode } from "react";

/** Previous / next concept card. */
export function PagerLink({
  href,
  hint,
  alignRight,
  children,
}: {
  href: string;
  hint: string;
  alignRight?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-sm ${alignRight ? "sm:text-right" : ""}`}
    >
      <span className="block text-xs text-slate-500">{hint}</span>
      <span className="mt-1 block font-medium text-slate-900 group-hover:text-indigo-700">
        {children}
      </span>
    </Link>
  );
}
