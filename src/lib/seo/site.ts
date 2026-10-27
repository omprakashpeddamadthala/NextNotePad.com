import type { Metadata, MetadataRoute } from "next";

/**
 * Canonical production origin. Deliberately not derived from NEXT_PUBLIC_APP_URL
 * (which may point at a preview/Railway host) so canonicals and the sitemap
 * always name the real domain. Override only for a genuine domain move.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nextnotepad.com"
).replace(/\/$/, "");

export const SITE_NAME = "NextNotePad";

export type SiteSection =
  "product" | "use-cases" | "compare" | "guides" | "help";

export interface SitePage {
  /** Route path, always starting with "/". */
  path: string;
  /** Title segment; the root layout template appends " — NextNotePad". */
  title: string;
  description: string;
  /** Short label for nav, footer and breadcrumbs. */
  navLabel: string;
  section: SiteSection;
  /** The search-intent cluster this URL owns (see docs/seo/keyword-map.md). */
  primaryKeyword: string;
  /** ISO date the copy was last checked against the product. */
  lastReviewed: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
}

/**
 * Registry of every indexable content page. Adding a page here puts it in the
 * sitemap and footer; scripts/seo tests enforce uniqueness and length limits.
 * The editor itself ("/") is described by HOME_PAGE below.
 */
export const SITE_PAGES: SitePage[] = [
  {
    path: "/features",
    title: "Features: Tabs, Folders, Drive Sync, Diff and More",
    description:
      "Everything NextNotePad can do: tabs, folders and workspaces, autosave, Google Drive storage, find in files, a diff checker, Markdown preview and more.",
    navLabel: "Features",
    section: "product",
    primaryKeyword: "online notepad features",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/notepad-plus-plus-alternative",
    title: "Notepad++ Alternative That Runs in Your Browser",
    description:
      "An honest comparison of NextNotePad and Notepad++: what works the same, what is different, and when the desktop editor is still the better choice.",
    navLabel: "vs Notepad++",
    section: "compare",
    primaryKeyword: "notepad++ alternative online",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/developers",
    title: "Online Notepad for Developers: Formatters and Diff",
    description:
      "A browser notepad for code, logs and config files: syntax highlighting for 30 languages, JSON and XML formatting, Base64, hashing and a diff checker.",
    navLabel: "For developers",
    section: "use-cases",
    primaryKeyword: "online notepad for developers",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/security",
    title: "Privacy and Security: Where Your Notes Are Stored",
    description:
      "How NextNotePad stores notes in your browser or your own Google Drive, what the drive.file permission means, and how file encryption and app lock work.",
    navLabel: "Privacy & security",
    section: "product",
    primaryKeyword: "private online notepad",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description:
      "The complete list of NextNotePad keyboard shortcuts for files, editing, search, view and tabs, including Find in Files, Quick Open and the Command Palette.",
    navLabel: "Keyboard shortcuts",
    section: "help",
    primaryKeyword: "online notepad keyboard shortcuts",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/guides",
    title: "Guides: Saving, Organizing and Protecting Notes",
    description:
      "Step-by-step guides for getting more out of NextNotePad: saving notes online, organizing them into folders and workspaces, and keeping private text private.",
    navLabel: "Guides",
    section: "guides",
    primaryKeyword: "online notepad guide",
    lastReviewed: "2026-10-27",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/guides/how-to-save-notes-online",
    title: "How to Save Notes Online Without Installing Anything",
    description:
      "Three ways to save notes from your browser with NextNotePad: in browser storage with no account, in your own Google Drive, or as a ZIP backup you keep yourself.",
    navLabel: "How to save notes online",
    section: "guides",
    primaryKeyword: "save notes online",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/guides/organize-notes-with-folders-and-workspaces",
    title: "How to Organize Notes with Folders and Workspaces",
    description:
      "A practical system for organizing digital notes: separate workspaces for each area of your life, folders inside them, daily notes, favorites and fast search.",
    navLabel: "Organize notes with workspaces",
    section: "guides",
    primaryKeyword: "how to organize digital notes",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about NextNotePad: is it free, do I need an account, where are notes saved, does it work offline, and which browsers are supported.",
    navLabel: "FAQ",
    section: "help",
    primaryKeyword: "online notepad faq",
    lastReviewed: "2026-10-27",
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export const HOME_PAGE = {
  path: "/",
  title: "NextNotePad — Free Online Notepad and Text Editor in Your Browser",
  description:
    "Write and save notes in your browser with no install and no account needed. Tabs, folders, autosave, syntax highlighting and optional Google Drive storage.",
  primaryKeyword: "online notepad",
} as const;

export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export function getSitePage(path: string): SitePage {
  const page = SITE_PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`No SITE_PAGES entry for ${path}`);
  return page;
}

export function pagesInSection(section: SiteSection): SitePage[] {
  return SITE_PAGES.filter((p) => p.section === section);
}

/**
 * Overriding `openGraph` in a nested segment drops the inherited file-based
 * image from src/app/opengraph-image.tsx, so content pages name it explicitly.
 */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "NextNotePad — free online notepad and text editor in your browser",
};

/** Per-page metadata: title, description, canonical and social cards. */
export function pageMetadata(path: string): Metadata {
  const page = getSitePage(path);
  const url = absoluteUrl(page.path);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type:
        page.section === "guides" && page.path !== "/guides"
          ? "article"
          : "website",
      url,
      title: `${page.title} — ${SITE_NAME}`,
      description: page.description,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [OG_IMAGE.url],
      title: `${page.title} — ${SITE_NAME}`,
      description: page.description,
    },
  };
}
