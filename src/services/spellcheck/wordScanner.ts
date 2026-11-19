export interface ScannedWord {
  /** The word to look up, with curly apostrophes made straight. */
  word: string;
  /** Offsets into the original text (end is exclusive). */
  start: number;
  end: number;
}

const WORD = /[A-Za-zÀ-ɏ]+(?:['’][A-Za-zÀ-ɏ]+)*/g;
const URL_OR_EMAIL = /\b(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+/gi;
const MARKDOWN_SKIP = [
  /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))/gm, // fenced code blocks
  /`[^`\n]+`/g, // inline code
  /\]\([^)\s]*\)/g, // link targets
  /<[^>\n]+>/g, // HTML tags
];

type Range = [number, number];

function rangesOf(pattern: RegExp, text: string): Range[] {
  const out: Range[] = [];
  for (const m of text.matchAll(pattern)) out.push([m.index, m.index + m[0].length]);
  return out;
}

function insideAny(ranges: Range[], start: number, end: number): boolean {
  return ranges.some(([a, b]) => start < b && end > a);
}

function shouldSkip(word: string, text: string, start: number, end: number): boolean {
  if (word.length < 2) return true;
  if (word === word.toUpperCase()) return true; // acronyms like NASA, HTML
  if (/[a-z][A-Z]/.test(word)) return true; // camelCase, iPhone
  // Part of an identifier, number, path or file name: v2beta, my_var, /usr/bin, notes.txt
  const before = text[start - 1] ?? "";
  const after = text[end] ?? "";
  if (/[\d_./\\]/.test(before)) return true;
  if (/[\d_/\\]/.test(after)) return true;
  if (after === "." && /[A-Za-z]/.test(text[end + 1] ?? "")) return true;
  return false;
}

/**
 * Finds the words worth spell-checking. Skips links, email addresses,
 * acronyms, camelCase and words glued to numbers, plus code and HTML in
 * Markdown.
 */
export function scanWords(text: string, options: { markdown: boolean }): ScannedWord[] {
  const skipped: Range[] = rangesOf(URL_OR_EMAIL, text);
  if (options.markdown) for (const p of MARKDOWN_SKIP) skipped.push(...rangesOf(p, text));

  const words: ScannedWord[] = [];
  for (const m of text.matchAll(WORD)) {
    const start = m.index;
    const end = start + m[0].length;
    if (insideAny(skipped, start, end)) continue;
    if (shouldSkip(m[0], text, start, end)) continue;
    words.push({ word: m[0].replace(/’/g, "'"), start, end });
  }
  return words;
}
