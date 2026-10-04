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

export function sortLinesAscending(text: string): string {
  return text
    .split("\n")
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}

export function sortLinesDescending(text: string): string {
  return text
    .split("\n")
    .sort((a, b) => b.localeCompare(a))
    .join("\n");
}

export function removeDuplicateLines(text: string): string {
  return Array.from(new Set(text.split("\n"))).join("\n");
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
}

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length,
    lines: text.length === 0 ? 0 : text.split("\n").length,
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
    /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g,
    (m) => HTML_UNESCAPES[m],
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
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
