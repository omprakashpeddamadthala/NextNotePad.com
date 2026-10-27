# SEO strategy and roadmap

Companion to [`audit.md`](./audit.md). Keyword evidence lives in [`keywords.csv`](./keywords.csv) and
[`keyword-clusters.md`](./keyword-clusters.md). No ranking or traffic outcome is promised here: the plan maximizes
the chance of ranking and is measured against real Search Console data once it exists.

## 1. Positioning

The "online notepad" results are crowded with exact-match domains (onlinenotepad.org/.net/.io, anotepad,
hypernotepad, justnotepad, notepad.is) offering a single text box. They split into two camps:

- **Browser-only** (onlinenotepad.net, nerdsnote, onlynotepad): private, but notes are stuck on one device and
  vanish when site data is cleared. Several say so openly.
- **Link-based** (hypernotepad, anotepad, notepadonline.ai): notes on any device, but stored on the vendor's
  server and often shareable or public by default.

NextNotePad's defensible angle, which no competitor in these results claims:

> **A real editor (tabs, folders, Monaco, find in files) that starts with no account, and when you want your notes
> everywhere, keeps them as files in your own Google Drive, not on our servers.**

Secondary angles: a Notepad++-style editor on Mac, Chromebook and Linux; developer text tools in one place;
per-file encryption.

Everything published must stay inside the verified capability list in `audit.md` §1.

## 2. Homepage: decision needed

`/` is the editor. Users get the product instantly (good), but crawlers get almost no text (bad), and `/` is
the URL with the most authority. Options:

| Option | What | SEO effect | Risk |
|---|---|---|---|
| A. Keep as is (current branch) | Content lives on `/features` etc.; `/` has strong metadata only. | Weakest for "online notepad". | None. |
| **B. Editor plus content below the fold (recommended)** | Keep the editor in the first viewport. Below it, a server-rendered section a user can scroll to: what it is, how saving works, key features, FAQ, links. Requires the editor shell to stop locking `body` overflow on `/`. | Strong: real, visible, crawlable text on the top URL. This is the pattern most ranking competitors use. | Moderate UI work in `AppShell`; must not hide the text. |
| C. Landing page at `/`, editor at `/app` | Classic SaaS split. | Strong for content, but returning users and the PWA `start_url`, OAuth redirect and service worker all point at `/`. | High: breaks habits and flows. |

Hiding text from users while showing it to crawlers is cloaking; option B only works if the content is
genuinely visible and useful.

## 3. Keyword-to-page map

Each URL owns one primary intent (enforced by the cannibalization test in `seo.test.ts`). Counts come from
`keyword-clusters.md`.

| URL | Status | Primary intent | Secondary intents |
|---|---|---|---|
| `/` | live | online notepad | free online notepad, notepad online, online text editor, web/browser notepad, online scratchpad, no-login variants |
| `/features` | live | online notepad features | notepad with tabs, autosave, syntax highlighting, dark mode, encodings, install as app |
| `/notepad-plus-plus-alternative` | live | notepad++ alternative online | notepad++ online, notepad++ for mac/linux/chromebook, notepad++ in browser |
| `/developers` | live | online notepad for developers | code notepad, base64/hash/case tools, programming notes |
| `/security` | live | private online notepad | encrypted / password-protected notepad, secure notes online |
| `/keyboard-shortcuts` | live | online notepad keyboard shortcuts | notepad hotkeys |
| `/guides/how-to-save-notes-online` | live | save notes online | save text online, notes in Google Drive, backup notes, notepad that saves |
| `/guides/organize-notes-with-folders-and-workspaces` | live | how to organize digital notes | notes with folders, note organization |
| `/faq` | live | online notepad faq | does it work offline, is it free |
| `/diff-checker` | proposed | diff checker / compare text online | compare two files, text compare |
| `/json-formatter` | proposed | json formatter online | json beautifier, minify json |
| `/markdown-editor` | proposed | markdown editor online | markdown notepad, markdown preview |
| `/devices` | proposed | notepad for mac / chromebook / linux | one page, not one per platform |
| `/alternatives` | proposed | google keep / onenote / evernote / simplenote alternative | fair comparison hub; split later only if data justifies |
| `/for/students`, `/for/writing`, `/for/meeting-notes` | proposed | use-case landing pages | only build where the cluster shows real demand and there is something specific to say |

Rules: no city pages, no per-keyword pages, no page whose only difference is a swapped keyword. A proposed page
ships only when it has a distinct intent, specific instructions and accurate feature claims, and passes `seo:audit`.

Tool pages (diff, JSON, Markdown) are the biggest opportunity: high, transactional demand, and the capability
already exists. Each should render a working tool, or open the editor with the tool ready, not just describe it.

## 4. Titles, descriptions and headings

Source of truth: `SITE_PAGES` / `HOME_PAGE` in `src/lib/seo/site.ts`. Tests enforce title ≤ 70 characters
including the brand suffix, descriptions 70–160 characters, uniqueness and one H1 per page.

| URL | Title | H1 |
|---|---|---|
| `/` | NextNotePad — Free Online Notepad and Text Editor in Your Browser | (editor; see §2) |
| `/features` | Features: Tabs, Folders, Drive Sync, Diff and More — NextNotePad | NextNotePad features |
| `/notepad-plus-plus-alternative` | Notepad++ Alternative That Runs in Your Browser — NextNotePad | A Notepad++ alternative that runs in your browser |
| `/developers` | Online Notepad for Developers: Formatters and Diff — NextNotePad | An online notepad for developers |
| `/security` | Privacy and Security: Where Your Notes Are Stored — NextNotePad | Privacy and security: where your notes are stored |
| `/keyboard-shortcuts` | Keyboard Shortcuts — NextNotePad | NextNotePad keyboard shortcuts |
| `/guides` | Guides: Saving, Organizing and Protecting Notes — NextNotePad | NextNotePad guides |
| `/guides/how-to-save-notes-online` | How to Save Notes Online Without Installing Anything — NextNotePad | How to save notes online without installing anything |
| `/guides/organize-notes-with-folders-and-workspaces` | How to Organize Notes with Folders and Workspaces — NextNotePad | How to organize notes with folders and workspaces |
| `/faq` | Frequently Asked Questions — NextNotePad | Frequently asked questions |

After 4–6 weeks of Search Console data, rewrite titles and descriptions of pages with high impressions and low
CTR, one page at a time, and record the change date to compare.

## 5. Internal linking

- **Global:** header (Features, Developers, vs Notepad++, Guides, FAQ, "Open notepad"); footer lists every
  registered page by section, generated from the registry, so new pages cannot be orphaned.
- **Contextual:** each page links to 2–4 related pages in the body with descriptive anchor text, plus a
  "Keep reading" block. Guides link to the feature or security page that backs their claims.
- **Hierarchy:** breadcrumbs (visible + `BreadcrumbList`) on every content page.
- **From the app:** Help menu → Features, Privacy & Security, FAQ. These help users but do not pass link equity
  from `/` (they are client-rendered); option B in §2 fixes that.
- **Guardrails:** `seo:audit` fails on broken internal links and warns on orphans.

## 6. Content calendar (proposed order)

Ranked by evidence in `keywords.csv` (cluster size, intent, autocomplete position) and by how directly the product
satisfies the intent. Re-rank after Search Console data arrives. One substantial page per week is sustainable;
each page goes through a fact check against `audit.md` §1 before publishing.

| Week | Page | Type | Notes |
|---|---|---|---|
| 1 | Homepage option B (if approved) | core | Largest single impact. |
| 2 | `/diff-checker` | tool landing | Working tool; links to `/developers`. |
| 3 | `/json-formatter` | tool landing | |
| 4 | `/markdown-editor` | tool landing | Preview exists in the app. |
| 5 | `/devices` (Mac, Chromebook, Linux, iPad, Android) | use case | One page; honest about mobile limits. |
| 6 | `/alternatives` (Google Keep, OneNote, Evernote, Simplenote) | comparison | Fair, sourced tables; state where each is better. |
| 7 | Guide: "Online notepad vs desktop text editor: which to use when" | guide | Informational cluster. |
| 8 | `/for/students` | use case | Only if the cluster has grown with more data. |
| 9 | Guide: "How to keep a private notes file (encryption explained)" | guide | Supports `/security`. |
| 10 | Privacy policy and terms | trust | Owner-written. |

Avoid an annual "Best free online notepads in 2026" listicle unless it is genuinely fair to competitors and
re-tested yearly; self-ranking listicles are a trust risk.

## 7. Competitor notes

Gathered on 2026-10-27 from web search results; re-check before relying on any detail. Sources are listed at
the end.

| Competitor type | Examples | Their angle | Our response |
|---|---|---|---|
| Exact-match notepad sites | onlinenotepad.org/.net/.io, justnotepad, notepad.is, onlynotepad | Single text box, autosave, word count, .txt download | Tabs, folders, real editor, Drive storage. **Gap to consider:** live word/character count and per-file .txt download are table stakes for them. |
| Sharing notepads | hypernotepad, anotepad, notepadonline.ai | Share via link, rich text | We do not share; do not target "share" queries (flagged in the CSV). |
| Notepad++ look-alikes | edtr.plus, jasperbernaers.com/notepad, notepadplusplus.in | Notepad++ feel in a browser; some offline, some with real file access | Our comparison page is honest; Drive multi-device storage is the differentiator. Self-hosting Monaco for real offline use would close their main advantage. |
| Big brands | Google Keep, OneNote, Evernote, Notion, VS Code (vscode.dev) | Ecosystems, mobile apps | Compete on "no account to start", plain files you own, editor features. |
| Aggregators | alternativeto.net (Notepad++ alternatives, online filter), thectoclub listicles | Rank for "alternative" queries | Get listed (see §8); these pages are where alternative-seekers look. |

Notable search-result pattern: titles lead with "Free", "No Sign-Up" and "Private". The homepage title and
description already state free, no install and no account; keep it that way.

## 8. Ethical authority and backlinks

Do: earn links by being useful. Do not: buy links, join link schemes or farms, post fake reviews, or automate
comments.

1. **Directories that fit:** AlternativeTo (submit as an alternative to Notepad++, Google Keep, Simplenote,
   with an accurate description and screenshots), Product Hunt launch, Chrome/Edge PWA directories, Slant.
2. **Developer communities:** a Show HN post or relevant subreddit post when there is something new (e.g., real
   offline mode, the diff tool), written by the maker, following each community's self-promotion rules.
3. **Open source:** if parts are open-sourced (e.g., the text tools library), the GitHub README links back.
4. **Useful resources others cite:** the keyboard-shortcut reference, a fair notepad comparison table that is kept
   current, a plain-language explainer of Google's `drive.file` permission.
5. **Unlinked mentions:** monitor brand mentions and ask for a link where the product is already discussed.
6. **Reviews:** if you want rating markup later, collect real first-party reviews in the product and mark up only
   those.

## 9. Search Console and analytics plan

Setup (needs owner access):

1. Verify a **Domain property** for `nextnotepad.com` in Google Search Console (DNS TXT record) and in Bing
   Webmaster Tools (it can import from GSC).
2. Submit `https://nextnotepad.com/sitemap.xml` and use URL Inspection → Request indexing for the 10 URLs.
3. Pick privacy-appropriate analytics. A cookieless tool (e.g., Plausible, Umami or Cloudflare Web Analytics) fits
   the product's privacy positioning and avoids a consent banner in most regions; it should never capture note
   content.
4. Define conversions: "opened editor from a content page", "created first note", "signed in with Google",
   "installed PWA".

Weekly (15 minutes): Pages report (new "not indexed" reasons), Performance by page (clicks, impressions, CTR,
position), queries containing new feature words (feed `keywords.csv`).

Monthly: export GSC queries into `docs/seo/data/volumes.csv`-style data (GSC gives impressions, not volume, so
record them as such), rebuild the dataset, re-rank the calendar, review Core Web Vitals, run
`npm run seo:audit -- https://nextnotepad.com`, update `lastReviewed` on pages whose facts were re-checked.

Dashboard: a Looker Studio report on the GSC connector (clicks/impressions/CTR/position by week and by page,
with a page-group filter matching the clusters) is enough; no custom build is needed.

## 10. Roadmap

| Phase | Status | Contents |
|---|---|---|
| 1. Foundation | **done on this branch** | Audit, spam removal, metadata, robots, sitemap, structured data, OG image, tests |
| 2. Keyword research | **done on this branch** (volumes pending) | Autocomplete dataset, clusters, mapping; merge Keyword Planner/GSC numbers when available |
| 3. Core pages | **partly done** | 9 content pages live on the branch; homepage option B awaits decision |
| 4. Content growth | next | Calendar in §6 |
| 5. Authority | next | §8 |
| 6. Measurement | after deploy | §9 |

## Sources (competitor research, 2026-10-27)

- [calmlywriter.com/online](https://www.calmlywriter.com/online/), [hypernotepad.com](https://hypernotepad.com/),
  [onlinenotepad.io](https://www.onlinenotepad.io/), [onlinenotepad.org](https://onlinenotepad.org/),
  [onlinenotepad.net](https://onlinenotepad.net/), [notepad.is](https://notepad.is/),
  [justnotepad.com](http://justnotepad.com/), [anotepad.com](https://anotepad.com/)
- [jasperbernaers.com/notepad](https://jasperbernaers.com/notepad/), [edtr.plus](https://edtr.plus/),
  [notepadplusplus.in](https://notepadplusplus.in/), [editpad.org](https://www.editpad.org/)
- [AlternativeTo: Notepad++ online alternatives](https://alternativeto.net/software/notepad-plus-plus/?platform=online),
  [thectoclub.com: best Notepad++ alternatives](https://thectoclub.com/tools/best-notepad-alternative/)
- [quillbot.com/notepad](https://quillbot.com/notepad), [notepadonline.ai](https://notepadonline.ai/),
  [nerdsnote.com](https://nerdsnote.com/), [onlynotepad.com](https://onlynotepad.com/),
  [zippyjot.com](https://www.zippyjot.com/), [freeonlinenotepad.com](https://freeonlinenotepad.com/)
