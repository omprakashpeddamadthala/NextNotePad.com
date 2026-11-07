// Records real footage of the running app, clip by clip, as frame sequences.
//   APP_URL=http://localhost:3000/ node capture.cjs [clipName ...]
// Each clip is written to frames/<clip>/ with clip.json (shot list + hold frames).
const path = require("path");
const { open, Recorder } = require("./lib.cjs");

const FRAMES = path.join(__dirname, "frames");
const DSF = 2;

// ---- unrecorded setup helpers --------------------------------------------
async function closeToolkit(page) {
  const b = page.getByRole("button", { name: "Close Developer Toolkit" });
  if (await b.isVisible().catch(() => false)) { await b.click(); await page.waitForTimeout(300); }
}
const newFileBtn = (page) => page.getByRole("button", { name: /New File \(Ctrl\+N\)/ }).first();
// Plain typing settings so recorded keystrokes appear exactly as written.
async function plainTyping(page) {
  await page.evaluate(() => window.monaco?.editor.getEditors().forEach((e) =>
    e.updateOptions({ autoClosingBrackets: "never", autoClosingQuotes: "never", autoIndent: "none", formatOnType: false, quickSuggestions: false, suggestOnTriggerCharacters: false })));
}
async function setContent(page, text) {
  await page.locator(".monaco-editor .view-lines").last().click();
  await page.evaluate((t) => {
    const eds = window.monaco.editor.getEditors();
    const e = eds.find((x) => x.hasTextFocus()) || eds[eds.length - 1];
    e.setValue(t);
    e.setPosition({ lineNumber: 1, column: 1 });
    e.revealLine(1);
  }, text);
  await page.waitForTimeout(300);
}
const mdToggle = (page) => page.getByRole("button", { name: /Edit Markdown Source|View Full Page Markdown/ }).first();
async function createFile(page, name, content = "") {
  await newFileBtn(page).click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Control+A");
  await page.keyboard.type(name);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  if (!content) return;
  const md = name.endsWith(".md");
  if (md) { await mdToggle(page).click(); await page.waitForTimeout(600); }
  await setContent(page, content);
  await page.keyboard.press("Control+S");
  await page.waitForTimeout(300);
  if (md) { await mdToggle(page).click(); await page.waitForTimeout(600); }
}
async function palette(page, query) {
  await page.keyboard.press("Control+Shift+P");
  await page.waitForTimeout(300);
  await page.keyboard.type(query);
  await page.waitForTimeout(250);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
}
async function closeWelcomeTab(page) {
  await page.locator('[aria-label="Open editor tabs"]').getByText("Welcome.txt").first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Control+W");
  await page.waitForTimeout(400);
}
async function editorEval(page, fn) {
  await page.evaluate(`(() => { const eds = window.monaco.editor.getEditors(); const e = eds[eds.length - 1]; (${fn})(e, window.monaco); })()`);
}
const tree = (page) => page.locator('[aria-label="File explorer"], [aria-label="File Explorer"]').first();
const toolkit = (page) => page.locator('[aria-label="Developer Toolkit"]');

// ---- clips ----------------------------------------------------------------
const CLIPS = {
  async editor(page, rec) {
    await closeToolkit(page);
    await rec.shot(8);
    await rec.click(newFileBtn(page), { frames: 12 });
    await page.keyboard.press("Control+A");
    await rec.type("app.js", { per: 2, hold: 2 });
    await rec.key("Enter", { hold: 4, wait: 700 });
    await plainTyping(page);
    await rec.click(page.locator(".monaco-editor .view-lines").first(), { frames: 8 });
    const code = [
      "// Notes, code & tools in one tab",
      "const notes = ['ideas', 'todo'];",
      "",
      "function save(text) {",
      "  return drive.write(text, 5);",
      "}",
    ].join("\n");
    await rec.moveTo({ x: 900, y: 700 }, 4);
    await rec.type(code, { per: 2, hold: 1 });
    await rec.hold(4);
    await rec.key("Control+S", { hold: 20, wait: 600 });
  },

  async themes(page, rec) {
    await closeToolkit(page);
    await createFile(page, "server.py", '# A tiny greeting server\ndef greet(name):\n    msg = f"Hello, {name}!"\n    return msg * 3\n\nprint(greet("world"))\n');
    await rec.shot(6);
    await rec.key("Control+Shift+P", { hold: 3 });
    await rec.type("theme", { per: 1, hold: 2 });
    await rec.hold(10);
    await rec.click(page.getByRole("option", { name: /Theme: Dracula/ }).first(), { frames: 10, after: 500 });
    await rec.hold(10);
    for (const name of ["Monokai", "Nord", "Classic Light", "Solarized Dark", "One Dark", "Light (New UI)", "High Contrast", "Dark (New UI)"]) {
      await palette(page, "Theme: " + name);
      await rec.shot(11);
    }
    await rec.hold(6);
  },

  async organize(page, rec) {
    await closeToolkit(page);
    await createFile(page, "todo.txt", "[ ] Ship the release\n[ ] Reply to emails\n");
    await createFile(page, "ideas.md", "# Ideas\n\n- Launch the beta\n- Write the blog post\n");
    await rec.shot(6);
    await rec.click(page.getByRole("button", { name: /^New Folder/ }).first(), { frames: 10 });
    await page.keyboard.press("Control+A");
    await rec.type("Projects", { per: 2, hold: 2 });
    await rec.key("Enter", { hold: 8, wait: 600 });
    await rec.click(page.getByRole("button", { name: /Today's Note/ }).first(), { frames: 10, after: 900 });
    await rec.hold(12);
    await rec.click(page.getByRole("menuitem", { name: "View" }).or(page.getByRole("button", { name: "View" })).first(), { frames: 10 });
    await rec.hold(4);
    await rec.click(page.getByRole("menuitemcheckbox", { name: /Split Editor/ }).first(), { frames: 8, after: 900 });
    await rec.hold(24);
  },

  async search(page, rec) {
    await closeToolkit(page);
    await createFile(page, "meeting-notes.txt", "Agenda\n- Launch plan for Friday\n- Budget review\n");
    await createFile(page, "roadmap.txt", "Q1: launch the mobile app\nQ2: launch team workspaces\n");
    await createFile(page, "journal.txt", "Today I finally planned the launch party.\n");
    await rec.shot(6);
    await rec.key("Control+P", { hold: 3 });
    await rec.type("road", { per: 1, hold: 3 });
    await rec.hold(10);
    await rec.key("Enter", { hold: 8, wait: 600 });
    await rec.click(page.getByRole("button", { name: /Search in Files/ }).first(), { frames: 10 });
    await page.locator('input[placeholder="Search across all files…"]').first().click();
    await rec.type("launch", { per: 1, hold: 3, delay: 120 });
    await page.waitForTimeout(800);
    await rec.shot(30);
  },

  async devtools(page, rec) {
    await createFile(page, "data.json", '{"name":"NextNotePad","free":true,"features":["editor","themes","tools"],"offline":true,"price":0}');
    await page.locator(".monaco-editor .view-lines").first().click();
    await rec.shot(10);
    const tk = toolkit(page);
    await rec.click(tk.getByText("JSON Tools", { exact: true }).first(), { frames: 12 });
    await rec.hold(6);
    await rec.click(page.getByRole("menuitem", { name: /Format/ }).first(), { frames: 8, after: 600 });
    await rec.hold(18);
    // scroll the toolkit to show how many tools there are
    await rec.moveTo(tk.getByText("Case Converter", { exact: true }).first(), 8);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 70); await page.waitForTimeout(60); await rec.shot(2); }
    await editorEval(page, (e, m) => { const l = e.getModel().getLineCount(); const c = e.getModel().getLineMaxColumn(l); e.executeEdits("", [{ range: new m.Range(l, c, l, c), text: "\n" }]); e.setPosition({ lineNumber: l + 1, column: 1 }); e.revealLine(1); });
    await rec.click(tk.getByText("Generate UUID", { exact: true }).first(), { frames: 8, after: 500 });
    await rec.hold(20);
  },

  async ai(page, rec) {
    await page.route("**/api/ai/correct**", (r) => r.fulfill({ status: 200, contentType: "text/plain; charset=utf-8",
      body: "I went to the meeting yesterday, and it was great.\nWe have decided to launch the new website next week." }));
    await createFile(page, "draft.txt", "i has went to the meeting yesterday and it were grate.\nwe has decide to launch the new websit next week.");
    await page.locator(".monaco-editor .view-lines").first().click();
    await editorEval(page, (e) => e.updateOptions({ wordWrap: "on" }));
    await rec.shot(14);
    await rec.click(toolkit(page).getByText("Fix Grammar & Spelling", { exact: true }).first(), { frames: 12 });
    await rec.hold(8);
    await rec.click(page.getByRole("menuitem", { name: /Fix with Gemini/ }).first(), { frames: 8, after: 1500 });
    await rec.hold(30);
  },

  async markdown(page, rec) {
    await closeToolkit(page);
    await createFile(page, "launch.md", "# Launch plan 🚀\n\nShip **NextNotePad** to everyone.\n\n## Checklist\n\n- [x] Write the docs\n- [x] Record the demo\n- [ ] Post on Instagram\n\n> Free, fast and private.\n\n```js\nsave(note);\n```\n");
    await rec.shot(20);
    await rec.click(mdToggle(page), { frames: 12, after: 700 });
    await plainTyping(page);
    await editorEval(page, (e) => { e.focus(); e.setPosition({ lineNumber: 9, column: 1000 }); });
    await rec.shot(4);
    await rec.type("\n- [ ] Go viral", { per: 1, hold: 2 });
    await rec.hold(8);
    await rec.click(mdToggle(page), { frames: 8, after: 700 });
    await rec.hold(24);
  },

  async diff(page, rec) {
    await closeToolkit(page);
    await closeWelcomeTab(page);
    await createFile(page, "v1.txt", "price: 10\ntax: 0.05\nshipping: free\nstatus: draft\n");
    await createFile(page, "v2.txt", "price: 10\ntax: 0.08\nshipping: free\nstatus: live\n");
    await rec.shot(6);
    await rec.click(page.getByRole("button", { name: /Diff Checker/ }).first(), { frames: 12, after: 1200 });
    await rec.hold(40);
  },

  async lock(page, rec) {
    await closeToolkit(page);
    await closeWelcomeTab(page);
    await createFile(page, "passwords.txt", "bank: ********\nwifi: correct-horse-battery\n");
    await rec.shot(8);
    await rec.click(tree(page).getByText("passwords.txt").first(), { frames: 12, button: "right" });
    await rec.hold(6);
    await rec.click(page.getByRole("menuitem", { name: /^Lock/ }).first(), { frames: 8, after: 500 });
    await rec.hold(4);
    const inputs = page.locator('[role="dialog"] input[type="password"]');
    await inputs.nth(0).click();
    await rec.type("secret123", { per: 2, hold: 2 });
    if (await inputs.count() > 1) { await inputs.nth(1).click(); await rec.type("secret123", { per: 3, hold: 2 }); }
    await rec.hold(4);
    await rec.click(page.locator('[role="dialog"]').getByRole("button", { name: /^Lock/ }).last(), { frames: 10, after: 1200 });
    await rec.hold(14);
    await rec.click(tree(page).getByText("passwords.txt").first(), { frames: 10, after: 800 });
    await rec.hold(30);
  },
};

(async () => {
  const want = process.argv.slice(2);
  for (const [name, fn] of Object.entries(CLIPS)) {
    if (want.length && !want.includes(name)) continue;
    const { browser, page } = await open({ dsf: DSF });
    const rec = new Recorder(page, path.join(FRAMES, name));
    try { await fn(page, rec); } catch (e) { console.log(name, "FAILED:", e.message.split("\n")[0]); await page.screenshot({ path: path.join(FRAMES, name + "-error.png") }); }
    rec.save({ name, dsf: DSF });
    await browser.close();
  }
})();
