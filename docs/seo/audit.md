# SEO audit and before/after report

Audit date: 2026-10-27. Branch: `feat/seo-foundation`. Evidence comes from the codebase and from fetching
https://nextnotepad.com as Googlebot on the audit date. No Google Search Console, analytics or rank-tracking
data was available, so this report contains no traffic, ranking, impression or backlink figures.

## 1. What the product actually does (verified in code)

These are the claims the site may make. Anything not on this list must not appear in copy or structured data.

| Capability | Verified in | Notes |
|---|---|---|
| Monaco editor, tabs (reorderable), split editor | `src/components/editor/*`, `tabsStore.reorderTabs` | |
| 30 syntax-highlighting languages | `src/lib/constants/languages.ts` | The old site claimed "50+". |
| 9 themes incl. a Notepad++ theme | `src/lib/constants/themes.ts` | |
| Autosave every 2 / 5 / 10 s (default 5), or manual | `defaultSettings.ts` | |
| Encodings: UTF-8, UTF-8 BOM, UTF-16 LE/BE, ASCII, ISO-8859-1 | `EncodingMenu.tsx` | |
| Folders, recycle bin, favorites, recent files, daily notes | explorer, `dailyNotes.ts` | |
| Multiple workspaces | `multiWorkspaceStore.ts`, `WorkspaceDropdown.tsx` | **Signed-in only**; guests get one. |
| Guest mode in IndexedDB/localStorage | storage services | Lost if site data is cleared. |
| Google Drive storage, `drive.file` scope | `src/lib/auth/google.ts` | App sees only files it created. |
| Per-file passphrase encryption, AES-256-GCM, PBKDF2 210k | `fileEncryption.ts`, `fileLock.ts` | Runs in the browser. |
| App password lock (scrypt hash) | `src/lib/lock/*` | Signed-in only. |
| Local folder copy | `localMirror/*` | Signed-in, File System Access API (Chromium desktop). |
| Find/replace, find in files, Quick Open, Command Palette | `shortcuts.ts` | |
| Diff checker, Markdown preview, formatters, text tools | `textTools.ts`, `formatters.ts` | Full list on `/developers`. |
| AI grammar/Markdown/prompt tools | `src/app/api/ai/*` | Sends text to Gemini or Claude. |
| Voice typing | `dictation/*` | Browser speech recognition. |
| ZIP export/import | `zipService.ts` | Works in both modes. |
| PWA install | `manifest.ts`, `public/sw.js` | |
| Offline | `public/sw.js` | **Limited**: Monaco loads from a CDN that the service worker does not cache, so claim only that guest notes are stored locally. |

Not supported (do not target): sharing by link, collaboration, rich text, drawing/handwriting, PDF/Word export,
reminders, a browser extension, running code, per-file download.

## 2. Findings on the live site (before)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | Critical | **Fabricated review markup**: `aggregateRating` 4.9 from 1,840 ratings in JSON-LD with no real reviews. Violates Google's review-snippet and spam policies; can trigger a manual action. | `src/app/layout.tsx` (old) |
| 2 | Critical | **No crawlable content on the only public URL.** `/` is a client-only app; the server HTML is a loading splash whose H1 is "NextNotePad.com Modern Browser Notepad". | `curl -A Googlebot https://nextnotepad.com/` |
| 3 | High | **~130 KB of keyword stuffing** in `<meta name="keywords">` (≈3,700 generated phrases) on every page. Ignored by Google, a spam signal for Bing, and it made the homepage HTML 236 KB. | `src/lib/constants/seoKeywords.ts` |
| 4 | High | `robots.txt` and `sitemap.xml` return 404. | live fetch |
| 5 | High | Unsupported claims: "#1 free online notepad", "50+ languages", "offline-first". | layout metadata |
| 6 | High | Only one indexable URL, so no page could rank for comparisons, guides, use cases or features. | `src/app` routes |
| 7 | Medium | `<title>` was just "NextNotePad"; the descriptive title only lived in Open Graph. | live HTML |
| 8 | Medium | Social card used the 512×512 icon with `summary_large_image`, so shares looked broken. | layout metadata |
| 9 | Medium | `alternateName` stuffed with keyword variants, including the typo domain "NextNoteNotePad.com". | JSON-LD |
| 10 | Low | Manifest declares the square icon as a `wide` screenshot. | `src/app/manifest.ts` |
| 11 | Low | No privacy policy or terms page; Google OAuth verification and user trust both expect one. | routes |
| ok | – | `www` → apex 301 works; HTTPS in place; `lang="en"`; viewport set. | live fetch |

Not available, so not assessed: Core Web Vitals field data (CrUX), Search Console coverage, backlinks, rankings.

## 3. Changes made on this branch (after)

| Area | Change | Files |
|---|---|---|
| Spam risk | Removed fake `aggregateRating`, keyword-stuffed `alternateName`, meta keywords and unverifiable claims. | `src/app/layout.tsx`, deleted `src/lib/constants/seoKeywords.ts`, `scripts/generate-keywords.mjs` |
| Architecture | Route groups: `(app)` holds the editor at `/` with `AppProviders`; `(site)` holds static, server-rendered content pages that ship none of the editor's JS. The editor is unchanged. | `src/app/(app)/*`, `src/app/(site)/*` |
| Metadata | One registry (`SITE_PAGES`) drives titles, descriptions, canonicals, Open Graph, sitemap, footer and tests. | `src/lib/seo/site.ts` |
| Homepage | New title and description; canonical; accurate `Organization` + `WebSite` + `WebApplication` JSON-LD. | `src/app/(app)/layout.tsx`, `src/lib/seo/jsonLd.ts` |
| Crawling | `robots.txt` (allow all, block `/api/`, sitemap link) and `sitemap.xml` from the registry. | `src/app/robots.ts`, `src/app/sitemap.ts` |
| Social | Generated 1200×630 Open Graph image used on every page. | `src/app/opengraph-image.tsx` |
| Content | 9 new pages: features, Notepad++ comparison, developers, privacy & security, keyboard shortcuts (generated from the app's shortcut table), guides hub, two guides, FAQ. Every claim checked against code. | `src/app/(site)/**` |
| Structured data | `BreadcrumbList` on every content page, `Article` on guides. JSON-LD escaped against `</script>` injection. | `src/components/site/ContentPage.tsx` |
| Internal links | Header nav, grouped footer, breadcrumbs, "Keep reading" blocks and contextual links; Help menu in the app links to Features, Privacy & Security and FAQ (new tab). | `src/components/site/*`, `src/components/menu/HelpMenu.tsx` |
| Accessibility | Skip link, one H1 per page, `aria-current` breadcrumbs, table headers with `scope`, responsive tables. | site components |
| Tests | `npm run test:seo` (registry: unique titles and descriptions, length limits, route files exist, sitemap/robots, banned schema, breadcrumbs, cannibalization). `npm run seo:audit [url]` crawls a running server: status, one H1, canonical, JSON-LD parses, no ratings, no meta keywords, thin content, broken internal links, orphans, real 404s. | `src/lib/seo/seo.test.ts`, `scripts/seo-audit.ts` |
| Keywords | Research pipeline using real autocomplete data instead of generated combinations. | `scripts/seo/keywords/*`, `docs/seo/keywords.csv` |

### Measured before/after (production build, `next start`)

| Metric | Before (live) | After (local prod build) |
|---|---|---|
| Homepage HTML size | 236 KB | 22 KB |
| Homepage `<title>` | "NextNotePad" | "NextNotePad — Free Online Notepad and Text Editor in Your Browser" |
| Indexable URLs in sitemap | 0 (no sitemap) | 10 |
| robots.txt / sitemap.xml | 404 / 404 | 200 / 200 |
| Fake rating markup | present | removed |
| Content-page first-load JS | n/a | ~106 KB (framework only, no editor) |
| `seo:audit` | n/a | 0 errors, 1 warning (`/guides` hub is 222 words) |
| Existing test suites | – | all pass (text-tools 18, lock 16, local-mirror 15, dictation 9) + seo 11 |

## 4. Remaining issues (prioritized)

1. **Homepage content (decision needed).** `/` is still the editor, so the strongest URL carries little crawlable
   text. Options are in `strategy.md` §2. This is the biggest remaining ranking constraint.
2. **Deploy, then submit the sitemap** in Search Console and request indexing of the new URLs. Run
   `npm run seo:audit -- https://nextnotepad.com` after deploying.
3. **Privacy policy and terms pages** (owner-written legal text). Needed for Google OAuth verification and trust.
4. **Unauthenticated AI endpoints** (`/api/ai/*`): anyone can call them and spend the Gemini/Claude quota. Not an
   SEO issue, but a cost and abuse risk worth fixing (require a session or rate-limit).
5. **Offline claim gap**: self-host Monaco (`loader.config({ monaco })`) and cache it in the service worker; then
   "works offline" becomes true and is a strong differentiator in this market.
6. Manifest `screenshots` uses the square icon as `wide`; replace with real screenshots (also improves the install UI).
7. Core Web Vitals: measure with PageSpeed Insights/CrUX after deploy; the editor route is ~960 KB of JS before
   Monaco, so watch INP/LCP there.
