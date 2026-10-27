import {
  HOME_PAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  getSitePage,
} from "./site";

type JsonLdNode = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;

/**
 * Homepage graph. Every statement must stay verifiable in the product:
 * no ratings or review counts until real, first-party reviews exist
 * (Google treats invented aggregateRating as spammy structured data).
 */
export function homeJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        alternateName: "NextNotePad.com",
        url: SITE_URL,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": APP_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: HOME_PAGE.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (runs in a modern web browser)",
        browserRequirements: "Requires JavaScript and a modern browser.",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": ORGANIZATION_ID },
        featureList: [
          "Multi-tab text and code editing",
          "Folders and multiple workspaces",
          "Works without an account using browser storage",
          "Optional Google Drive storage after sign-in",
          "Autosave",
          "Syntax highlighting for 30 languages",
          "Find and replace across files",
          "Diff checker and split editor",
          "Markdown preview",
          "Per-file passphrase encryption",
          "Installable as a progressive web app",
        ],
      },
    ],
  };
}

export function breadcrumbJsonLd(path: string): JsonLdNode {
  const segments = path.split("/").filter(Boolean);
  const items = [{ name: "Home", url: SITE_URL }];
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    items.push({
      name: getSitePage(current).navLabel,
      url: absoluteUrl(current),
    });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleJsonLd(path: string): JsonLdNode {
  const page = getSitePage(path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    url: absoluteUrl(page.path),
    mainEntityOfPage: absoluteUrl(page.path),
    dateModified: page.lastReviewed,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    // Inlined: Google does not resolve @id references across pages.
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    image: `${SITE_URL}/opengraph-image`,
  };
}

/** Escapes "<" so content can never close the surrounding <script> tag. */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
