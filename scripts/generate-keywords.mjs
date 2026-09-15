import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "src", "lib", "constants", "seoKeywords.ts");

const primaryKeywords = [
  "online notepad",
  "Browser NotePad",
  "Online Note Pad",
  "notepad++",
  "notepad++ online",
  "NextNotePad",
  "NextNotePad.com",
  "NextNoteNotePad.com",
  "free online notepad",
  "notepad online",
  "browser notepad",
  "web notepad",
  "notepad in browser",
  "notepad++ alternative",
  "notepad++ web",
  "notepad++ browser",
  "notepad plus plus online",
  "online text editor",
  "browser text editor",
  "online notepad with tabs",
  "multi tab online notepad",
  "online notepad no login",
  "offline online notepad",
  "notepad pwa",
  "notepad online auto save",
  "notepad with google drive sync",
  "online code editor",
  "online developer notepad",
  "online scratchpad",
  "notepad for chrome",
  "notepad for mac online",
  "notepad for chromebook",
  "notepad for windows online",
  "notepad for linux online",
  "quick notes online",
  "web based notepad",
  "diff checker notepad",
  "json formatter notepad",
  "markdown notepad online"
];

const modifiers = [
  "online", "browser", "web", "free", "best", "fast", "instant", "offline",
  "pwa", "local", "private", "cloud", "simple", "portable", "secure",
  "minimal", "modern", "dark mode", "lightweight", "open source", "quick",
  "clean", "ad free", "responsive", "tabbed", "multi file", "auto saving",
  "real time", "safe", "encrypted", "guest mode", "no account", "no install"
];

const entities = [
  "notepad", "note pad", "notepad++", "notepad plus plus", "npp",
  "text editor", "code editor", "scratchpad", "scratch pad", "notes app",
  "textpad", "markdown editor", "json editor", "developer notepad",
  "programming notepad", "tabbed notepad", "code notepad", "web text editor",
  "browser notes", "online scratch pad"
];

const features = [
  "with tabs", "with syntax highlighting", "with dark mode", "with google drive sync",
  "with diff checker", "with json formatter", "with auto save", "with folders",
  "with line numbers", "with markdown preview", "with find and replace", "with voice dictation",
  "no login required", "no sign up", "no download", "zero install", "offline first",
  "for developers", "for programmers", "for coders", "for students", "for writers",
  "for mac", "for windows", "for chromebook", "for linux", "for android", "for ipad"
];

const keywordSet = new Set();

// 1. Add primary keywords first
primaryKeywords.forEach(k => keywordSet.add(k));

// 2. Pairwise prefix + entity
for (const m of modifiers) {
  for (const e of entities) {
    keywordSet.add(`${m} ${e}`);
    keywordSet.add(`${e} ${m}`);
  }
}

// 3. Entity + feature
for (const e of entities) {
  for (const f of features) {
    keywordSet.add(`${e} ${f}`);
  }
}

// 4. Modifier + entity + feature
for (const m of modifiers.slice(0, 15)) {
  for (const e of entities.slice(0, 10)) {
    for (const f of features.slice(0, 12)) {
      keywordSet.add(`${m} ${e} ${f}`);
    }
  }
}

// 5. Additional long-tail search intent phrases
const actions = [
  "open", "use", "download", "run", "try", "best app for", "how to open", "how to use"
];
for (const a of actions) {
  for (const e of ["notepad in browser", "online notepad", "notepad++ online", "browser notepad", "notepad with tabs"]) {
    keywordSet.add(`${a} ${e}`);
  }
}

const keywordsList = Array.from(keywordSet);

const fileContent = `/**
 * Comprehensive SEO Keywords Matrix for NextNotePad.com.
 * Contains over ${keywordsList.length} high-intent search queries covering:
 * - Online Notepad, Browser Notepad, Notepad++, Online Note Pad
 * - Notepad++ alternatives and web ports
 * - Multi-tab, syntax highlighting, offline-first, and cloud sync search terms
 */
export const SEO_KEYWORDS: string[] = ${JSON.stringify(keywordsList, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent, "utf-8");
console.log(`Successfully generated ${keywordsList.length} SEO keywords in ${outputPath}`);
