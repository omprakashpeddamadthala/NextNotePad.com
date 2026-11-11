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

| Part | What we use |
|---|---|
| Language | TypeScript |
| Framework | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| Editor | Monaco Editor |
| State | Zustand, TanStack React Query |
| Database | PostgreSQL via Prisma 7 — **accounts and admin config only** |
| User data | Google Drive API (signed in) / IndexedDB + localStorage (guest) |
| Auth | Google OAuth 2.0 + JWT session cookie (`jose`) |
| AI | Google Gemini (`@google/genai`) and Claude via AgentRouter |
| Hosting | Docker image built by GitHub Actions (`.github/workflows/ci-cd.yml`) and pushed to Docker Hub |

---

## 3. Pages and user flows

### Public (no login)
| Page | Purpose |
|---|---|
| `/` | The editor itself (Guest Mode if not signed in) |
| `/features`, `/faq`, `/security`, `/developers`, `/keyboard-shortcuts` | Info pages |
| `/notepad-plus-plus-alternative` | SEO landing page |
| `/guides`, `/guides/how-to-save-notes-online`, `/guides/organize-notes-with-folders-and-workspaces` | How-to guides |
| `sitemap.xml`, `robots.txt`, `manifest`, Open Graph image | SEO / PWA files |

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
- `AppConfig` — one row: Gemini / AgentRouter API keys and model names (falls back to env vars when empty).
- Old tables (`Workspace`, `Folder`, `File`, `SyncFailure`, `UserSettings`) still exist only for the one-time move to Drive. **Do not drop them** yet.

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

| Service | Used for | Keys (in `.env.local`) |
|---|---|---|
| Google Cloud (OAuth + Drive API) | Sign-in and storing user files | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| PostgreSQL | Accounts and admin config | `DATABASE_URL` |
| Google Gemini | AI text tools | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| AgentRouter (Claude) | Alternative AI provider | `AGENTROUTER_API_KEY`, `CLAUDE_MODEL` |
| Docker Hub + GitHub Actions | Build and publish | GitHub repo secrets |
| — | Session signing | `JWT_SECRET` |
| — | Admin account | `ADMIN_EMAIL` |

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

## 8. Current task — Codebase cleanup (approved and completed 2026-11-11)

**Goal:** Remove what isn't needed. The app must look and behave exactly the same. No API, database, auth, routing or UI changes.

### What the scan found (2026-11-11)
| Area | Result |
|---|---|
| Source files never imported | **0** — every file in `src/` and `scripts/` is used |
| Public assets (`public/`) | **0 unused** — all icons and `sw.js` are referenced |
| npm packages | **0 removable** — the ones with no direct import are loaded indirectly: `babel-plugin-react-compiler` (`reactCompiler: true` in `next.config.ts`), `@emnapi/*` (pinned to fix `npm ci`), `@types/*`, `react-dom` |
| Unused exported functions/constants in app code | **0** |
| TODO / FIXME / commented-out code | **0** |
| Unused UI sub-components in `src/components/ui/` | **~26** (e.g. `ContextMenuSub*`, `ContextMenuRadio*`, `SheetFooter`, `SelectGroup`, `InputGroupButton`, `DialogTrigger`) |
| Types/constants marked `export` but only used in their own file | **36** |
| Comment lines | **~2,100** in ~32,000 lines. Almost all explain *why* (security notes, "do not drop these tables" warnings) |

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
