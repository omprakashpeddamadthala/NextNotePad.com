import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  HOME_PAGE,
  SITE_NAME,
  SITE_PAGES,
  SITE_URL,
  absoluteUrl,
} from "./site";
import { breadcrumbJsonLd, homeJsonLd, serializeJsonLd } from "./jsonLd";
import sitemap from "../../app/sitemap";
import robots from "../../app/robots";

// The root layout appends " — NextNotePad" to every content-page title.
const TITLE_SUFFIX = ` — ${SITE_NAME}`;
const MAX_TITLE = 70;
const MIN_DESCRIPTION = 70;
const MAX_DESCRIPTION = 160;

test("every registered page has a route file", () => {
  for (const page of SITE_PAGES) {
    const file = path.join(
      process.cwd(),
      "src/app/(site)",
      page.path,
      "page.tsx",
    );
    assert.ok(
      existsSync(file),
      `${page.path} is in SITE_PAGES but ${file} does not exist`,
    );
  }
});

test("paths are unique, lowercase and hyphenated", () => {
  const seen = new Set<string>();
  for (const page of SITE_PAGES) {
    assert.match(
      page.path,
      /^(\/[a-z0-9]+(-[a-z0-9]+)*)+$/,
      `bad slug: ${page.path}`,
    );
    assert.ok(!seen.has(page.path), `duplicate path ${page.path}`);
    seen.add(page.path);
  }
});

test("titles are unique and fit in search results", () => {
  const titles = [
    HOME_PAGE.title,
    ...SITE_PAGES.map((p) => p.title + TITLE_SUFFIX),
  ];
  assert.equal(
    new Set(titles.map((t) => t.toLowerCase())).size,
    titles.length,
    "duplicate title",
  );
  for (const title of titles) {
    assert.ok(
      title.length <= MAX_TITLE,
      `title too long (${title.length}): ${title}`,
    );
  }
});

test("descriptions are unique and a sensible length", () => {
  const descriptions = [
    HOME_PAGE.description,
    ...SITE_PAGES.map((p) => p.description),
  ];
  assert.equal(
    new Set(descriptions).size,
    descriptions.length,
    "duplicate description",
  );
  for (const d of descriptions) {
    assert.ok(
      d.length >= MIN_DESCRIPTION && d.length <= MAX_DESCRIPTION,
      `description length ${d.length} outside ${MIN_DESCRIPTION}-${MAX_DESCRIPTION}: ${d}`,
    );
  }
});

test("each page owns a distinct primary keyword (no cannibalization)", () => {
  const keywords = [
    HOME_PAGE.primaryKeyword,
    ...SITE_PAGES.map((p) => p.primaryKeyword),
  ];
  assert.equal(
    new Set(keywords).size,
    keywords.length,
    "two pages target the same primary keyword",
  );
});

test("lastReviewed dates are valid ISO dates and not in the future", () => {
  for (const page of SITE_PAGES) {
    const date = new Date(`${page.lastReviewed}T00:00:00Z`);
    assert.ok(
      !Number.isNaN(date.getTime()),
      `${page.path} has invalid lastReviewed`,
    );
    assert.ok(
      date.getTime() <= Date.now(),
      `${page.path} lastReviewed is in the future`,
    );
  }
});

test("sitemap lists the homepage and every registered page exactly once", () => {
  const urls = sitemap().map((entry) => entry.url);
  const expected = [
    absoluteUrl("/"),
    ...SITE_PAGES.map((p) => absoluteUrl(p.path)),
  ];
  assert.deepEqual([...urls].sort(), [...expected].sort());
  for (const url of urls)
    assert.ok(url.startsWith("https://"), `non-https sitemap URL ${url}`);
});

test("robots.txt allows the site, blocks the API and points at the sitemap", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const all = rules.find((r) => r.userAgent === "*");
  assert.ok(all, "no rule for *");
  assert.equal(all.allow, "/");
  assert.deepEqual(all.disallow, ["/api/"]);
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);
});

test("homepage structured data makes no unverifiable claims", () => {
  const json = serializeJsonLd(homeJsonLd());
  for (const banned of [
    "aggregateRating",
    '"review"',
    "ratingValue",
    "#1",
    "50+",
  ]) {
    assert.ok(!json.includes(banned), `homepage JSON-LD contains "${banned}"`);
  }
});

test("breadcrumbs resolve every ancestor of nested pages", () => {
  for (const page of SITE_PAGES) {
    const data = breadcrumbJsonLd(page.path) as {
      itemListElement: { item: string }[];
    };
    const depth = page.path.split("/").filter(Boolean).length;
    assert.equal(data.itemListElement.length, depth + 1);
    assert.equal(data.itemListElement.at(-1)?.item, absoluteUrl(page.path));
  }
});

test("serialized JSON-LD cannot break out of its script tag", () => {
  assert.ok(
    !serializeJsonLd({ text: "</script><script>alert(1)</script>" }).includes(
      "</script>",
    ),
  );
});
