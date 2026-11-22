# NextNotePad.com — Project Spec

_Last updated: 2026-11-11 · App version 0.1.7_

This is the blueprint Claude reads before doing anything. It describes the app **as it exists today**. Any new task adds a section under "Current task" and must be approved before code is written.

---

## 1. What the app does and who uses it

NextNotePad.com is a fast, Notepad++-style text editor that runs in the browser.

- **Guest users** — open the site and start writing straight away. No account. Everything is saved in their own browser.
- **Signed-in users** — sign in with Google. Their notes, folders and settings are saved as real files in **their own Google Drive**.
- **Admin** (the `ADMIN_EMAIL` account, plus anyone they promote) — manages users and the AI keys for the whole site.

Main features: Monaco editor (the VS Code editor), tabs and split view, file explorer with folders and multiple workspaces, search & replace, Quick Open, Command Palette, recycle bin, zip export/import, diff viewer, Markdown preview, text tools and code formatters, AI tools (grammar fix, Markdown conversion, prompt assistant), voice typing, file lock/encryption, app password lock, local folder copy of Drive notes, 9 themes, installable as an app (PWA), and public SEO content pages.

---

## 2. Tech stack

| Part      | What we use                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| Language  | TypeScript                                                                                    |
| Framework | Next.js 15 (App Router), React 19                                                             |
| Styling   | Tailwind CSS 4 + shadcn/ui (Radix)                                                            |
| Editor    | Monaco Editor                                                                                 |
| State     | Zustand, TanStack React Query                                                                 |
| Database  | PostgreSQL via Prisma 7 — **accounts and admin config only**                                  |
| User data | Google Drive API (signed in) / IndexedDB + localStorage (guest)                               |
| Auth      | Google OAuth 2.0 + JWT session cookie (`jose`)                                                |
| AI        | Google Gemini (`@google/genai`)                                                               |
| Hosting   | Docker image built by GitHub Actions (`.github/workflows/ci-cd.yml`) and pushed to Docker Hub |

---

## 3. Pages and user flows

### Public (no login)

| Page                                                                                                | Purpose                                         |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `/`                                                                                                 | The editor itself (Guest Mode if not signed in) |
| `/features`, `/faq`, `/security`, `/developers`, `/keyboard-shortcuts`                              | Info pages                                      |
| `/notepad-plus-plus-alternative`                                                                    | SEO landing page                                |
| `/guides`, `/guides/how-to-save-notes-online`, `/guides/organize-notes-with-folders-and-workspaces` | How-to guides                                   |
| `sitemap.xml`, `robots.txt`, `manifest`, Open Graph image                                           | SEO / PWA files                                 |

### Signed in

1. User clicks **Sign in with Google** → `/api/auth/google` → Google → `/api/auth/google/callback` → session cookie set.
2. On first sign-in, the guest workspace is copied into their Drive.
3. Files, folders, workspaces and settings now load from and save to Drive (`/api/files`, `/api/folders`, `/api/workspaces`, `/api/settings`).
4. Optional: app password lock (`/api/lock/*`), AI tools (`/api/ai/*`).

### Admin only

- Admin Panel inside the app: list / block / promote users (`/api/admin/users`), change AI keys and models (`/api/admin/ai-config`).

---

## 4. Data models and where data is stored

**PostgreSQL (Prisma)** — `prisma/schema.prisma`

- `User` — Google id, email, name, avatar, Google tokens (server only), `isAdmin`, `blocked`, password-lock settings.
- `AppConfig` — one row: Gemini API key and model name (falls back to env vars when empty).
- Nothing else. Workspaces, folders, files and settings live only in Google Drive.

**Google Drive** (signed-in users)

```
NextNotePad.com/
├── .appConfig.json     settings, recent files, favorites, active workspace
└── Workspaces/
    └── <Workspace>/
        ├── .workspace.json
        └── folders and files
```

**Browser** (guest users) — IndexedDB and localStorage.

---

## 5. Third-party services

| Service                          | Used for                       | Keys (in `.env.local`)                                            |
| -------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Google Cloud (OAuth + Drive API) | Sign-in and storing user files | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| PostgreSQL                       | Accounts and admin config      | `DATABASE_URL`                                                    |
| Google Gemini                    | AI text tools                  | `GEMINI_API_KEY`, `GEMINI_MODEL`                                  |
| Docker Hub + GitHub Actions      | Build and publish              | GitHub repo secrets                                               |
| —                                | Session signing                | `JWT_SECRET`                                                      |
| —                                | Admin account                  | `ADMIN_EMAIL`                                                     |

---

## 6. Differences from CLAUDE.md (needs your decision)

CLAUDE.md was written as a general template. These parts don't match this app:

1. **Supabase** — CLAUDE.md says Supabase. This app uses Prisma + Postgres + Google Drive. Supabase is **not** used.
2. **Vercel** — CLAUDE.md says Vercel. This app ships as a Docker image.
3. **Folders** — CLAUDE.md lists `/app`, `/app/(admin)`, `/app/interview/[token]`, `/supabase`. This app keeps code in `/src` (`src/app`, `src/components`, `src/lib`, `src/services`, `src/store`) and `/prisma`. There are no interview or candidate pages.
4. **Secrets** — `docker-compose.yml` contains a real-looking database password and server IP as default values. That breaks the "never put passwords in code" rule and should be moved out and the password changed.

---

## 7. What "done" looks like

For every task:

- `npm run build` passes with no TypeScript errors
- `npm run lint` passes
- Related unit tests pass (`npm run test:*`)
- `npm run dev` starts with no console errors
- Feature checked in the browser as a guest **and** signed in, happy path and error path
- Existing features still work

---

## 20. Current task — Remove the one-time database → Drive copy tool (approved and built 2026-11-22)

**What the user asked (2026-11-22):** "remove workspace table, do not store in db, store that info in Google Drive itself", then "remove the copy tool".

### What exists today
- Workspaces, folders, files and settings are **already** stored only in Google Drive. The new database (`144.24.155.218`) has just 2 tables: `User` and `AppConfig`. There is no workspace table in it.
- The only code that still reads workspace data from a database is the one-time copy tool `src/lib/drive/legacyMigration.ts`. It runs on every Drive request (from `src/lib/drive/session.ts`) and copies old `Workspace` / `Folder` / `File` / `UserSettings` rows into Drive if they exist.

### Planned changes
1. Delete `src/lib/drive/legacyMigration.ts`.
2. `src/lib/drive/session.ts` — remove the import and the `ensureLegacyMigrated(ds)` call.
3. `scripts/drive-test/run.ts` — remove the 4 "Legacy DB -> Drive migration" tests and their `seedLegacyUser` helper (they test the deleted code).
4. `prisma/schema.prisma` — replace the comment about the old tables with: the database holds only accounts and AppConfig; all workspace data lives in Google Drive.
5. This file, section 4 — remove the "Old tables … Do not drop them" line.

### Not changed
- No database tables are dropped, in the new or the old database.
- `migrations.legacyDatabase` in `appConfigService.ts` stays, so users' existing `.appConfig.json` files in Drive still load without errors.
- How workspaces are saved in Drive does not change.

### Risk (accepted by user)
Anyone whose notes are still only in the old database (`103.99.36.194`) and were never copied to Drive will no longer get them copied automatically.

### Done when
- Types, lint and build pass
- `npm run dev` starts; signed in, workspaces load, create and switch from Drive with no console errors
- No code mentions `legacyMigration` any more

---

## 19. Previous task — UI polish round 2 (approved and built 2026-11-21)

**What the user asked (2026-11-21):** "improve complete UI". This follows round 1 (section 14). Screens checked with real screenshots in dark and light mode, at desktop and phone width: editor, File menu, Settings, Command Palette, welcome screen, Features page.

### What the review found
1. **Welcome screen (no file open) — the weakest screen.** The 9 feature card titles are cut off ("Mona…", "Googl…", "V…") because the coloured labels sit on the same line. The cards are tall and mostly empty, the empty "Recent files" box takes up half the column, and each label uses a different bright colour.
2. **Settings.** The selected tab on the left is a solid blue block that is heavier than anything else in the app. Each setting sits in a box inside another box (double borders), which looks busy.
3. **Dev Toolkit panel.** Every tool icon has a different bright colour (amber, cyan, purple, green, pink…), so the panel looks like confetti.
4. The editor, menus, Command Palette and info pages look clean after round 1. No change is needed there.

### Planned changes
**A — Welcome screen** (`src/components/editor/EditorWelcome.tsx`)
- Feature cards: the title gets its own full line, so nothing is cut off. The label moves under it as small grey text, and the cards are shorter, with even height.
- "Recent files" with no files becomes a short one-line message instead of a big empty box.
- Labels use one calm style (grey, or brand blue for "Recommended"-type labels) instead of many colours.
- The same content is kept: no features, links or wording removed.

**B — Settings** (`SettingsDialog.tsx`, setting rows in `GeneralSettingsTab.tsx`, `EditorSettingsTab.tsx`, `SecuritySettingsTab.tsx`)
- Selected tab: a light blue tint with blue text, not a solid blue block.
- Settings inside a section become simple rows split by thin lines, with no box inside a box.
- No settings are added, removed or renamed.

**C — Dev Toolkit** (`src/components/layout/ToolsNavRail.tsx`)
- All tool icons use one muted colour that turns brand blue on hover or when active.

### Not changed
- The editor, menus, top bar, status bar, Command Palette, info pages and phone layout (already done in round 1)
- No features, settings, text or SEO changed

### Done when
- Types, lint and build pass
- Screenshots in dark and light mode: no cut-off titles on the welcome screen, Settings shows no box-in-box, and the Dev Toolkit icons are calm
- Every button on these screens still works; no console errors

---

## 18. Waiting — Show Gemini's real error instead of "invalid API key" (waiting for approval, 2026-11-21)

**What the user asked (2026-11-21):** "gemini ai integration not working, given correct key".

### What the check found
- The key saved in Admin → AI Config **is valid**: Google accepts it and lists the models (model setting `gemini-3.8-flash`).
- Every AI request (also `gemini-2.5-flash` and `gemini-2.5-flash-lite`) returns **403: "The Gemini API free tier is not available for this project. Please set up billing…"**. This is a Google account setting, not an app bug.
- The app makes this confusing: `geminiProvider.ts` turns every 401/403 into "Gemini rejected the request (invalid API key)", and `useMonacoAiActions.ts` turns every 503 into "AI … isn't configured on this server yet".

### Planned change
- `src/lib/ai/geminiProvider.ts`: 401 → "Gemini rejected the API key." For 403, show Google's own message (e.g. the billing message) and return status **403** instead of 503, so the browser shows it as-is.
- `src/hooks/useMonacoAiActions.ts`: for 403, show the server's message instead of the fixed "doesn't have access to its configured model" text.

### Not changed
- How Gemini is called, the model, the Admin screen

### Done when
- Types, lint and build pass
- With the current key, using an AI tool shows Google's billing message instead of "isn't configured"

---

## 17. Previous task — Installed app shows only the editor (approved and built 2026-11-21; installed-app check by user pending)

**What the user asked (2026-11-21):** "hide bottom page, only editor it should show". Chosen: **installed app only**.

### What exists today
`src/app/(app)/page.tsx` puts the editor on the first screen, and the page scrolls down to `HomeContent` (the SEO description) and `SiteFooter`.

### Planned change
In `src/app/(app)/page.tsx` only, use a CSS rule for **installed-app mode** (`@media (display-mode: standalone)`, the same check the app already uses elsewhere):
- hide `HomeContent` and `SiteFooter`
- stop the page from scrolling, so only the editor fills the window

It is CSS only and works from the first paint, so the text doesn't flash before it hides.

### Not changed
- The website in a normal browser tab still shows the text and footer below the editor, so Google still sees them
- No text, SEO tags or other pages change

### Done when
- Types, lint and build pass
- Normal browser tab: you can still scroll down to the text and footer
- Installed app: only the editor, no scrolling (checked by the user)

---

## 16. Previous task — Installed app opens filling the screen, taskbar stays visible (approved and built 2026-11-21; installed-app check by user pending)

**What the user asked (2026-11-21):** the installed app (PWA) should open full screen by default, but the Windows taskbar at the bottom must still show. Chosen option: **fill the screen, keep the taskbar and the app's title bar** (not F11-style full screen).

### What exists today
- `src/app/manifest.ts` already uses `display: "standalone"`, so the installed app opens in its own window without browser tabs or an address bar.
- The window size is whatever Chrome/Edge last remembered, which is often a small window. A web app can't ask Windows to "maximize". It can only resize its own window when it runs as an installed app.

### Planned changes
1. **New** `src/components/pwa/PwaWindowFit.tsx` (client component, renders nothing). When the app runs as an installed app on a desktop (`display-mode: standalone`, not a phone), it moves the window to the top-left and resizes it to `screen.availWidth × screen.availHeight`. That is the screen size **minus the Windows taskbar**, so the taskbar stays visible.
   - It runs **once per launch** (remembered in `sessionStorage`), so if the user resizes the window later, a page reload won't snap it back.
   - In a normal browser tab it does nothing.
2. Mount it next to the existing install button logic (`AppProviders`), one line.
3. `manifest.ts` stays `standalone`. `fullscreen` mode is **not** used, because it would hide the taskbar.

### Not changed
- The browser-tab version of the site, the phone app, the View → Full Screen (F11) menu item and Focus mode

### Done when
- Types, lint and build pass
- Installed app on Windows (Chrome or Edge) opens filling the screen with the taskbar visible, and a normal browser tab is unaffected. The installed-app check has to be done by the user, because I can't install the app from here.

---

## 15. Previous task — Keep Google Gemini as the only AI (approved and built 2026-11-21)

**What the user asked (2026-11-21):** "only one integration ai gemini remove remaining every where". Gemini stays. Claude (through AgentRouter) is removed from the code, menus, settings, database and docs.

### What exists today
- `src/lib/ai/claudeProvider.ts` is the code that calls AgentRouter. `aiTextRoute.ts` picks Gemini or Claude depending on a `provider` field the browser sends.
- Each of the three AI tools (Fix Grammar, Generate MD Syntax, Generate Prompt) has a **Gemini / Claude** choice in **Tools menu**, the **Dev Toolkit** panel and the **right-click menu**.
- The `aiProvider` setting (types + defaults) and the `providerOverride` parameter thread the choice through `aiText.ts` and `useMonacoAiActions.ts`.
- The database table `AppConfig` has two columns `agentRouterApiKey` and `claudeModel`. The environment variables are `AGENTROUTER_API_KEY` and `CLAUDE_MODEL`.
- The Admin AI Config screen is **already Gemini-only**, so it stays as it is.

### Planned changes
1. **Delete** `src/lib/ai/claudeProvider.ts`.
2. **AI route:** `aiTextRoute.ts` always uses Gemini. The `provider` field is removed from `aiTextRequestSchema`, and `agentRouterApiKey`/`claudeModel` are removed from `updateAiConfigSchema` and `appConfig.ts`.
3. **Browser side:** remove `AiProvider`, the `aiProvider` setting and `providerOverride` (`types/settings.ts`, `defaultSettings.ts`, `aiText.ts`, `useMonacoAiActions.ts`). Old saved settings that still contain `aiProvider` are simply ignored.
4. **Menus:** each AI tool becomes **one plain item** with no Gemini/Claude sub-choice, in the Tools menu, Dev Toolkit and right-click menu. The menus call the plain action ids (`tools.ai.fixGrammar`, `tools.ai.generateMdSyntax`, `tools.ai.generatePrompt`) that the command palette already uses. Both the `.gemini` and the `.claude` variants are removed. The `.claude` actions are removed.
5. **Database:** remove the two columns from `prisma/schema.prisma` and add a new migration that drops `agentRouterApiKey` and `claudeModel` from `AppConfig`. This deletes any AgentRouter key stored there.
6. **Config & docs:** remove `AGENTROUTER_API_KEY` / `CLAUDE_MODEL` from `.env.example` and `.env.local`, and remove Claude mentions from `README.md`, `/features`, `/security` and this spec (sections 2 and 5).

### Not changed
- Gemini behaviour, the Admin AI Config screen, voice typing, the AI tool names and what they do
- Nothing else in the UI

### Done when
- No `claude` / `agentrouter` left in `src`, `prisma/schema.prisma`, `.env.example` or `README.md` (except the old, already-applied migration file, which must not be edited)
- `npx tsc`, `npm run lint`, `next build` pass
- Browser: each AI tool shows one item in all three menus. With no Gemini key it shows the clear "isn't configured" error, and with a key it works.

---

## 14. Previous task — UI polish across the whole app (approved and built 2026-11-21; light mode, dialogs and real-phone check pending)

**What the user asked (2026-11-21):** "improve UI". Chosen: **polish the current look** (same layouts, nothing moved or removed) on the desktop editor, dialogs & settings, public info pages and the phone view.

### What the review found
1. **Rainbow gradients everywhere.** They're on the top-bar line, the "Next" logo text, the active tab and rail bars (which keep animating), the Sign in button, the loading bar and a shimmer on the status bar. CLAUDE.md says no generic gradients.
2. **Endless animations.** The Guest dot, the Settings "status" dot and the tab/rail bars pulse forever, which pulls your eye away from your writing.
3. **Text too small and too many sizes.** There are 16 different hand-picked sizes from 4px to 22px; 50+ places use 9–10px.
4. **Two different looks.** Info pages use slate/indigo and are light-only. The editor uses blue #3574f0 with amber, so the brand feels inconsistent.
5. **Dialogs don't match.** Each dialog has its own corners, padding, header and button row.

### Planned changes
**Phase A — Design basics (affects everything)** — `src/app/globals.css`
- Replace all the rainbow gradients with one solid brand blue (`--primary`). The top bar gets a plain 1px border. The active tab and rail bar become a still 2px blue line, and the Sign in button turns solid blue.
- Stop the endless animations. The dots stay but no longer pulse. Hover, open and close movements stay short (150–200ms) and respect "reduce motion".
- Add one small text-size scale (11 / 12 / 13 / 14px; 10px only for keyboard hints) and use it instead of the hand-picked sizes.

**Phase B — Desktop editor** — `MenuBar`, `EditorTabs`/`TabItem`, `StatusBar`, `FileExplorer`/`TreeNode`, `ToolsNavRail`, `EditorWelcome`
- Line up heights and gaps in the top bar. Tidy up the menu group, search box and right-side buttons.
- Tabs: clearer active tab, calmer inactive tabs, smoother close button.
- Status bar: solid colour, even spacing, easier-to-read text.
- File explorer: consistent row height, hover and selected states, and indent guides.

**Phase C — Dialogs & settings** — `components/ui/dialog.tsx`, `SettingsDialog`, settings tabs, `components/dialogs/*`
- One shared look: the same corners, padding, title + description header and button row at the bottom, with a soft fade/scale when opening.
- Settings: cleaner side menu, section headings and line-up of rows. No settings are added or removed.

**Phase D — Public info pages** — `SiteHeader`, `SiteFooter`, `ContentPage`, `HomeContent`, `(site)` pages
- Use the app's colours and fonts instead of slate/indigo.
- The header stays at the top while scrolling (slightly see-through) and highlights the current page.
- Better spacing and text styling for reading, plus nicer tables, code and keyboard keys. **No page wording, titles or SEO tags change.**

**Phase E — Phone view** — `MobileAppBar`, `MobileBottomBar`, `MobileMenuSheet`, `MobileReadView`
- Every button is at least 44px tall so it's easy to tap. Spacing matches the new scale, and the safe-area padding (around the notch and home bar) is checked.

### Not changed
- No features, menus, shortcuts, settings, text content or SEO metadata are added or removed
- Monaco editor themes and the 9 colour themes keep working; only the app frame around them changes
- No new libraries

### Done when (each phase)
- `npm run build` and `npm run lint` pass
- Browser check in light and dark mode, desktop and phone width, as guest; no console errors
- Before/after check that every button and menu still works

---

## 13c. Previous task — Tree header on one line (approved and built 2026-11-19)

**What the user asked (2026-11-19):** the tree's top bar uses two lines; put Keys, Values and Only matches beside the search box so it all fits on **one line**.

### Change
One row, left to right: **JSON TREE label · search box · match count · up/down · Keys · Values · Only matches · Expand all · Collapse all · 1 2 3 · X**.
- The search box shrinks first when space is tight.
- In the narrow side-by-side view, the "JSON TREE" label hides when there isn't room, and if the row still doesn't fit it scrolls sideways instead of breaking into two lines.

### Files touched
`src/components/editor/TreeViewPanel.tsx` (header only)

### Done when
- Types, lint, build pass
- Browser: header is one line in full-tab and side-by-side views; all buttons still work; no console errors

---

## 13b. Previous task — Edit and Side by side buttons for JSON/XML/YAML (approved and built 2026-11-19)

**What the user asked (2026-11-19):** add an **Edit** button and a **Side by side** button for JSON-format notes, placed beside the Tree View and Copy buttons in the tab bar.

### Change
Toolbar order on JSON/XML/YAML notes: **Edit · Tree View · Side by side · Copy**.
1. **Edit** (pencil icon) — only shown while the tree fills the tab. Closes the tree and goes back to the text so you can type.
2. **Side by side** (two-columns icon) — shows the text on the left and the tree on the right, with a draggable divider (the layout from before 13a). Click again to go back to text only. Clicking **Tree View** while side by side switches to the full-tab tree.
   - In side by side, clicking a tree row jumps the text to that line, and "Show in text" keeps the tree open (the text is visible).
   - Hidden on phones (screen too narrow); phones keep the full-screen tree.
3. **Alt+T** opens/closes the tree in whichever layout was used last. The layout choice is remembered between visits.

### Files touched
`src/store/uiStore.ts` (one new saved setting: tree layout "full" or "side"), `src/components/editor/EditorArea.tsx`, `src/components/editor/EditorTabs.tsx`, `src/components/editor/TreeViewPanel.tsx`

### Not changed
Copy button, parsing, search, expand/collapse, phone layout.

### Done when
- Types, lint, tree-view tests and build pass
- Browser: Edit returns to text; Side by side shows both with a divider and row clicks jump the text; Tree switches side-by-side to full; Alt+T reopens the last layout; no console errors

---

## 13a. Current task — Tree view in the same tab + Copy button (approved and built 2026-11-19)

**What the user asked (2026-11-19):** clicking the JSON tree view button should open the tree **in the same tab**, not side by side. Add a **Copy** button beside the tree view button.

### Change
1. **Same tab, not side by side (desktop).** Clicking the Tree View button (or Alt+T) makes the tree fill the note's tab, covering the text, exactly like phones already do. Clicking the button again (or the X in the tree) goes back to the text. The side-by-side panel is removed.
   - The text editor stays loaded underneath, so edits and undo are kept.
   - Clicking a row selects it (and opens/closes folders), the same as on phones. "Show in text" in a row's menu (or Enter) closes the tree and jumps to that line.
2. **Copy button** beside the Tree View button in the editor toolbar, shown on the same notes (JSON/XML/YAML). It copies the **whole note's text** and shows "Note copied". Uses the existing `copyNote` helper.

### Files touched
`src/components/editor/EditorArea.tsx`, `src/components/editor/EditorTabs.tsx`, `src/components/editor/TreeViewPanel.tsx`

### Not changed
Parsing, search, expand/collapse, paths, errors, big-file handling, phone layout.

### Done when
- Types, lint, tree-view tests and build pass
- Browser: Tree opens in the same tab with no side panel; closing it returns to the text with edits kept; "Show in text" jumps to the line; Copy puts the whole note on the clipboard; no console errors

---

## 13. Previous task — Tree view for JSON, XML and YAML (approved and built 2026-11-19)

**Change from the plan:** XML uses a small reader in `src/services/treeView/parseXml.ts` instead of the browser's `DOMParser`, because `DOMParser` drops line numbers (needed for "click a row to jump") and can't run in the unit tests. Phones open the tree with a tap-to-expand list; "Show in text" in each row's menu jumps to the line.

**Goal:** Open a JSON, XML or YAML note and see it as a collapsible tree next to the text, with a search that finds keys and values.

### What exists today
Format/minify JSON and XML, and a Markdown preview panel beside the editor. No tree view. No JSON/YAML parser that remembers line numbers.

### How it works for the user
- **Open it:** a "Tree" button in the editor toolbar (only on JSON/XML/YAML notes), View → Tree View, Command Palette, or **`Alt+T`** (a free shortcut). Phone: "Tree view" in the More menu, shown full screen (like Read view).
- **Layout:** the tree sits to the right of the editor, like the Markdown preview, with a draggable divider. It **updates live** as you type (after a short pause).
- **Each row shows:** key name, value coloured by type (text, number, true/false, null), and size for objects/arrays (`{3}`, `[12]`). XML shows element names, `@attributes` and text.
- **Expand / collapse:** click the arrow on any row; toolbar buttons **Expand all**, **Collapse all**, and **Expand to level 1 / 2 / 3**. Keyboard: arrow keys move and open/close, like a file tree.
- **Search:** one search box with **Keys / Values** toggles (both on by default), case-insensitive. Matches are highlighted, their parents open automatically, "3 of 17" counter with **previous / next** buttons (Enter / Shift+Enter), and a **"Only matches"** switch that hides everything else.
- **Jump to text:** clicking a row moves the editor cursor to that line (JSON and YAML; XML jumps to the element's line).
- **Copy:** each row has a small menu: **Copy value**, **Copy key**, **Copy path** (`$.users[0].name` for JSON/YAML, `/catalog/book[2]/title` for XML).
- **Broken files:** if the text has a syntax error, the tree shows the error with its line and column, and keeps the last good tree greyed out until it's fixed.
- **Big files:** only the visible rows are drawn (the same virtual list the explorer uses), so files with tens of thousands of entries stay smooth. Files over 10 MB show a warning instead of a tree.

### Technical plan
- **Parsers (loaded only when the tree opens):**
  - JSON: `jsonc-parser` (Microsoft, MIT, ~20 KB) — gives line positions and allows comments/trailing commas.
  - YAML: `yaml` (ISC, ~100 KB) — gives positions.
  - XML: the browser's built-in `DOMParser` (no new dependency), with line numbers found by a small scan of the source.
- **Pure, tested service** `src/services/treeView/`: parse → one common tree shape (`{ key, type, value, children, line, path }`), search, path building. Unit tests in `npm run test:tree-view`.
- **UI:** `src/components/editor/TreeViewPanel.tsx` (+ one small row component), shown by `EditorArea.tsx` like the Markdown preview; `uiStore` gets a `treeViewVisible` flag (saved between visits).
- Read-only: the tree never changes the note.

### Not changed
Editor, formatters, Markdown preview, APIs, database, sign-in.

### New dependencies
`jsonc-parser`, `yaml` (both lazy-loaded).

### Done when
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, all `npm run test:*` pass (including new tree-view tests: parsing, positions, paths, search, XML attributes, errors)
- Browser at desktop and phone size: open sample JSON, XML and YAML files; expand/collapse all and per level; search keys and values with prev/next and "only matches"; click a row jumps to the line; copy value/key/path; break the syntax and see the error; a 5 MB JSON stays responsive; no console errors

---

## 12. Previous task — 8 new features (approved 2026-11-19, built and tested; real Drive sign-in test pending)

**Changes from the plan made while building:**
- Spell check: `dictionary-en` only works in Node, so its two files (and licence) are copied to `public/dictionaries/en-US/` instead of adding it as a dependency. Only `nspell` (+ `@types/nspell`) was added.
- Offline: Monaco is copied from `node_modules/monaco-editor/min/vs` to `public/monaco/<version>/vs` by `scripts/copy-monaco.mjs` (runs before dev and build; git-ignored) and loaded with `loader.config({ paths })`. This moves the editor from the CDN's 0.55.1 to the installed 0.56.0.
- Version history "Compare with current" uses Monaco's diff editor inside the history window (the existing diff view only compares two open tabs).
- `Ctrl+Shift+Enter` (focus mode) replaces Monaco's "insert line above" on that key.

**Goal:** Close the main gaps found in a full code review (2026-11-19). The user picked all 8. Built in 4 phases, smallest and safest first; each phase is tested before the next starts.

### What the review found already exists (not rebuilt)
Tabs, split view, folders, workspaces, recycle bin, favorites, recent files, daily notes, ~50 text tools, AI tools, diff checker, Markdown preview + print, 9 themes, encodings, per-note encryption, app lock, voice typing, ZIP export/import, open local file (Ctrl+O), Save As (= duplicate), Drive sync, local folder copy, PWA install, mobile UI.

### Phase 1 — Quick wins
1. **Download note** — new "Download" item (File menu, mobile "More" sheet, Command Palette, note tab right-click). Saves the open note to the computer as a file with its own name and extension (`.txt`, `.md`, `.json`…), in its encoding. Locked notes must be unlocked first. Works for guests and signed-in users. Does not change Save As.
2. **Live word count** — the bottom bar shows `123 words · 640 chars` for the open note; with text selected it shows the selection's count. Counted with the existing `textTools` word-count logic, debounced so large files don't slow typing. On phones it appears in the Read view header (the phone bottom bar has no room).
3. **Focus mode** — `Ctrl+Shift+Enter` (also in View menu, palette and phone "More" sheet) hides the menu bar, sidebar, tabs, tools rail and status bar, and centres the text in a comfortable reading width. A small "Exit focus" button fades in on mouse move; `Esc` or the same shortcut exits. Not saved between visits.
4. **Print any note** — "Print…" in the File menu and palette for every note. Plain text prints in a clean monospace layout with the note name as a header; Markdown keeps its existing rendered print. Uses the browser print dialog, so "Save as PDF" works too.

### Phase 2 — Templates and spell check
5. **Note templates** — "New from template…" (File menu, explorer "+" menu, palette, phone bottom-bar "New note" long-press → sheet). Built-in: Meeting notes, To-do list, Daily journal, Bug report, Project plan, Blank Markdown. `{{date}}` and `{{time}}` are filled in. "Save current note as template" stores your own templates in Settings (so they sync to Drive for signed-in users, localStorage for guests). Manage/delete them in Settings → General.
6. **Spell check** — the Monaco editor blocks the browser's built-in spell checker, so this adds the `nspell` library with an English (US) dictionary (~550 KB, **downloaded only when spell check is turned on**, then cached). Misspelled words get a wavy underline in plain-text and Markdown notes only (never code). Right-click a word → suggestions, "Add to dictionary" (saved in Settings), "Ignore". Setting: Settings → Editor → Spell check (off by default). English only for now.

### Phase 3 — Version history (signed-in users)
7. **Version history** — Google Drive already keeps earlier versions of each file (about 30 days / up to 100 versions per file; Drive decides which to keep). The `drive.file` permission we already have allows reading them for files the app created, so **no new Google permission**.
   - New API routes (thin, logic in `src/lib/drive/driveService.ts`):
     - `GET /api/files/[id]/revisions` → list of versions (date, size)
     - `GET /api/files/[id]/revisions/[revisionId]` → that version's text
   - "Version history…" in the File menu, tab right-click and phone "More" sheet opens a panel: list of versions on the left, preview on the right, a "Compare with current" button (uses the existing diff view) and "Restore this version". Restoring saves the old text as a **new** version, so nothing is lost.
   - Guests see "Sign in to keep version history". Locked (encrypted) notes show versions but need the passphrase to preview.

### Phase 4 — Real offline mode (structural change)
8. **Offline mode** — today the editor (Monaco, ~3 MB) is downloaded from a CDN (cdn.jsdelivr.net) on every visit, so the app can't open with no internet.
   - Load Monaco from the app's own files instead of the CDN (`loader.config({ monaco })` with the already-installed `monaco-editor` package, plus its web-worker setup in `next.config.ts`). This also stops sending a request to a third-party CDN.
   - Upgrade `public/sw.js` to cache the app's code files (`/_next/static/*`) and the editor after the first visit, and to serve them when offline. Content pages and API calls are not cached.
   - Guests: fully usable offline after one online visit. Signed-in: opens offline with the files already cached in the browser; changes sync when back online (existing offline badge + `SyncOfflineFilesDialog`).
   - Update the "Does it work offline?" answers on the site (`/faq`, homepage FAQ, `audit.md`) to match.
   - **Why it's structural:** it changes how the editor is loaded and the build config. Risk: a slightly larger first download and a service worker that must update cleanly; I'll test install → offline → back online → new deploy.

### Not changed
Database, sign-in, existing APIs (only 2 new read-only routes), existing features' behaviour.

### New dependencies
- `nspell` + `dictionary-en` (Phase 2, lazy-loaded). No others.

### Done when (each phase)
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, all `npm run test:*` pass; new unit tests for word counting, template placeholders and spell-check word filtering
- Browser check at desktop (1440px) and phone (390px), guest and signed-in: happy path + error path (e.g. download a locked note, Drive revisions request fails, offline reload), no console errors
- Phase 3 needs **you** to sign in for the real Drive test; Phase 4 tested with the browser's "Offline" switch

---

## 11. Previous task — "Loading your files from Google Drive" screen (approved 2026-11-19, built; real sign-in test pending)

**Goal:** When a signed-in user opens the app, they should never see Welcome.txt, guest notes, or an empty file list while their Drive is loading. Instead they see a clean, animated loading screen until their real files are ready.

### Why it happens today
| Cause | Where |
|---|---|
| The browser keeps the guest's notes and open tabs (`np-workspace`, `np-tabs` in localStorage) and **always loads them on startup**, even for signed-in users. They're needed only once, to copy guest notes to Drive on first sign-in. | `guestOnlyLocalStorage` in `src/services/storage/localStorageService.ts` |
| For the first moment the app doesn't know whether you're signed in (`status: "loading"`), so it shows the normal screen. | `src/store/authStore.ts` |
| While Drive loads, only the editor area and file tree show a grey placeholder. The **tab bar, workspace name, menus and status bar still show the leftover guest data** (e.g. a "Welcome.txt" tab, "Guest workspace", "1 file"). | `EditorArea.tsx`, `AppShell.tsx` |

### Planned changes
1. **Remember "this browser is signed in".** Save a small flag (`np-signed-in`, just "1", no personal data) when sign-in is confirmed. Remove it when the app finds you are a guest (e.g. after sign-out or an expired session). This lets the app know straight away, before the server answers, that it should show the Drive loading screen.
2. **New `DriveLoadingScreen` component** — covers the whole app (desktop and phone) while a signed-in user's workspace loads:
   - App logo with a soft pulsing ring, a small Google Drive icon, and a thin animated progress bar
   - Text: "Loading your files from Google Drive" and a smaller line "This only takes a moment"
   - Fades out smoothly when the files are ready. Calm motion only, and it respects the "reduce motion" setting.
   - Shown when: (signed-in flag is set **and** the sign-in check is still running) **or** (signed in **and** the workspace is not ready yet).
3. The guest data is still loaded quietly in the background (so the first-sign-in copy to Drive keeps working), just never shown to a signed-in user.

### Not changed
- Guests: same as today (Welcome.txt on first visit).
- How files are fetched from Drive, the APIs, the database, sign-in, the lock screen.
- If Drive fails to load, the existing error message shows and the loading screen goes away (no endless spinner).

### Files likely touched
- `src/store/authStore.ts` (set/clear the flag)
- New: `src/components/layout/DriveLoadingScreen.tsx`
- `src/components/layout/AppShell.tsx` (render the loading screen)

### Done when
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, existing `npm run test:*` pass
- Guest in a fresh browser: Welcome.txt appears as before, no loading screen
- Signed in (desktop and phone size): refresh → loading screen appears straight away, no Welcome.txt / guest tab / empty list ever flashes, then the real Drive files appear
- Sign out → next load behaves as guest, no loading screen
- No console errors

---

## 10. Previous task — SEO: rank for "best online notepad" (approved 2026-11-19)

**Goal:** Give Google the best possible reasons to show NextNotePad for searches like "best online notepad", "free online notepad" and "online notepad". **Nobody can guarantee position #1.** Google also weighs links from other sites, site age and how users react, and code can't control those. This task fixes what _is_ in our control.

### What the check found (2026-11-19, live site)

| Area                                                                   | Status                                                                                                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title, description, robots.txt, sitemap.xml, structured data, OG image | Good — done in PR #51                                                                                                                                                      |
| 9 content pages (features, FAQ, guides…)                               | Live                                                                                                                                                                       |
| **Home page text**                                                     | **Only ~63 words visible to Google.** `/` is just the editor. This is the most important URL and the biggest gap (`docs/seo/strategy.md` §2, "option B", still undecided). |
| Links from `/` to content pages                                        | Only inside the client-side Help menu, so Google can't follow them                                                                                                         |
| Page answering "which online notepad is best?"                         | None                                                                                                                                                                       |
| Word count + one-click `.txt` download                                 | Most competitors show these on the page. Need to check what we already have before adding anything.                                                                        |

### Planned changes (code)

1. **Home page content below the editor (option B).** The editor stays exactly where it is on first screen. Scroll down to reach a real, server-rendered section (~600–900 words): what NextNotePad is, why it's a strong choice for an online notepad, how saving works (browser vs your own Google Drive), key features, a short FAQ (with `FAQPage` structured data), and plain links to the content pages. Requires the app shell to stop locking page scrolling on `/`. On phones, the content sits below the editor too.
2. **New page `/best-online-notepad`** — "How to choose an online notepad" with a fair comparison table (NextNotePad vs onlinenotepad.org, anotepad, Google Keep, Notepad++/editpad-style sites). Rows: no sign-up, where notes are stored, tabs/folders, offline, encryption, price. It shows where competitors do better too (honest pages rank and get linked; fake "#1" claims get penalised). Registered in `src/lib/seo/site.ts` so the sitemap, footer and SEO tests pick it up.
3. **Title tweak** on `/` to lead with the main phrase, e.g. `Free Online Notepad — No Sign-Up, Saves to Google Drive | NextNotePad` (≤ 70 chars, checked by existing tests).

### Owner tasks (not code — I'll give step-by-step help)

- Google Search Console: verify the domain, submit `sitemap.xml`, request indexing of `/` and the new page.
- List the site on AlternativeTo, Product Hunt, Slant (earned links matter a lot for "best" searches).

### Not changed

- The editor itself, APIs, database, auth, Drive storage. No hidden text, keyword stuffing or fake reviews.

### Files likely touched

- `src/app/(app)/page.tsx` or `layout.tsx`, `src/components/layout/AppShell.tsx` (scroll on `/`)
- New: `src/components/site/HomeContent.tsx`, `src/app/(site)/best-online-notepad/page.tsx`
- `src/lib/seo/site.ts`, `src/lib/seo/jsonLd.ts`, `src/lib/seo/seo.test.ts`

### Done when

- `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:seo` pass
- `npm run seo:audit -- http://localhost:3000` passes with no broken links
- `/` with JavaScript off shows the full text section; with JavaScript on, the editor works as before at desktop and phone sizes, and the text is reachable by scrolling
- `/best-online-notepad` renders, appears in `sitemap.xml` and the footer, and has no console errors

---

## 9. Previous task — Mobile UI/UX upgrade (approved 2026-11-18, merged in #53)

**Goal:** On phones (screens under 768px wide) the app should feel like a polished native notes app: every option easy to find, quick workspace switching, quick file search, a clean reading view, and easy text selection and copy. **Desktop layout is not changed.**

### What's wrong today

| Area              | Problem                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Workspaces        | There is **no workspace switcher on phones** — it only exists in the desktop sidebar.                                          |
| Search            | Quick Open (find a file) is buried inside the Search menu.                                                                     |
| Menu              | The "Menu" sheet is a 3×3 grid of desktop dropdown menus (File, Edit, Encoding…). Hard to tap, options hidden two levels deep. |
| Reading / copying | Notes open in the code editor. Selecting text with a finger is fiddly and there is no Copy button.                             |
| Top bar           | Two similar icons (explorer + menu) on the left; title says "Editing locally" even for Drive files.                            |

### Planned changes (phones only)

1. **New top bar** — left: Files button. Middle: note name + workspace name (tap to switch workspace). Right: Search button and a "More" button.
2. **Bottom action bar** (thumb-friendly) — 4 large buttons: **Files**, **Search**, **New note**, **Copy all**. Sits above the phone's home bar.
3. **Workspace switcher sheet** — a bottom sheet listing all workspaces with a check mark on the active one, one tap to switch, plus "New workspace". Uses the existing workspace store/actions, no new API.
4. **Search** — the Search button opens the existing Quick Open dialog full-screen on phones, with a larger input that is focused immediately and larger result rows.
5. **Files drawer** — the existing explorer drawer gets the workspace switcher at the top and bigger touch targets for New file / New folder.
6. **Read / Edit toggle** — a button on the top bar switches the open note between:
   - **Edit** (the current editor), and
   - **Read** — clean, wrapped text in a readable font where you can long-press to select any text normally (Markdown files show the existing Markdown preview).
7. **Copy** — "Copy all" copies the whole note; in the editor, when text is selected, a small floating **Copy** button appears. A short "Copied" toast confirms it.
8. **"More" sheet redesign** — replace the 3×3 dropdown grid with a clean, grouped list of large rows with icons and labels:
   - _Note:_ Rename, Save/Download, Lock, Find & Replace, Word wrap, Markdown preview
   - _Workspace:_ Switch, Export/Import, Recycle Bin, Stats
   - _App:_ Settings, Command Palette, Install app, Account / Sign in, About
     Each row calls an action that already exists (registered actions / dialog store).

### Files likely touched

- `src/components/layout/AppShell.tsx`, `MobileAppBar.tsx`, `MobileMenuSheet.tsx`
- New (one component per file): `MobileBottomBar.tsx`, `MobileWorkspaceSheet.tsx`, `MobileReadView.tsx`, `MobileCopyButton.tsx`
- `src/components/explorer/FileExplorer.tsx`, `src/components/search/QuickOpenDialog.tsx` (mobile styles only)
- `src/store/uiStore.ts` (add "workspace sheet open" and "read mode" flags)

### Not changed

- Desktop layout, APIs, database, auth, Drive storage.

### Done when

- `npx tsc --noEmit`, `npm run lint`, `npm run build` pass; existing `npm run test:*` pass
- In the browser at phone size (390×844), as guest: switch workspace, search and open a file, create a note, toggle Read/Edit, select and copy text, copy all, open every "More" item — no console errors
- Desktop (1440px) looks and works exactly as before

---

## 8. Previous task — Codebase cleanup (approved and completed 2026-11-11)

**Goal:** Remove what isn't needed. The app must look and behave exactly the same. No API, database, auth, routing or UI changes.

### What the scan found (2026-11-11)

| Area                                                            | Result                                                                                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source files never imported                                     | **0** — every file in `src/` and `scripts/` is used                                                                                                                                                              |
| Public assets (`public/`)                                       | **0 unused** — all icons and `sw.js` are referenced                                                                                                                                                              |
| npm packages                                                    | **0 removable** — the ones with no direct import are loaded indirectly: `babel-plugin-react-compiler` (`reactCompiler: true` in `next.config.ts`), `@emnapi/*` (pinned to fix `npm ci`), `@types/*`, `react-dom` |
| Unused exported functions/constants in app code                 | **0**                                                                                                                                                                                                            |
| TODO / FIXME / commented-out code                               | **0**                                                                                                                                                                                                            |
| Unused UI sub-components in `src/components/ui/`                | **~26** (e.g. `ContextMenuSub*`, `ContextMenuRadio*`, `SheetFooter`, `SelectGroup`, `InputGroupButton`, `DialogTrigger`)                                                                                         |
| Types/constants marked `export` but only used in their own file | **36**                                                                                                                                                                                                           |
| Comment lines                                                   | **~2,100** in ~32,000 lines. Almost all explain _why_ (security notes, "do not drop these tables" warnings)                                                                                                      |

### Planned changes

1. Delete the ~26 unused UI sub-components (each checked again with a search before deleting).
2. Remove the needless `export` keyword from the 36 local-only types/constants.
3. Delete `skills-lock.json` — it's a lock file for AI-assistant skills, not used by the app.
4. Remove the `AGENTS.md` mention from `README.md` (that file is already deleted).
5. Comments: remove only comments that just repeat what the code says. Keep comments that explain why something is done, warnings, and security notes.

### Not touched

- `docs/seo/` and `scripts/seo/` — used by `npm run seo:audit`.
- `prisma/migrations/` — the database history; deleting it breaks deploys.
- `.claude/worktrees/` and `.kilo/worktrees/` — separate copies of the project that may hold unsaved work.
- `docker-compose.yml` password — separate security fix, not part of cleanup.

### Done when

- `npx tsc --noEmit`, `npm run lint`, `npm run format:check` pass
- All `npm run test:*` unit tests pass (text-tools, lock, local-mirror, dictation, seo)
- `npm run build` passes
- `npm run dev` starts and the editor, explorer, menus, settings dialog and command palette open with no console errors
