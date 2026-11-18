import Link from "next/link";
import {
  CATEGORIES,
  SYSTEM_DESIGN_PATH,
  conceptPath,
  conceptsInCategory,
} from "@/lib/systemDesign/concepts";

/** Every concept grouped by category, with the current one highlighted. */
export function ConceptNav({ currentSlug }: { currentSlug?: string }) {
  return (
    <nav aria-label="System design concepts" className="text-sm">
      <Link
        href={SYSTEM_DESIGN_PATH}
        className="font-semibold text-slate-900 hover:text-indigo-700"
      >
        All concepts
      </Link>
      {CATEGORIES.map((category) => (
        <div key={category.id} className="mt-6">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {category.label}
          </p>
          <ul className="mt-2 space-y-0.5 border-l border-slate-200">
            {conceptsInCategory(category.id).map((concept) => {
              const active = concept.slug === currentSlug;
              return (
                <li key={concept.slug}>
                  <Link
                    href={conceptPath(concept.slug)}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "-ml-px block border-l-2 border-indigo-600 py-1 pl-3 font-medium text-indigo-700"
                        : "-ml-px block border-l-2 border-transparent py-1 pl-3 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
                    }
                  >
                    {concept.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
