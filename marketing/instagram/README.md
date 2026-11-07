# Instagram promo — NextNotePad.com

A 45-second promo video, generated from code (no screen recording needed).

| File | Use |
|---|---|
| `out/nextnotepad-reel-9x16.mp4` | Reel / Story — 1080×1920, 30 fps, H.264 + AAC, 45 s |
| `out/nextnotepad-feed-4x5.mp4` | Feed post — 1080×1350 centre crop of the same video |
| `out/cover.jpg` | Reel cover image |
| `CAPTION.md` | Ready-to-paste caption and hashtags |

## Storyboard (45 s)

| Time | Scene |
|---|---|
| 0–3.6 s | Hook — "Still installing a desktop notepad? Stop. Open a tab instead." |
| 3.6–7.2 s | Brand reveal — Free · Zero install · Works offline · No account needed |
| 7.2–12 s | Monaco (VS Code) editor typing code, 30 languages, tabs, autosave |
| 12–16.2 s | Cycles through all 9 themes |
| 16.2–20.6 s | Explorer: folders, workspaces, daily notes, favorites, recycle bin, split editor, ZIP export |
| 20.6–24.8 s | Command palette, Quick Open, Find & Replace |
| 24.8–29.2 s | Developer tools grid (JSON/XML/HTML/CSS format, Base64, SHA, JWT, UUID, URL, timestamps, case, sort, dedupe, stats) |
| 29.2–33.6 s | AI grammar fix (streaming) + voice dictation |
| 33.6–37.6 s | Diff checker + Markdown preview |
| 37.6–41.6 s | Offline guest mode, AES-256 file lock, Google Drive sync, installable PWA, app password lock |
| 41.6–45 s | Call to action — "Try it free →  Link in bio" |

## Re-rendering

Requires Playwright (Chromium), `ffmpeg`, and `python3` with `numpy`.

```bash
node marketing/instagram/render.mjs --stills   # key frames only, for a quick review
node marketing/instagram/render.mjs            # full render (~5 min)
```

- `promo.html` — the animation. Open `promo.html?play` in a browser to preview it live.
  Edit text, timings (`data-start` / `data-end` / `data-at`) or colours there.
- `music.py` — original synthesised 120 BPM backing track (royalty-free, no samples).
- Keep key content between y = 285 and 1635 so the 4:5 crop still works.
