/**
 * Collects real search suggestions from Google Autocomplete for every seed in
 * seeds.ts. Suggestions are queries people actually type, so they are a demand
 * signal, but they carry NO search volume; volume stays "unknown" until a
 * Keyword Planner / Search Console export is merged (see build.ts).
 *
 *   npx tsx scripts/seo/keywords/collect.ts            # locale us
 *   npx tsx scripts/seo/keywords/collect.ts gb in      # extra locales
 *
 * Polite by design: one request at a time, ~1s apart, every response cached in
 * .cache/ so reruns only fetch what is missing, and it stops on rate limiting.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LETTER_SUFFIXES, QUESTION_PREFIXES, SEEDS } from "./seeds";

export const CACHE_DIR = path.join(
  process.cwd(),
  "scripts/seo/keywords/.cache",
);
const DELAY_MS = 900;
const MAX_CONSECUTIVE_FAILURES = 3;

export interface CachedResponse {
  query: string;
  locale: string;
  seed: string;
  category: string;
  collectedAt: string;
  suggestions: string[];
}

export function cacheFile(locale: string, query: string): string {
  const safe = query.replace(/[^a-z0-9+]+/gi, "_").slice(0, 120);
  return path.join(CACHE_DIR, locale, `${safe}.json`);
}

export function buildQueries(): {
  query: string;
  seed: string;
  category: string;
}[] {
  const queries: { query: string; seed: string; category: string }[] = [];
  for (const [category, seeds] of Object.entries(SEEDS)) {
    for (const seed of seeds) {
      const words = seed.split(" ").length;
      queries.push({ query: seed, seed, category });
      if (words <= 4) {
        for (const letter of LETTER_SUFFIXES)
          queries.push({ query: `${seed} ${letter}`, seed, category });
      }
      if (words <= 3) {
        for (const prefix of QUESTION_PREFIXES) {
          if (!seed.startsWith(prefix))
            queries.push({ query: `${prefix} ${seed}`, seed, category });
        }
      }
    }
  }
  return queries;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSuggestions(
  query: string,
  locale: string,
): Promise<string[] | null> {
  const url =
    "https://suggestqueries.google.com/complete/search?client=firefox&hl=en" +
    `&gl=${encodeURIComponent(locale)}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (keyword research; nextnotepad.com)",
    },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as [string, string[]];
  return Array.isArray(body[1]) ? body[1] : [];
}

async function main() {
  const locales = process.argv.slice(2).length ? process.argv.slice(2) : ["us"];
  const queries = buildQueries();
  let failures = 0;

  for (const locale of locales) {
    mkdirSync(path.join(CACHE_DIR, locale), { recursive: true });
    const todo = queries.filter((q) => !existsSync(cacheFile(locale, q.query)));
    console.log(
      `[${locale}] ${queries.length} queries, ${todo.length} not cached yet`,
    );

    for (const [i, q] of todo.entries()) {
      let suggestions: string[] | null = null;
      try {
        suggestions = await fetchSuggestions(q.query, locale);
      } catch {
        suggestions = null;
      }
      if (suggestions === null) {
        failures++;
        console.warn(`  failed: ${q.query} (${failures} in a row)`);
        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          console.error(
            "Stopping: likely rate limited. Rerun later; cached results are kept.",
          );
          process.exit(2);
        }
        await sleep(DELAY_MS * 10);
        continue;
      }
      failures = 0;
      const record: CachedResponse = {
        ...q,
        locale,
        collectedAt: new Date().toISOString(),
        suggestions,
      };
      writeFileSync(cacheFile(locale, q.query), JSON.stringify(record));
      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${todo.length}`);
      await sleep(DELAY_MS + Math.random() * 400);
    }
  }
  console.log("Done.");
}

export function readCache(locale: string): CachedResponse[] {
  const dir = path.join(CACHE_DIR, locale);
  if (!existsSync(dir)) return [];
  return buildQueries()
    .map((q) => cacheFile(locale, q.query))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as CachedResponse);
}

if (process.argv[1]?.endsWith("collect.ts")) {
  void main();
}
