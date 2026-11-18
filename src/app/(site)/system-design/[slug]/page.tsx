import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { CodeBlock } from "@/components/site/systemDesign/CodeBlock";
import { ConceptNav } from "@/components/site/systemDesign/ConceptNav";
import { FlowDiagram } from "@/components/site/systemDesign/FlowDiagram";
import { InlineCode } from "@/components/site/systemDesign/InlineCode";
import { PagerLink } from "@/components/site/systemDesign/PagerLink";
import { TradeoffList } from "@/components/site/systemDesign/TradeoffList";
import {
  CONCEPTS,
  SYSTEM_DESIGN_PATH,
  categoryLabel,
  conceptPath,
  getConcept,
  neighbours,
} from "@/lib/systemDesign/concepts";
import { conceptJsonLd, conceptMetadata } from "@/lib/systemDesign/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const concept = getConcept((await params).slug);
  return concept ? conceptMetadata(concept) : {};
}

const H2 = "mt-12 text-2xl font-semibold tracking-tight text-slate-900";
const PROSE =
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-slate-800";

export default async function ConceptPage({ params }: Props) {
  const concept = getConcept((await params).slug);
  if (!concept) notFound();
  const { prev, next } = neighbours(concept.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <JsonLd data={conceptJsonLd(concept)} />

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <ConceptNav currentSlug={concept.slug} />
        </div>
      </aside>

      <article className={`max-w-3xl min-w-0 ${PROSE}`}>
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-slate-900 hover:underline">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <Link
                href={SYSTEM_DESIGN_PATH}
                className="hover:text-slate-900 hover:underline"
              >
                System Design
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <span aria-current="page">{concept.title}</span>
            </li>
          </ol>
        </nav>

        <details className="mt-4 rounded-lg border border-slate-200 lg:hidden">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700">
            Browse all concepts
          </summary>
          <div className="border-t border-slate-200 px-4 pt-2 pb-4">
            <ConceptNav currentSlug={concept.slug} />
          </div>
        </details>

        <header className="mt-6">
          <p className="text-sm font-semibold tracking-wide text-indigo-600">
            {categoryLabel(concept.category)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {concept.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {concept.summary}
          </p>
        </header>

        <section aria-labelledby="idea">
          <h2 id="idea" className={H2}>
            The idea
          </h2>
          <FlowDiagram steps={concept.flow} />
          {concept.body.map((paragraph) => (
            <p key={paragraph} className="mt-4 leading-7">
              <InlineCode text={paragraph} />
            </p>
          ))}
        </section>

        <section aria-labelledby="when">
          <h2 id="when" className={H2}>
            When to use it
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7">
            {concept.useWhen.map((item) => (
              <li key={item}>
                <InlineCode text={item} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tradeoffs">
          <h2 id="tradeoffs" className={H2}>
            Trade-offs
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TradeoffList title="Gains" items={concept.pros} tone="gain" />
            <TradeoffList title="Costs" items={concept.cons} tone="cost" />
          </div>
        </section>

        <section aria-labelledby="spring">
          <h2 id="spring" className={H2}>
            In Spring Boot
          </h2>
          <p className="mt-4 leading-7">
            <InlineCode text={concept.spring.intro} />
          </p>
          <h3 className="mt-6 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Dependencies
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {concept.spring.dependencies.map((dep) => (
              <li
                key={dep}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs break-all text-slate-700"
              >
                {dep}
              </li>
            ))}
          </ul>
          <CodeBlock code={concept.spring.code} label="Java · Spring Boot" />
          <h3 className="mt-8 text-lg font-semibold text-slate-900">
            Watch out for
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
            {concept.spring.notes.map((note) => (
              <li key={note}>
                <InlineCode text={note} />
              </li>
            ))}
          </ul>
        </section>

        <aside className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
          <p className="text-sm font-semibold tracking-wide text-indigo-700 uppercase">
            Interview tip
          </p>
          <p className="mt-2 text-slate-800">{concept.interviewTip}</p>
        </aside>

        <nav
          aria-label="Previous and next concept"
          className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2"
        >
          {prev ? (
            <PagerLink href={conceptPath(prev.slug)} hint="Previous">
              {prev.title}
            </PagerLink>
          ) : (
            <span />
          )}
          {next && (
            <PagerLink href={conceptPath(next.slug)} hint="Next" alignRight>
              {next.title}
            </PagerLink>
          )}
        </nav>
      </article>
    </div>
  );
}
