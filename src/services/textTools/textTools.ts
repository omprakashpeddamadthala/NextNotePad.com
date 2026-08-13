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
