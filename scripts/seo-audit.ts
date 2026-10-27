/**
 * Crawls a running NextNotePad server and checks what search engines actually
 * receive: status codes, titles, descriptions, canonicals, H1s, JSON-LD,
 * thin content, broken internal links and banned markup.
 *
 *   npm run seo:audit                         # against http://localhost:3000
 *   npm run seo:audit -- https://nextnotepad.com
 *
 * Exits non-zero if any page has an error.
 */
import { SITE_URL } from "../src/lib/seo/site";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const MIN_WORDS = 250;

interface Finding {
  url: string;
  level: "error" | "warn";
  message: string;
}

const findings: Finding[] = [];
function report(url: string, level: Finding["level"], message: string): void {
  findings.push({ url, level, message });
}

/** Maps a canonical production URL onto the server being audited. */
const toLocal = (url: string) => url.replace(SITE_URL, base);

async function fetchText(
  url: string,
): Promise<{ status: number; body: string; contentType: string }> {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "NextNotePad-SEO-Audit" },
  });
  return {
    status: res.status,
    body: await res.text(),
    contentType: res.headers.get("content-type") ?? "",
  };
}

const all = (html: string, re: RegExp) =>
  [...html.matchAll(re)].map((m) => m[1]);
const first = (html: string, re: RegExp) => html.match(re)?.[1];
const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

function visibleWordCount(html: string): number {
  const main = first(html, /<main[^>]*>([\s\S]*?)<\/main>/i) ?? "";
  const text = main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decode(text).split(/\s+/).filter(Boolean).length;
}

async function auditPage(
  url: string,
  seen: { titles: Map<string, string>; descriptions: Map<string, string> },
) {
  const { status, body: html } = await fetchText(toLocal(url));
  if (status !== 200) return report(url, "error", `HTTP ${status}`);

  const title = decode(first(html, /<title>([^<]*)<\/title>/i) ?? "");
  const description = decode(
    first(html, /<meta name="description" content="([^"]*)"/i) ?? "",
  );
  const canonical = first(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = first(html, /<meta name="robots" content="([^"]*)"/i);
  const h1s = all(html, /<h1[\s>]/gi);
  const ogImage = first(html, /<meta property="og:image" content="([^"]*)"/i);

  if (!title) report(url, "error", "missing <title>");
  else if (title.length > 70)
    report(url, "warn", `title is ${title.length} chars`);
  if (!description) report(url, "error", "missing meta description");
  else if (description.length > 160)
    report(url, "warn", `description is ${description.length} chars`);
  if (canonical !== url)
    report(
      url,
      "error",
      `canonical is ${canonical ?? "missing"}, expected ${url}`,
    );
  if (robots?.includes("noindex"))
    report(url, "error", "page in sitemap is noindex");
  if (h1s.length !== 1)
    report(url, "error", `expected exactly one <h1>, found ${h1s.length}`);
  if (!ogImage) report(url, "warn", "missing og:image");
  if (/<meta name="keywords"/i.test(html))
    report(url, "error", "meta keywords tag present");

  for (const [kind, value, map] of [
    ["title", title, seen.titles],
    ["description", description, seen.descriptions],
  ] as const) {
    if (!value) continue;
    const other = map.get(value);
    if (other) report(url, "error", `duplicate ${kind} with ${other}`);
    map.set(value, url);
  }

  for (const raw of all(
    html,
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const json = JSON.parse(raw);
      if (raw.includes("aggregateRating") || raw.includes('"review"')) {
        report(
          url,
          "error",
          "JSON-LD contains ratings or reviews; only add them if they are real and first-party",
        );
      }
      if (!json["@context"]) report(url, "error", "JSON-LD missing @context");
    } catch {
      report(url, "error", "JSON-LD does not parse");
    }
  }

  // The editor at "/" is a client app; its words live in the app, not the HTML.
  if (url !== SITE_URL) {
    const words = visibleWordCount(html);
    if (words < MIN_WORDS)
      report(url, "warn", `thin content: ${words} words in <main>`);
  }

  return all(html, /<a [^>]*href="(\/[^"#?]*)"/gi);
}

async function main() {
  const robots = await fetchText(`${base}/robots.txt`);
  if (robots.status !== 200)
    report(`${base}/robots.txt`, "error", `HTTP ${robots.status}`);
  else if (!robots.body.includes("Sitemap:"))
    report(`${base}/robots.txt`, "error", "no Sitemap line");

  const sitemap = await fetchText(`${base}/sitemap.xml`);
  if (sitemap.status !== 200) {
    report(`${base}/sitemap.xml`, "error", `HTTP ${sitemap.status}`);
    return finish(0);
  }
  const urls = all(sitemap.body, /<loc>([^<]+)<\/loc>/g);

  const seen = {
    titles: new Map<string, string>(),
    descriptions: new Map<string, string>(),
  };
  const linked = new Set<string>();
  for (const url of urls) {
    for (const href of (await auditPage(url, seen)) ?? []) linked.add(href);
  }

  // Every internal link must resolve, and every sitemap page should be linked from somewhere.
  for (const href of linked) {
    const { status } = await fetchText(`${base}${href}`);
    if (status !== 200)
      report(`${base}${href}`, "error", `internal link returns HTTP ${status}`);
  }
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    if (pathname !== "/" && !linked.has(pathname))
      report(url, "warn", "orphan: no internal links point here");
  }

  const notFound = await fetchText(
    `${base}/this-page-should-not-exist-${Date.now()}`,
  );
  if (notFound.status !== 404)
    report(
      base,
      "error",
      `unknown URLs return HTTP ${notFound.status}, not 404`,
    );

  finish(urls.length);
}

function finish(pageCount: number) {
  const errors = findings.filter((f) => f.level === "error");
  const warnings = findings.filter((f) => f.level === "warn");
  for (const f of findings)
    console.log(
      `${f.level === "error" ? "ERROR" : "warn "}  ${f.url}  ${f.message}`,
    );
  console.log(
    `\nAudited ${pageCount} sitemap URLs on ${base}: ${errors.length} errors, ${warnings.length} warnings.`,
  );
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
