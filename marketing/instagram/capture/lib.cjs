// Shared helpers for driving the real NextNotePad app with Playwright.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const MONACO = path.join(ROOT, "node_modules/monaco-editor/min/");
const TYPES = { js: "application/javascript", css: "text/css", ttf: "font/ttf", json: "application/json" };
const BASE = process.env.APP_URL || "http://localhost:3000/";
const VIEWPORT = { width: 1000, height: 900 };

async function open({ dsf = 1 } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: dsf, permissions: ["clipboard-read", "clipboard-write"] });
  // Monaco's loader fetches from jsDelivr; serve the same files from node_modules instead.
  await context.route(/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\//, (r) => {
    const rel = new URL(r.request().url()).pathname.replace(/^.*\/min\//, "");
    const f = path.join(MONACO, rel);
    if (!fs.existsSync(f)) return r.fulfill({ status: 404 });
    r.fulfill({ body: fs.readFileSync(f), contentType: TYPES[f.split(".").pop()] || "application/octet-stream" });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", String(e.message || e).slice(0, 200)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  // Hide the Next.js dev-mode indicator so it never appears in footage.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} .monaco-editor .suggest-widget,.monaco-editor .parameter-hints-widget{display:none!important}" });
  await page.waitForSelector(".monaco-editor .view-lines", { timeout: 60000 });
  await page.waitForTimeout(800);
  return { browser, context, page };
}

module.exports = { open, VIEWPORT, ROOT };

// ---------------------------------------------------------------------------
// Recorder: every screenshot is one "shot" held for N video frames (30 fps).
// A fake mouse cursor is drawn into the page so moves and clicks are visible.
const CURSOR_CSS = `
#__cur{position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-3px,-2px)}
#__ring{position:fixed;z-index:2147483646;pointer-events:none;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid #f5b234;opacity:0}`;
const CURSOR_SVG = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 11.5-6.6.9 3.9 7.4-2.9 1.4-3.8-7.5L4 20z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

class Recorder {
  constructor(page, dir) {
    this.page = page; this.dir = dir; this.shots = []; this.x = 500; this.y = 450;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }
  async cursor() {
    await this.page.evaluate(([css, svg, x, y]) => {
      if (!document.getElementById("__cur")) {
        const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
        const c = document.createElement("div"); c.id = "__cur"; c.innerHTML = svg; document.body.appendChild(c);
        const r = document.createElement("div"); r.id = "__ring"; document.body.appendChild(r);
      }
      const c = document.getElementById("__cur"); c.style.left = x + "px"; c.style.top = y + "px";
    }, [CURSOR_CSS, CURSOR_SVG, this.x, this.y]);
  }
  async ring(op, scale) {
    await this.page.evaluate(([x, y, op, scale]) => {
      const r = document.getElementById("__ring"); if (!r) return;
      r.style.left = x + "px"; r.style.top = y + "px"; r.style.opacity = op; r.style.transform = `scale(${scale})`;
    }, [this.x, this.y, op, scale]);
  }
  async shot(hold = 1) {
    await this.cursor();
    const f = String(this.shots.length).padStart(4, "0") + ".jpg";
    await this.page.screenshot({ path: path.join(this.dir, f), type: "jpeg", quality: 92 });
    this.shots.push({ f, n: hold });
  }
  async hold(frames) { if (this.shots.length) this.shots[this.shots.length - 1].n += frames; }
  // Glide the cursor to a point (or the centre of a locator) over `frames` frames.
  async moveTo(target, frames = 10) {
    let tx, ty;
    if (typeof target === "object" && "x" in target) ({ x: tx, y: ty } = target);
    else { const b = await target.boundingBox(); tx = b.x + b.width / 2; ty = b.y + b.height / 2; }
    const sx = this.x, sy = this.y;
    const steps = Math.max(1, Math.round(frames / 2));
    for (let i = 1; i <= steps; i++) {
      const e = 1 - Math.pow(1 - i / steps, 3);
      this.x = sx + (tx - sx) * e; this.y = sy + (ty - sy) * e;
      await this.page.mouse.move(this.x, this.y);
      await this.shot(2);
    }
  }
  async click(target, { frames = 10, button = "left", after = 300 } = {}) {
    if (target) await this.moveTo(target, frames);
    await this.ring(0.9, 0.5); await this.shot(2);
    await this.page.mouse.click(this.x, this.y, { button });
    await this.page.waitForTimeout(after);
    await this.ring(0.5, 1.1); await this.shot(2);
    await this.ring(0, 1.4); await this.shot(1);
  }
  // Type text, taking a shot every `per` characters (each shot held `hold` frames).
  async type(text, { per = 1, hold = 2, delay = 0 } = {}) {
    for (let i = 0; i < text.length; i += per) {
      const chunk = text.slice(i, i + per);
      for (const ch of chunk) {
        if (ch === "\n") await this.page.keyboard.press("Enter");
        else await this.page.keyboard.type(ch);
      }
      if (delay) await this.page.waitForTimeout(delay);
      await this.shot(hold);
    }
  }
  async key(k, { hold = 2, wait = 250 } = {}) { await this.page.keyboard.press(k); await this.page.waitForTimeout(wait); await this.shot(hold); }
  frames() { return this.shots.reduce((a, s) => a + s.n, 0); }
  save(meta = {}) {
    fs.writeFileSync(path.join(this.dir, "clip.json"), JSON.stringify({ ...meta, width: VIEWPORT.width, height: VIEWPORT.height, shots: this.shots }, null, 1));
    console.log(path.basename(this.dir), this.shots.length, "shots,", (this.frames() / 30).toFixed(2), "s");
  }
}

module.exports.Recorder = Recorder;
