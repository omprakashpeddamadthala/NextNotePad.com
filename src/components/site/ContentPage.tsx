import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { getSitePage } from "@/lib/seo/site";

interface ContentPageProps {
  path: string;
  /** The page's single H1. May differ from the <title>. */
  heading: string;
  intro: ReactNode;
  /** Emit Article structured data (guides and editorial pages). */
  article?: boolean;
  /** Paths of related pages, rendered as a "Keep reading" list. */
  related?: string[];
  children: ReactNode;
}

/** Typography for long-form copy; there is no typography plugin in this project. */
const PROSE =
  "[&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-900 " +
  "[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 " +
  "[&_p]:mt-4 [&_p]:leading-7 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 " +
  "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:leading-7 " +
  "[&_a]:text-indigo-700 [&_a]:underline [&_a:hover]:text-indigo-900 " +
  "[&_strong]:font-semibold [&_strong]:text-slate-900 " +
  "[&_kbd]:rounded [&_kbd]:border [&_kbd]:border-slate-300 [&_kbd]:bg-slate-50 [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:font-mono [&_kbd]:text-xs " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm " +
  "[&_table]:mt-6 [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_th]:border-b [&_th]:border-slate-300 [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900 " +
  "[&_td]:border-b [&_td]:border-slate-200 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top";

export function ContentPage({
  path,
  heading,
  intro,
  article,
  related = [],
  children,
}: ContentPageProps) {
  const page = getSitePage(path);
  const crumbs = path.split("/").filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(path)} />
      {article && <JsonLd data={articleJsonLd(path)} />}

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 hover:underline">
              Home
            </Link>
          </li>
          {crumbs.map((_, i) => {
            const crumbPath = `/${crumbs.slice(0, i + 1).join("/")}`;
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumbPath} className="flex items-center gap-1">
                <span aria-hidden="true">/</span>
                {isLast ? (
                  <span aria-current="page">
                    {getSitePage(crumbPath).navLabel}
                  </span>
                ) : (
                  <Link
                    href={crumbPath}
                    className="hover:text-slate-900 hover:underline"
                  >
                    {getSitePage(crumbPath).navLabel}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {heading}
        </h1>
        <div className="mt-4 text-lg leading-8 text-slate-600">{intro}</div>
        {article && (
          <p className="mt-4 text-sm text-slate-500">
            Last reviewed{" "}
            <time dateTime={page.lastReviewed}>
              {formatDate(page.lastReviewed)}
            </time>
          </p>
        )}
      </header>

      <div className={PROSE}>{children}</div>

      <aside className="mt-14 rounded-lg border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Try it now</h2>
        <p className="mt-2 text-slate-600">
          NextNotePad opens straight into the editor. No download, and you can
          start without an account.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Open the notepad
        </Link>
      </aside>

      {related.length > 0 && (
        <nav aria-label="Related pages" className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900">Keep reading</h2>
          <ul className="mt-3 space-y-2">
            {related.map((relatedPath) => {
              const target = getSitePage(relatedPath);
              return (
                <li key={relatedPath}>
                  <Link
                    href={relatedPath}
                    className="text-indigo-700 underline hover:text-indigo-900"
                  >
                    {target.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </article>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
