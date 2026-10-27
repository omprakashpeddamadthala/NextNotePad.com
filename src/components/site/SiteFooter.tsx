import Link from "next/link";
import { pagesInSection, type SiteSection } from "@/lib/seo/site";

const GROUPS: { section: SiteSection; heading: string }[] = [
  { section: "product", heading: "Product" },
  { section: "use-cases", heading: "Use cases" },
  { section: "compare", heading: "Compare" },
  { section: "guides", heading: "Guides" },
  { section: "help", heading: "Help" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6 lg:grid-cols-5">
        {GROUPS.map(({ section, heading }) => (
          <div key={section}>
            <h2 className="font-semibold text-slate-900">{heading}</h2>
            <ul className="mt-3 space-y-2">
              {pagesInSection(section).map((page) => (
                <li key={page.path}>
                  <Link
                    href={page.path}
                    className="text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    {page.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        NextNotePad.com — a free notepad that runs in your browser.{" "}
        <Link href="/" className="underline hover:text-slate-900">
          Start writing
        </Link>
      </div>
    </footer>
  );
}
