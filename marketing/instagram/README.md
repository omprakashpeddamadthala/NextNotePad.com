# Instagram promo — NextNotePad.com

A 45-second promo built from **live screen footage of the real app**: a Playwright
script drives NextNotePad (guest mode), records each feature as a frame sequence,
and the frames are composited into a branded vertical video.

| File | Use |
|---|---|
| `out/nextnotepad-reel-9x16.mp4` | Reel / Story — 1080×1920, 30 fps, H.264 + AAC, 45 s |
| `out/nextnotepad-feed-4x5.mp4` | Feed post — 1080×1350 centre crop of the same video |
| `out/cover.jpg` | Reel cover image |
| `CAPTION.md` | Ready-to-paste caption and hashtags |

## Storyboard (45 s)

| Time | Scene | Live footage |
|---|---|---|
| 0–3.4 s | Hook — "Still installing a desktop notepad? Stop." | — |
| 3.4–6.6 s | Brand reveal | — |
| 6.6–11 s | Monaco editor | New file `app.js`, code typed live with highlighting, saved |
| 11–15.6 s | 9 themes | Command Palette → `Theme:` commands cycling every theme |
| 15.6–19.6 s | Organize | New folder, Today's Note, View → Split Editor |
| 19.6–23 s | Search | Quick Open (Ctrl+P), Find in Files |
| 23–27 s | Dev tools | Dev Toolkit → Format JSON, scroll the tool list, Generate UUID |
| 27–30.2 s | AI | Fix Grammar & Spelling → Fix with Gemini |
| 30.2–34.2 s | Markdown | MD viewer ↔ source, typed line appears rendered |
| 34.2–36.8 s | Diff | Diff Checker between two tabs |
| 36.8–41.6 s | Privacy | Right-click → Lock (AES-256 passphrase) → locked file |
| 41.6–45 s | Call to action | — |

The AI scene uses a canned response for `/api/ai/correct` during capture (no API key
in the capture environment); every other screen is the app's real behaviour.

## Re-rendering

Requires Playwright (Chromium), `ffmpeg`, and `python3` with `numpy`.

```bash
npm run dev                                         # app on http://localhost:3000
node marketing/instagram/capture/capture.cjs        # record all clips (or name some: editor themes …)
node marketing/instagram/render.mjs --stills        # key frames only, for a quick review
node marketing/instagram/render.mjs                 # full render (~5 min)
```

- `capture/capture.cjs` — one function per clip; `capture/lib.cjs` has the recorder
  (fake cursor, click rings, typing). Monaco is served from `node_modules` during capture.
- `promo.html` — composition. Scene timing via `data-start`/`data-end`, camera moves via
  `data-cam` (`[time, zoom, focusX, focusY]` in app pixels).
- `music.py` — original synthesised 120 BPM backing track (royalty-free, no samples).
- Raw frames (`capture/frames/`, ~50 MB) are not committed; re-run the capture to regenerate.
