import { test } from "node:test";
import assert from "node:assert/strict";
import { scanWords } from "./wordScanner";

const words = (text: string, markdown = false) =>
  scanWords(text, { markdown }).map((w) => w.word);

test("finds ordinary words with their offsets", () => {
  const found = scanWords("Hello wrold", { markdown: false });
  assert.deepEqual(found, [
    { word: "Hello", start: 0, end: 5 },
    { word: "wrold", start: 6, end: 11 },
  ]);
});

test("keeps contractions together and straightens curly apostrophes", () => {
  assert.deepEqual(words("don't can’t"), ["don't", "can't"]);
});

test("skips single letters, acronyms and camelCase", () => {
  assert.deepEqual(words("a NASA HTML iPhone myVariable fine"), ["fine"]);
});

test("skips words glued to numbers, underscores, paths and file names", () => {
  assert.deepEqual(words("v2beta my_var /usr/bin notes.txt end. Next"), ["end", "Next"]);
});

test("skips links and email addresses", () => {
  assert.deepEqual(words("see https://exampel.com/pathh or mail me@exampel.org now"), [
    "see",
    "or",
    "mail",
    "now",
  ]);
});

test("in Markdown, skips code blocks, inline code, link targets and HTML", () => {
  const md = [
    "Some txet",
    "```js",
    "cnost valeu = 1;",
    "```",
    "Use `fnuc` here",
    "[a lnik](docs/pgae) <spna>",
  ].join("\n");
  assert.deepEqual(words(md, true), ["Some", "txet", "Use", "here", "lnik"]);
});

test("plain text does not apply Markdown rules", () => {
  assert.deepEqual(words("Use `fnuc` here"), ["Use", "fnuc", "here"]);
});

test("an unclosed code fence hides the rest of a Markdown note", () => {
  assert.deepEqual(words("Before\n```\nhidden wrods", true), ["Before"]);
});
