# SEO

| File | What it is |
|---|---|
| [`audit.md`](./audit.md) | Audit findings, verified product capabilities, changes made, before/after, remaining issues |
| [`strategy.md`](./strategy.md) | Positioning, homepage decision, keyword-to-page map, titles, internal linking, content calendar, competitors, backlinks, Search Console plan, roadmap |
| [`keywords.csv`](./keywords.csv) | Keyword dataset (generated) |
| [`keyword-clusters.md`](./keyword-clusters.md) | Cluster → URL summary (generated) |
| `data/autocomplete-raw.csv` | Every raw suggestion and the query that surfaced it (provenance, generated) |
| `data/volumes.csv` | Optional: real metrics you export (see below) |

## Adding or changing a content page

1. Add an entry to `SITE_PAGES` in `src/lib/seo/site.ts` (title, description, primary keyword, `lastReviewed`).
2. Create `src/app/(site)/<path>/page.tsx` using `ContentPage` and `pageMetadata(PATH)`.
3. Check every claim against the capability list in `audit.md` §1.
4. `npm run test:seo`, then with a server running, `npm run seo:audit`.

The sitemap, footer and breadcrumbs pick the page up automatically.

## Keyword dataset

```bash
npx tsx scripts/seo/keywords/collect.ts us        # fetch autocomplete suggestions (cached, resumable, ~1 req/s)
npx tsx scripts/seo/keywords/collect.ts gb in     # optional extra countries
npx tsx scripts/seo/keywords/build.ts             # classify, map and write the CSV + cluster report
```

How to read it:

- Every keyword is a real Google Autocomplete suggestion (source and collection date in each row). Seeds are
  in `scripts/seo/keywords/seeds.ts`; nothing is produced by combining words.
- `monthly_search_volume` and `keyword_difficulty` are **unknown** unless you add `docs/seo/data/volumes.csv`
  with columns `keyword,volume,difficulty,source,date` (e.g., Google Keyword Planner export, or another tool you
  license) and rebuild. Search Console gives impressions, not volume; label them as such if you import them.
- `autocomplete_best_position` and `autocomplete_appearances` are popularity *proxies*: higher in the list and
  surfaced by more queries usually means more searched. They are not volume.
- `relevance` is `high`, `medium` or `low`. Off-topic suggestions (paper notepads, word meanings, etc.) are
  dropped. `low` rows are kept on purpose: they record demand for features the product lacks ("share",
  "drawing", "pdf") and support queries for other products, so nobody targets them by mistake.
- `serp_dominant_content_type` is `not analyzed`; fill it in manually for the keywords you decide to target.
- `priority_score` formula is in `build.ts` (`priorityOf`).
