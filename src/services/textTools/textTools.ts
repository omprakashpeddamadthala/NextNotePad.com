import { v4 as uuidv4 } from "uuid";

export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function base64Decode(text: string): string {
  const binary = atob(text.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function capitalizeFirstCasedCharacter(text: string): string {
  let offset = 0;
  for (const character of text) {
    const upper = character.toUpperCase();
    if (upper !== character.toLowerCase()) {
      return (
        text.slice(0, offset) + upper + text.slice(offset + character.length)
      );
    }
    offset += character.length;
  }
  return text;
}

function titleCase(text: string): string {
  const lower = text.toLowerCase();
  const segments = new Intl.Segmenter(undefined, {
    granularity: "word",
  }).segment(lower);
  return Array.from(segments, (segment) =>
    segment.isWordLike
      ? capitalizeFirstCasedCharacter(segment.segment)
      : segment.segment,
  ).join("");
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  let capitalizeNext = true;
  let afterTerminator = false;
  let result = "";

  for (const character of lower) {
    const isCased = character.toUpperCase() !== character.toLowerCase();
    const isSentenceWrapper = `"'\u201c\u201d\u2018\u2019([{`.includes(
      character,
    );
    if (capitalizeNext && isCased) {
      result += character.toUpperCase();
      capitalizeNext = false;
    } else {
      result += character;
      if (capitalizeNext && !/\s/.test(character) && !isSentenceWrapper)
        capitalizeNext = false;
    }

    if (afterTerminator) {
      if (/\s/.test(character)) {
        capitalizeNext = true;
      } else if (!`"'”’)]}`.includes(character)) {
        afterTerminator = false;
      }
    }
    if (".!?".includes(character)) afterTerminator = true;
  }

  return result;
}

export const caseConverters = {
  upper: (text: string) => text.toUpperCase(),
  lower: (text: string) => text.toLowerCase(),
  title: titleCase,
  sentence: sentenceCase,
  camel: (text: string) => {
    const words = splitWords(text);
    return words
      .map((w, i) =>
        i === 0
          ? w.toLowerCase()
          : w[0].toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join("");
  },
  pascal: (text: string) =>
    splitWords(text)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(""),
  snake: (text: string) =>
    splitWords(text)
      .map((w) => w.toLowerCase())
      .join("_"),
  kebab: (text: string) =>
    splitWords(text)
      .map((w) => w.toLowerCase())
      .join("-"),
  constant: (text: string) =>
    splitWords(text)
      .map((w) => w.toUpperCase())
      .join("_"),
} as const;

export type CaseConverterId = keyof typeof caseConverters;

const CASE_CONVERTER_LABELS: Record<CaseConverterId, string> = {
  upper: "UPPERCASE",
  lower: "lowercase",
  title: "Title Case",
  sentence: "Sentence case",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  kebab: "kebab-case",
  constant: "CONSTANT_CASE",
};

/** Menu/palette entries for every case converter, in display order. */
export const CASE_CONVERTER_OPTIONS: readonly {
  id: CaseConverterId;
  label: string;
}[] = (Object.keys(CASE_CONVERTER_LABELS) as CaseConverterId[]).map((id) => ({
  id,
  label: CASE_CONVERTER_LABELS[id],
}));

export const HASH_ALGORITHMS = [
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export async function computeHash(
  algorithm: HashAlgorithm,
  text: string,
): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatJson(text: string): string {
  return JSON.stringify(JSON.parse(text), null, 2);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

function splitPreservingEol(text: string): { lines: string[]; eol: string } {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(eol);
  return { lines, eol };
}

export function sortLinesAscending(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  return lines.sort((a, b) => a.localeCompare(b)).join(eol);
}

export function sortLinesDescending(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  return lines.sort((a, b) => b.localeCompare(a)).join(eol);
}

export function removeDuplicateLines(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  return Array.from(new Set(lines)).join(eol);
}

export function reverseLines(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  return lines.reverse().join(eol);
}

export function shuffleLines(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  return lines.join(eol);
}

export function addLineNumbers(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  const width = String(lines.length).length;
  return lines
    .map((line, i) => `${String(i + 1).padStart(width, " ")}  ${line}`)
    .join(eol);
}

export function removeLineNumbers(text: string): string {
  const { lines, eol } = splitPreservingEol(text);
  return lines.map((line) => line.replace(/^\s*\d+\s{1,2}/, "")).join(eol);
}

export function joinLines(text: string): string {
  const { lines } = splitPreservingEol(text);
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
}

export function trimTrailingWhitespace(text: string): string {
  return text.replace(/[ \t]+(?=\r?$)/gm, "");
}

export function collapseBlankLines(text: string): string {
  return text.replace(/(\r?\n)(?:\r?\n){2,}/g, "$1$1");
}

const INDENT_WIDTH = 4;

export function tabsToSpaces(text: string): string {
  return text.replace(/\t/g, " ".repeat(INDENT_WIDTH));
}

export function spacesToTabs(text: string): string {
  return text.replace(new RegExp(` {${INDENT_WIDTH}}`, "g"), "\t");
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  /** Estimated reading time in seconds, assuming 200 wpm average reading speed. */
  readingTimeSecs: number;
}

const WORDS_PER_MINUTE = 200;

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();
  const { lines } = splitPreservingEol(text);
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words,
    lines: text.length === 0 ? 0 : lines.length,
    readingTimeSecs: Math.ceil((words / WORDS_PER_MINUTE) * 60),
  };
}

export function generateUuid(): string {
  return uuidv4();
}

export function unixToIsoDate(text: string): string {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) throw new Error("Not a valid Unix timestamp");
  const n = Number(trimmed);
  if (!Number.isFinite(n)) throw new Error("Timestamp out of range");
  const ms = Math.abs(n) >= 100_000_000_000 ? n : n * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) throw new Error("Timestamp out of range");
  return date.toISOString();
}

export function isoDateToUnix(text: string): string {
  const date = new Date(text.trim());
  if (Number.isNaN(date.getTime())) throw new Error("Not a valid date string");
  return String(Math.floor(date.getTime() / 1000));
}

function base64UrlDecode(segment: string): string {
  const padded = segment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function decodeJwt(text: string): string {
  const parts = text.trim().split(".");
  if (parts.length < 2)
    throw new Error("Not a valid JWT — expected header.payload.signature");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const HTML_UNESCAPES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

export function htmlEncode(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export function htmlDecode(text: string): string {
  return text.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&#(\d+);|&#x([0-9a-fA-F]+);/g,
    (m, dec?: string, hex?: string) => {
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      return HTML_UNESCAPES[m];
    },
  );
}

export function escapeJsonString(text: string): string {
  return JSON.stringify(text).slice(1, -1);
}

export function unescapeJsonString(text: string): string {
  return JSON.parse(`"${text}"`);
}

function parseBigIntStrict(
  text: string,
  radix: 2 | 10 | 16,
  pattern: RegExp,
): bigint {
  let trimmed = text.trim();
  const negative = trimmed.startsWith("-");
  if (negative) trimmed = trimmed.slice(1);
  if (radix === 16) trimmed = trimmed.replace(/^0x/i, "");
  if (radix === 2) trimmed = trimmed.replace(/^0b/i, "");
  if (!pattern.test(trimmed))
    throw new Error(`Not a valid base-${radix} number`);

  const prefix = radix === 16 ? "0x" : radix === 2 ? "0b" : "";
  const value = BigInt(`${prefix}${trimmed}`);
  return negative ? -value : value;
}

export function decimalToHex(text: string): string {
  return parseBigIntStrict(text, 10, /^\d+$/).toString(16);
}

export function hexToDecimal(text: string): string {
  return parseBigIntStrict(text, 16, /^[0-9a-fA-F]+$/).toString(10);
}

export function decimalToBinary(text: string): string {
  return parseBigIntStrict(text, 10, /^\d+$/).toString(2);
}

export function binaryToDecimal(text: string): string {
  return parseBigIntStrict(text, 2, /^[01]+$/).toString(10);
}

export function hexToRgb(text: string): string {
  const hex = text.trim().replace(/^#/, "");
  const full = /^[0-9a-fA-F]{3}$/.test(hex)
    ? hex
        .split("")
        .map((c) => c + c)
        .join("")
    : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error("Not a valid hex color");
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHex(text: string): string {
  const match = text
    .trim()
    .match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i);
  if (!match) throw new Error("Not a valid rgb()/rgba() color");
  const toHex = (n: string) =>
    Math.max(0, Math.min(255, Number(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function hexToHsl(text: string): string {
  const hex = text.trim().replace(/^#/, "");
  const full = /^[0-9a-fA-F]{3}$/.test(hex)
    ? hex
        .split("")
        .map((c) => c + c)
        .join("")
    : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error("Not a valid hex color");
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function hslToHex(text: string): string {
  const match = text
    .trim()
    .match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*[\d.]+\s*)?\)/i);
  if (!match) throw new Error("Not a valid hsl()/hsla() color");
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
