import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";
import {
  CATEGORIES,
  CONCEPTS,
  SYSTEM_DESIGN_PATH,
  conceptPath,
  conceptsInCategory,
} from "@/lib/systemDesign/concepts";

export const metadata = pageMetadata(SYSTEM_DESIGN_PATH);

export default function SystemDesignPage() {
  return (
    <ContentPage
      path={SYSTEM_DESIGN_PATH}
      heading="System design, the Spring Boot way"
      intro={
        <p>
          {CONCEPTS.length} core concepts for building backends that scale. Each
          one explains the idea in plain English, shows the trade-offs, and ends
          with working Java and Spring Boot code.
        </p>
      }
      related={["/developers", "/guides"]}
    >
      <h2>How each page is laid out</h2>
      <ol>
        <li>
          <strong>The idea</strong>: what it is and the problem it solves.
        </li>
        <li>
          <strong>A flow diagram</strong>: the path a request takes.
        </li>
        <li>
          <strong>When to use it</strong> and the trade-offs.
        </li>
        <li>
          <strong>In Spring Boot</strong>: the dependencies, a code sample and
          gotchas.
        </li>
        <li>
          <strong>Interview tip</strong>: one line worth saying out loud.
        </li>
      </ol>

      {CATEGORIES.map((category) => (
        <section key={category.id} aria-labelledby={`cat-${category.id}`}>
          <h2 id={`cat-${category.id}`}>{category.label}</h2>
          <p className="!mt-2 text-slate-500">{category.blurb}</p>
          <ul className="!mt-5 grid !list-none gap-4 !space-y-0 !pl-0 sm:grid-cols-2">
            {conceptsInCategory(category.id).map((concept) => (
              <li key={concept.slug}>
                <Link
                  href={conceptPath(concept.slug)}
                  className="group block h-full rounded-xl border border-slate-200 bg-white p-5 !no-underline shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="flex items-center justify-between gap-3 font-semibold text-slate-900 group-hover:text-indigo-700">
                    {concept.title}
                    <span
                      aria-hidden="true"
                      className="text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">
                    {concept.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </ContentPage>
  );
}
