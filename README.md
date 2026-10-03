# NextNotePad.com

A fast, modern browser-based text editor built with Next.js. It runs entirely client-side out of the box (offline-first "Guest Mode"), with an optional Google account sign-in that stores your workspaces, files and settings directly in your own Google Drive.

The UI deliberately avoids the "modern SaaS code editor" look — square corners, flat instant menus, a classic segmented status bar, and Notepad++'s color themes — instead of the rounded/animated defaults you'd get from shadcn/VS Code out of the box.

## Features

- **Guest Mode (offline-first, no account needed)** — full file explorer, tabs, and editing entirely in the browser (IndexedDB/localStorage). Nothing leaves your machine unless you sign in.
- **Monaco-powered editor** — the same editor that powers VS Code, loaded via `@monaco-editor/react`, with syntax highlighting, minimap (off by default), and language-aware formatting for JSON, XML, HTML, CSS, JS/TS.
- **9 built-in themes**, including an authentic **Notepad++** theme plus Notepad Light/Dark, Dracula, Monokai, Nord, One Dark, Solarized, and VS Code.
- **File explorer & tabs** — nested folders, drag/drop-friendly tree, multi-tab editing.
- **Global search & replace**, Quick Open, and a Command Palette (`cmdk`).
- **Recycle bin** — soft-deleted files/folders can be restored.
- **Export/import** — zip a workspace up or restore from one (`jszip`, `file-saver`).
- **Workspace stats**, responsive layout for mobile/tablet, resizable panels.
- **Google Sign-In** — JWT-based session (`jose`). The database holds only account identity (`User`: Google id, email, OAuth tokens, admin/blocked flags) plus the deployment-wide `AppConfig`. On first login your local guest workspace is imported into your Drive automatically.
- **Google Drive is the source of truth** — every workspace is a real folder under `NextNotePad.com/Workspaces/` in your Drive (with a `.workspace.json`), files and folders are real Drive items (language/encoding/hidden/lock metadata in Drive `appProperties`), and theme, editor settings, recent files, favorites and the active workspace live in `NextNotePad.com/.appConfig.json`. Content is fetched lazily when a file is opened; saves go straight to Drive, with a toolbar badge for Saving / Offline / Sync failed. Existing database-backed accounts are copied to Drive once, idempotently, on their next request (`src/lib/drive/legacyMigration.ts`).
- **PWA-ready** — installable manifest + service worker (`public/sw.js`).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (`radix-ui`), `next-themes` |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| State | Zustand, TanStack React Query, TanStack React Virtual |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL via Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) |
| Auth | Google OAuth 2.0 (`googleapis`) + JWT sessions (`jose`) |
| Cloud sync | Google Drive API |
| Import/export | JSZip, FileSaver, DOMPurify, `marked` (Markdown) |

> ⚠️ This project pins **Next.js 15 / Prisma 7**, both recent major versions with breaking changes from their older, more widely-known APIs. See `AGENTS.md` — before making changes, read the matching guide under `node_modules/next/dist/docs/`.

## Getting started

### Prerequisites

- Node.js 22.12+
- npm
- PostgreSQL

### 1. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://nextnotepad:nextnotepad@localhost:5432/nextnotepad?schema=public`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). Only required for sign-in/cloud sync — Guest Mode works without them. |
| `GOOGLE_REDIRECT_URI` | Must exactly match an "Authorized redirect URI" on that OAuth client. Defaults to `http://localhost:3000/api/auth/google/callback`. |
| `JWT_SECRET` | Signs session JWTs. Generate with `openssl rand -base64 32`. |

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Apply pending PostgreSQL migrations, then start the production server (after `build`) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npx prisma studio` | Browse the PostgreSQL database |

## Project structure

```
src/
  app/
    api/
      auth/         Google OAuth login/callback, session (/me), logout
      files/         File CRUD
      folders/        Folder CRUD
      workspace/      Workspace fetch + guest-workspace import
      settings/        Per-user editor settings
    page.tsx           App shell
  components/
    editor/            Monaco wrapper, tabs
    explorer/           File/folder tree
    menu/               Notepad++-style top menu bar (File/Edit/Search/View/...)
    panels/             Resizable layout panels
    search/             Find & replace, Quick Open, Command Palette
    settings/            Settings dialog
    trash/               Recycle bin UI
    dialogs/ auth/ pwa/  Misc dialogs, sign-in UI, PWA install prompt
    ui/                  shadcn/ui primitives
  services/
    storage/            Active repository abstraction (guest vs. cloud mode)
    auth/                Guest → cloud workspace migration
    exportImport/         Zip export/import
    formatting/          JSON/XML/HTML/CSS/JS formatters
    search/               Search/replace engine
    shortcuts/            Keyboard shortcut → action registry
  lib/
    drive/               DriveService, AppConfigService (.appConfig.json), workspace tree, legacy migration
    auth/                 JWT/session helpers
    monaco/themes/         9 editor color themes
    db/                    Prisma client singleton
  store/                 Zustand stores
  generated/prisma/      Generated Prisma client (do not edit)
prisma/
  schema.prisma          User / AppConfig
  migrations/            Additive PostgreSQL migrations
  legacy-sqlite-migrations/ Archived pre-PostgreSQL migration history
```

## Data model

Database (Prisma): `User` (authentication / account identity only) and `AppConfig` (deployment-wide AI provider keys). Everything else lives in the user's Google Drive:

```text
NextNotePad.com/
├── .appConfig.json        versioned: settings, recentFiles, favorites, activeWorkspaceId, migrations
└── Workspaces/
    └── <Workspace name>/
        ├── .workspace.json
        └── …folders and files
```

The legacy `Workspace` / `Folder` / `File` / `SyncFailure` / `UserSettings` tables are no longer in the Prisma schema but are intentionally **not dropped** yet — the one-time Drive migration reads them. Drop them only after verifying migrated data. `npm run test:drive` runs the Drive service + migration tests against an in-memory Drive (needs `DATABASE_URL` pointing at a Postgres with the legacy tables).

## Docker

A multi-stage `Dockerfile` builds a production image and runs pending PostgreSQL migrations on every container start.

```bash
docker compose up --build
```

This builds `omprakashornold/nextnotepad:local` and serves on port `3000`. Set `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `JWT_SECRET` in your shell or an `.env` file before running — `docker-compose.yml` reads them from the environment.

CI (`.github/workflows/ci-cd.yml`) type-checks, lints, and builds on every push/PR to `main`, then builds and pushes the Docker image to Docker Hub on pushes to `main`.

## Project status

Development has proceeded in phases:

- ✅ **Phase 1** — Guest Mode (fully client-side editor, no backend)
- ✅ **Phase 2a** — Google OAuth + JWT sessions + cloud-backed workspace
- ✅ **Phase 2b** — One-way push sync to Google Drive
- ✅ **Phase 2c** — Google Drive as the single source of truth (DB keeps auth identity only)
- ⏳ **Phase 3** — Offline/service-worker hardening, security hardening
- ⏳ **Phase 4** — Deploy hardening and large-workspace (10k+ file) performance validation

## License

No license file is currently present in this repository.
