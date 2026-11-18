import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, absoluteUrl, getSitePage } from "@/lib/seo/site";
import { SYSTEM_DESIGN_PATH, conceptPath, type Concept } from "./concepts";

/** Concept pages share one review date with the hub page. */
export function conceptLastReviewed(): string {
  return getSitePage(SYSTEM_DESIGN_PATH).lastReviewed;
}

/** "<Title> in Spring Boot"; the root layout appends " — NextNotePad". */
export function conceptTitle(concept: Concept): string {
  return `${concept.title} in Spring Boot`;
}

export function conceptMetadata(concept: Concept): Metadata {
  const url = absoluteUrl(conceptPath(concept.slug));
  const title = conceptTitle(concept);
  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${title} — ${SITE_NAME}`,
  };
  return {
    title,
    description: concept.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} — ${SITE_NAME}`,
      description: concept.summary,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
      title: `${title} — ${SITE_NAME}`,
      description: concept.summary,
    },
  };
}

export function conceptJsonLd(concept: Concept): Record<string, unknown> {
  const url = absoluteUrl(conceptPath(concept.slug));
  const publisher = {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", item: SITE_URL },
          {
            name: getSitePage(SYSTEM_DESIGN_PATH).navLabel,
            item: absoluteUrl(SYSTEM_DESIGN_PATH),
          },
          { name: concept.title, item: url },
        ].map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          ...crumb,
        })),
      },
      {
        "@type": "TechArticle",
        headline: conceptTitle(concept),
        description: concept.summary,
        url,
        mainEntityOfPage: url,
        dateModified: conceptLastReviewed(),
        proficiencyLevel: "Beginner",
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher,
        image: `${SITE_URL}/opengraph-image`,
      },
    ],
  };
}
