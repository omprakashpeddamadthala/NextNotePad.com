// Renders promo.html to MP4 videos for Instagram.
//
//   node marketing/instagram/render.mjs            # full render (reel + feed + cover)
//   node marketing/instagram/render.mjs --stills   # only key-frame PNGs for review
//
// Needs: Playwright (Chromium), ffmpeg, python3 + numpy (for the soundtrack).
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Playwright may be installed globally, which ESM `import` cannot resolve.
const { chromium } = createRequire(import.meta.url)("playwright");

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, "out");
fs.mkdirSync(out, { recursive: true });
const FPS = 30;
const stillsOnly = process.argv.includes("--stills");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto("file://" + path.join(dir, "promo.html"));
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);

const frameAt = async (t, type = "jpeg") => {
  await page.evaluate((tt) => window.render(tt), t);
  return page.screenshot(type === "png" ? { type: "png" } : { type: "jpeg", quality: 95 });
};

if (stillsOnly) {
  const times = [1, 2.6, 5.6, 10.8, 13.2, 15.6, 19.5, 23.5, 27.8, 32.5, 36.5, 40.5, 44];
  for (const t of times) fs.writeFileSync(path.join(out, `still-${String(t).padStart(4, "0")}.png`), await frameAt(t, "png"));
  await browser.close();
  console.log(`wrote ${times.length} stills to ${out}`);
  process.exit(0);
}

// Cover image (shown on the profile grid) — the brand reveal frame.
fs.writeFileSync(path.join(out, "cover.jpg"), await frameAt(6.6));

// Soundtrack
const wav = path.join(out, "music.wav");
execFileSync("python3", ["-I", path.join(dir, "music.py"), wav, String(duration)], { stdio: "inherit" });

// Video: pipe frames into ffmpeg
const reel = path.join(out, "nextnotepad-reel-9x16.mp4");
const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-i", wav,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-shortest", "-movflags", "+faststart", reel,
], { stdio: ["pipe", "inherit", "inherit"] });

const total = Math.round(duration * FPS);
for (let i = 0; i < total; i++) {
  const buf = await frameAt(i / FPS);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 150 === 0) console.log(`frame ${i}/${total}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c)))));
await browser.close();

// 4:5 feed version: centre crop of the safe zone (y 285..1635)
const feed = path.join(out, "nextnotepad-feed-4x5.mp4");
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", reel,
  "-vf", "crop=1080:1350:0:285",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "copy", "-movflags", "+faststart", feed,
], { stdio: "inherit" });

console.log("done:", reel, feed);
