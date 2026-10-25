/**
 * Deterministic clean-up for browser speech-to-text output, which arrives as
 * lowercase words with no punctuation. Grammar fixes are done separately by
 * Harper (see `grammarFix.ts`); these rules cover what a grammar checker
 * doesn't: filler words, spoken commands and sentence punctuation.
 */

const FILLERS = /\b(?:u+m+|u+h+m*|e+r+m*|a+h+|h+m+|m+h*m+)\b[,.]?\s*/gi;

/** Spoken punctuation, longest phrases first. `null` means "end of line". */
const COMMANDS: Array<[RegExp, string]> = [
  [/\bnew paragraph\b/gi, "\n\n"],
  [/\b(?:new line|next line)\b/gi, "\n"],
  [/\bquestion mark\b/gi, "?"],
  [/\bexclamation (?:mark|point)\b/gi, "!"],
  [/\bfull stop\b/gi, "."],
  [/\bsemicolon\b/gi, ";"],
  [/\bcomma\b/gi, ","],
  // "period" is also an ordinary word, so only treat it as punctuation at
  // the end of the utterance or right before a line break.
  [/\bperiod\b(?=\s*(?:$|\n))/gi, "."],
];

/**
 * Turns a raw transcript into text with punctuation commands applied and
 * filler words removed. "scratch that" deletes the sentence spoken before it.
 */
export function applySpokenRules(raw: string): string {
  let text = ` ${raw} `.replace(/\s+/g, " ");

  text = text.replace(FILLERS, "");
  for (const [pattern, replacement] of COMMANDS) {
    text = text.replace(pattern, replacement);
  }
  text = applyScratchThat(text);

  return tidySpacing(text);
}

/** Capitalises sentence starts and ends the text with a full stop. */
export function finishSentences(text: string): string {
  let out = text.replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (_, lead: string, ch: string) =>
    lead + ch.toUpperCase(),
  );
  out = out.replace(/\bi\b(?=['’ ]|$)/g, "I");
  // Only the last line gets an automatic full stop; earlier lines may be
  // list items or headings the user dictated with "new line".
  const lines = out.split("\n");
  const last = lines.length - 1;
  if (/[\p{L}\p{N})"'’]$/u.test(lines[last])) lines[last] += ".";
  return lines.join("\n");
}

function applyScratchThat(text: string): string {
  const marker = /\bscratch that\b[,.]?/i;
  let out = text;
  for (let match = marker.exec(out); match; match = marker.exec(out)) {
    const before = out.slice(0, match.index).trimEnd();
    const after = out.slice(match.index + match[0].length);
    // Drop back to the boundary before the last sentence (ignoring the
    // punctuation that ends that sentence itself).
    const search = /[.?!\n]$/.test(before) ? before.slice(0, -1) : before;
    const boundary = Math.max(
      search.lastIndexOf("."),
      search.lastIndexOf("?"),
      search.lastIndexOf("!"),
      search.lastIndexOf("\n"),
    );
    out = (boundary >= 0 ? before.slice(0, boundary + 1) : "") + " " + after;
  }
  return out;
}

function tidySpacing(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(?=[^\s,.;:!?\n])/g, "$1 ")
    .replace(/([,;:])(?:\s*[,;:])+/g, "$1")
    .replace(/^[\s,.;:]+/, "")
    .replace(/[ \t]+$/g, "")
    .trimEnd();
}
