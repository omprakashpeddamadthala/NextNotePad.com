import assert from "node:assert/strict";
import test from "node:test";
import {
  binaryToDecimal,
  caseConverters,
  collapseBlankLines,
  computeTextStats,
  decimalToBinary,
  decimalToHex,
  hexToDecimal,
  htmlDecode,
  htmlEncode,
  removeDuplicateLines,
  reverseLines,
  shuffleLines,
  addLineNumbers,
  removeLineNumbers,
  joinLines,
  rot13,
  slugify,
  sortLinesAscending,
  sortLinesDescending,
  hexToHsl,
  hslToHex,
  trimTrailingWhitespace,
  unixToIsoDate,
} from "./textTools";

test("case conversion recognizes Unicode word and sentence boundaries", () => {
  assert.equal(caseConverters.title("élan vital"), "Élan Vital");
  assert.equal(caseConverters.title("mañana será"), "Mañana Será");
  assert.equal(
    caseConverters.sentence("привет. ДОБРЫЙ ДЕНЬ!"),
    "Привет. Добрый день!",
  );
});

test("whitespace transforms preserve CRLF line endings", () => {
  assert.equal(
    trimTrailingWhitespace("first  \r\nsecond\t\r\n"),
    "first\r\nsecond\r\n",
  );
  assert.equal(
    collapseBlankLines("first\r\n\r\n\r\nsecond"),
    "first\r\n\r\nsecond",
  );
});

test("base conversions preserve integers beyond Number.MAX_SAFE_INTEGER", () => {
  assert.equal(decimalToHex("9007199254740993"), "20000000000001");
  assert.equal(hexToDecimal("20000000000001"), "9007199254740993");
  assert.equal(
    decimalToBinary("-9007199254740993"),
    "-100000000000000000000000000000000000000000000000000001",
  );
  assert.equal(
    binaryToDecimal("-100000000000000000000000000000000000000000000000000001"),
    "-9007199254740993",
  );
});

test("Unix timestamp conversion recognizes 12-digit millisecond values", () => {
  assert.equal(unixToIsoDate("946684800000"), "2000-01-01T00:00:00.000Z");
  assert.equal(unixToIsoDate("946684800"), "2000-01-01T00:00:00.000Z");
});

// --- New tests ---

test("sort/dedupe/reverse preserve CRLF line endings", () => {
  assert.equal(
    sortLinesAscending("banana\r\napple\r\ncherry"),
    "apple\r\nbanana\r\ncherry",
  );
  assert.equal(
    sortLinesDescending("banana\r\napple\r\ncherry"),
    "cherry\r\nbanana\r\napple",
  );
  assert.equal(
    removeDuplicateLines("a\r\nb\r\na\r\nc"),
    "a\r\nb\r\nc",
  );
  assert.equal(
    reverseLines("first\r\nsecond\r\nthird"),
    "third\r\nsecond\r\nfirst",
  );
});

test("reverseLines works with LF", () => {
  assert.equal(reverseLines("a\nb\nc"), "c\nb\na");
});

test("shuffleLines produces all the same lines (no data loss)", () => {
  const input = "a\nb\nc\nd\ne";
  const result = shuffleLines(input);
  const original = input.split("\n").sort();
  const shuffled = result.split("\n").sort();
  assert.deepEqual(shuffled, original);
});

test("addLineNumbers and removeLineNumbers round-trip", () => {
  const input = "hello\nworld\nfoo";
  const numbered = addLineNumbers(input);
  assert.match(numbered, /^1  hello/);
  assert.match(numbered, /3  foo/);
  const stripped = removeLineNumbers(numbered);
  assert.equal(stripped, input);
});

test("joinLines trims and joins with spaces", () => {
  assert.equal(joinLines("  hello \n  world  \n\n  foo  "), "hello world foo");
});

test("rot13 is its own inverse", () => {
  const original = "Hello, World! 123";
  const encoded = rot13(original);
  assert.equal(encoded, "Uryyb, Jbeyq! 123");
  assert.equal(rot13(encoded), original);
});

test("slugify handles Unicode diacritics", () => {
  assert.equal(slugify("Héllo Wörld"), "hello-world");
  assert.equal(slugify("café résumé"), "cafe-resume");
  assert.equal(slugify("  Multiple   Spaces  "), "multiple-spaces");
});

test("htmlDecode handles numeric and hex entities", () => {
  assert.equal(htmlDecode("&#65;&#66;&#67;"), "ABC");
  assert.equal(htmlDecode("&#x41;&#x42;&#x43;"), "ABC");
  assert.equal(htmlDecode("&lt;div&gt;"), "<div>");
  assert.equal(htmlEncode("<div>"), "&lt;div&gt;");
});

test("computeTextStats includes reading time", () => {
  // 200 words => 1 minute = 60 seconds
  const twoHundredWords = Array(200).fill("word").join(" ");
  const stats = computeTextStats(twoHundredWords);
  assert.equal(stats.words, 200);
  assert.equal(stats.readingTimeSecs, 60);
});

test("computeTextStats reports 0 for empty text", () => {
  const stats = computeTextStats("");
  assert.equal(stats.words, 0);
  assert.equal(stats.lines, 0);
  assert.equal(stats.readingTimeSecs, 0);
});

test("hexToHsl converts correctly", () => {
  assert.equal(hexToHsl("#ff0000"), "hsl(0, 100%, 50%)");
  assert.equal(hexToHsl("#ffffff"), "hsl(0, 0%, 100%)");
  assert.equal(hexToHsl("#000000"), "hsl(0, 0%, 0%)");
});

test("hslToHex converts correctly", () => {
  assert.equal(hslToHex("hsl(0, 100%, 50%)"), "#ff0000");
  assert.equal(hslToHex("hsl(0, 0%, 100%)"), "#ffffff");
  assert.equal(hslToHex("hsl(0, 0%, 0%)"), "#000000");
});

test("hexToHsl and hslToHex round-trip", () => {
  const hex = "#3a7bd5";
  const hsl = hexToHsl(hex);
  const backToHex = hslToHex(hsl);
  assert.equal(backToHex, hex);
});
