# NextNotePad.com

A browser-based text editor inspired by **Notepad++**, built with Next.js. It runs entirely client-side out of the box (offline-first "Guest Mode"), with an optional Google account sign-in that backs your workspace with a real database and one-way sync to Google Drive.

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
- **Google Sign-In** — JWT-based session (`jose`) backed by Prisma/SQLite (`User`, `Workspace`, `Folder`, `File`, `UserSettings` tables). On first login your local guest workspace is migrated into your cloud workspace automatically.
- **One-way Google Drive sync** — every create/rename/move/delete is pushed to a `NextNotePad.com` folder in your Drive in the background (via Next.js `after()`, so it never blocks the UI). Failed pushes are tracked and retryable from a sync-status badge in the toolbar. *(Pulling changes made directly in Drive back into the app is not yet implemented — push-only for now.)*
- **PWA-ready** — installable manifest + service worker (`public/sw.js`).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (`radix-ui`), `next-themes` |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| State | Zustand, TanStack React Query, TanStack React Virtual |
| Forms | React Hook Form + Zod |
| Database | SQLite via Prisma 7 (`@prisma/client` + `@prisma/adapter-better-sqlite3` driver adapter) |
| Auth | Google OAuth 2.0 (`googleapis`) + JWT sessions (`jose`) |
| Cloud sync | Google Drive API |
| Import/export | JSZip, FileSaver, DOMPurify, `marked` (Markdown) |

> ⚠️ This project pins **Next.js 15 / Prisma 7**, both recent major versions with breaking changes from their older, more widely-known APIs. See `AGENTS.md` — before making changes, read the matching guide under `node_modules/next/dist/docs/`.

## Getting started

### Prerequisites

- Node.js 20+
- npm

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
| `DATABASE_URL` | SQLite connection string. Already set in the auto-generated `.env` (Prisma CLI convention) — leave it there, e.g. `file:./dev.db`. |
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
| `npm start` | Start the production server (after `build`) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npx prisma studio` | Browse the local SQLite database |

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
      sync/            Drive sync status + manual retry
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
    drive/               Google Drive client, root-folder management, push sync
    auth/                 JWT/session helpers
    monaco/themes/         9 editor color themes
    db/                    Prisma client singleton
  store/                 Zustand stores
  generated/prisma/      Generated Prisma client (do not edit)
prisma/
  schema.prisma          User / Workspace / Folder / File / SyncFailure / UserSettings
```

## Data model

Prisma models (SQLite): `User` → `Workspace` (1:1) → `Folder`/`File` (nested tree, soft-delete via `deletedAt`), `UserSettings` (theme + serialized editor settings), and `SyncFailure` (one row per entity currently failing to push to Drive, cleared on successful retry).

## Docker

A multi-stage `Dockerfile` builds a production image (Debian-based, since `better-sqlite3` compiles a native addon that must match the runtime's libc) and runs pending Prisma migrations on every container start.

```bash
docker compose up --build
```

This builds `omprakashornold/nextnotepad:local`, serves on port `3000`, and persists the SQLite database in a named volume (`nextnotepad-data` → `/app/data`). Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `JWT_SECRET` in your shell or an `.env` file before running — `docker-compose.yml` reads them from the environment.

CI (`.github/workflows/ci-cd.yml`) type-checks, lints, and builds on every push/PR to `main`, then builds and pushes the Docker image to Docker Hub on pushes to `main`.

## Project status

Development has proceeded in phases:

- ✅ **Phase 1** — Guest Mode (fully client-side editor, no backend)
- ✅ **Phase 2a** — Google OAuth + JWT sessions + cloud-backed workspace (Prisma/SQLite)
- ✅ **Phase 2b** — One-way push sync to Google Drive
- ⏳ **Phase 2c** — Pulling Drive changes back into the app + full conflict resolution + background retry queue
- ⏳ **Phase 3** — Offline/service-worker hardening, security hardening
- ⏳ **Phase 4** — Postgres option, deploy hardening, large-workspace (10k+ file) perf validation

## License

No license file is currently present in this repository.
