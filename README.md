# NextNotePad.com

> **Write. Code. Create — Anywhere.**

A powerful browser-based code editor built with modern web technologies for a fast, lightweight, and responsive editing experience — right in your browser.

**Version:** 2.0.0

---

## ✨ Features

### ✏️ Code Editor
- Syntax highlighting for **50+ programming languages**
- Line numbers, code folding, and bracket matching
- Find & Replace (`Ctrl+F` / `Ctrl+H`)
- Go to Line (`Ctrl+G`)
- Word wrap toggle
- Show all characters (whitespace visualization)
- Zoom in/out (`Ctrl+Plus` / `Ctrl+Minus`)
- Auto-indent and smart bracket matching

### 📁 File Management
- Create, rename, and delete files
- Open files from your computer
- Multi-tab editing with drag-and-drop tab reordering
- File explorer sidebar with real-time search
- Right-click context menus on files and tabs
- Auto-save to browser localStorage
- Files persist across browser sessions

### ✨ Format Text
- **Auto-detects** content type from the text itself
- Supports **JSON**, **XML/HTML**, **CSS**, and **SQL** formatting
- Works on **selected text** or the **entire file**
- JSON pretty-print with 2-space indentation
- XML/HTML auto-indentation
- SQL keyword uppercasing and line-break formatting

### ☁️ Cloud Sync (Google Drive)
- Google Sign-In authentication
- Sync files to Google Drive backup folder
- Backup and restore from cloud
- Access your files from anywhere

### 🎨 Customization
- Dark and Light themes with one-click toggle
- Multiple encoding support (UTF-8, ANSI, UCS-2 BE/LE)
- Line ending options (Windows CR LF, Unix LF, Mac CR)
- Language selection for any file
- Toggle sidebar visibility
- Adjustable font size

### 🕐 Live Clock
- Real-time date and time display in the menu bar
- Shows full day name, date, time, and system timezone

---

## 🏗️ Tech Stack & Architecture

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI component framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool and dev server |
| **Material-UI (MUI) v7** | UI component library and icons |
| **Monaco Editor** | Code editor (powers VS Code) |

### Authentication & Cloud
| Technology | Purpose |
|---|---|
| **@react-oauth/google** | Google Sign-In (OAuth 2.0) |
| **Google Drive REST API v3** | Cloud file sync and backup |

### Storage
| Technology | Purpose |
|---|---|
| **localStorage** | Persistent browser-based file storage |

### Architecture

```
src/
├── components/          # UI Components (Single Responsibility)
│   ├── Editor/          # Monaco Editor wrapper
│   ├── MenuBar/         # Application menu bar
│   ├── NppToolbar/      # Icon toolbar
│   ├── Sidebar/         # File explorer sidebar
│   └── Tabs/            # Tab bar
├── hooks/               # Custom React hooks
│   ├── useNotes.ts      # Note/tab/settings state management
│   └── useTheme.ts      # MUI theme configuration
├── pages/
│   └── EditorPage.tsx   # Main application page
├── services/            # External service integrations
│   ├── authService.ts   # Google authentication
│   ├── googleDriveService.ts  # Google Drive API
│   └── localStorageService.ts # Browser storage
├── types/
│   └── Note.ts          # TypeScript interfaces & constants
├── App.tsx              # Root component with OAuth provider
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

**Design Principles:**
- **Single Responsibility:** Each component/service handles one concern
- **Separation of Concerns:** UI, state management, and services are cleanly separated
- **Custom Hooks:** Business logic extracted into reusable hooks (`useNotes`, `useTheme`)
- **Type Safety:** Full TypeScript with strict interfaces for `Note`, `AppSettings`, etc.
- **Memoization:** React.memo and useCallback used to prevent unnecessary re-renders

---

## 🔐 Setting Up Google OAuth

To enable Google Sign-In and Google Drive sync:

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"New Project"** and give it a name
3. Select the project

### 2. Enable APIs
1. Go to **APIs & Services → Library**
2. Search and enable **Google Drive API**

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type
3. Fill in the app name, user support email, and developer email
4. Add scopes: `openid`, `profile`, `email`, `drive.file`
5. Add your email as a test user (while in Testing status)

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Add **Authorized JavaScript origins:**
   - `http://localhost:5173` (for local development)
   - `https://nextnotepad.com` (for production)
5. Click **Create** and copy the **Client ID**

### 5. Configure the App
Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=257847266541-iaqa70vcvoo61fbuk2aontn2edrpcagb.apps.googleusercontent.com
```

> ⚠️ **Note:** Never commit `.env` files to version control. The `.gitignore` file already excludes it.

---

## 🚀 Local Setup & Running

### Prerequisites
- **Node.js** 18+ installed ([download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/nextnotepad.git
cd nextnotepad

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and add your Google OAuth Client ID

# 4. Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle (`tsc` + `vite build`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

### Production Build

```bash
npm run build
```

The optimized output will be in the `dist/` directory, ready to deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

---

## 🐳 Docker

The app is containerized with a **multi-stage build** for minimal image size (~25MB).

### Image Architecture
```
Stage 1 (build):   node:22-alpine → npm ci + vite build
Stage 2 (serve):   nginx:stable-alpine → serves static dist/
```

### Build & Run with Docker

```bash
# Build the image
docker build -t nextnotepad .

# Build with Google OAuth (optional)
docker build --build-arg VITE_GOOGLE_CLIENT_ID=257847266541-iaqa70vcvoo61fbuk2aontn2edrpcagb.apps.googleusercontent.com -t nextnotepad .

# Run the container
docker run -d -p 8080:8080 --name nextnotepad nextnotepad
```

App available at **http://localhost:8080**

### Build & Run with Docker Compose

```bash
# Add your Google Client ID to .env file first, then:
docker compose up -d

# Rebuild after code changes
docker compose up -d --build

# Stop
docker compose down
```

### Docker Image Details

| Property | Value |
|---|---|
| Base image | `nginx:stable-alpine` |
| Final image size | **~25 MB** |
| Exposed port | `8080` |
| Health check | Built-in (every 30s) |
| User | Non-root (`appuser`) |
| Gzip | Enabled for all text assets |
| Static cache | 1 year with immutable headers |

---

## 📄 License

MIT License

Copyright (c) 2026 NextNotePad.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

> Built with ❤️ by NextNotePad.com
