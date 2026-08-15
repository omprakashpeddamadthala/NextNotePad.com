/** Pure text-transform helpers backing the Tools dialog — no editor/DOM dependencies so they're
 *  trivially unit-testable and reusable from anywhere (menu, command palette, mobile sheet). */

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

/** Splits identifier-like or prose text into words, treating camelCase/PascalCase boundaries,
 *  underscores, hyphens, and whitespace all as separators. */
function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export const caseConverters = {
  upper: (text: string) => text.toUpperCase(),
  lower: (text: string) => text.toLowerCase(),
  title: (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  sentence: (text: string) =>
    text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
  camel: (text: string) => {
    const words = splitWords(text);
    return words
      .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
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

export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export async function computeHash(algorithm: HashAlgorithm, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Decodes a JWT's header + payload into formatted JSON — no signature verification, this is a
 *  read-only inspector, not an auth check. */
export function decodeJwt(token: string): string {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("Not a valid JWT");

  function decodePart(b64url: string): unknown {
    const padded = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  }

  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  return JSON.stringify({ header, payload }, null, 2);
}

export function generateUuidV4(): string {
  return crypto.randomUUID();
}

/** Bidirectional: a plain integer is read as a Unix timestamp (seconds, or milliseconds if it's
 *  clearly too large to be seconds) and converted to an ISO date; anything else is parsed as a
 *  date and converted to a Unix timestamp (seconds). */
export function convertTimestamp(input: string): string {
  const trimmed = input.trim();
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) > 1e12 ? num : num * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
    return date.toISOString();
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) throw new Error("Not a recognizable timestamp or date");
  return String(Math.floor(date.getTime() / 1000));
}

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ENTITY_MAP[c]);
}

/** Decodes any named/numeric HTML entity, not just the basic five — a detached `<textarea>`'s
 *  innerHTML parser does this correctly (and safely: it parses as text, it doesn't execute
 *  anything) without hand-rolling an entity table. */
export function decodeHtmlEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const LOREM_IPSUM_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut " +
  "labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco " +
  "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in " +
  "voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat " +
  "non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function loremIpsum(paragraphs = 1): string {
  return Array.from({ length: paragraphs }, () => LOREM_IPSUM_PARAGRAPH).join("\n\n");
}

const PASSWORD_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";

/** Uses crypto.getRandomValues (not Math.random) — this is a password generator, so the
 *  randomness needs to actually be unpredictable. */
export function generateRandomPassword(length = 20): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_CHARSET[b % PASSWORD_CHARSET.length]).join("");
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;
  if (sn === 0) {
    const v = ln * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return [hue2rgb(p, q, hn + 1 / 3) * 255, hue2rgb(p, q, hn) * 255, hue2rgb(p, q, hn - 1 / 3) * 255];
}

/** Cycles a color through formats: HEX -> RGB -> HSL -> HEX. Detects the input format by shape,
 *  so the same action works regardless of which format the selection is currently in. */
export function convertColorFormat(input: string): string {
  const trimmed = input.trim();

  const rgbFromHex = hexToRgb(trimmed);
  if (rgbFromHex) {
    const [r, g, b] = rgbFromHex;
    return `rgb(${r}, ${g}, ${b})`;
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const [r, g, b] = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    const [h, s, l] = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i);
  if (hslMatch) {
    const [h, s, l] = [Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3])];
    const [r, g, b] = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  }

  throw new Error("Not a recognizable HEX/RGB/HSL color");
}
