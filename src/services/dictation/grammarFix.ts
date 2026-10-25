import type { Lint, Linter } from "harper.js";
import { applySpokenRules, finishSentences } from "./dictationRules";

/**
 * Offline grammar correction for dictated text using Harper
 * (https://writewithharper.com), a rule-based grammar checker compiled to
 * WebAssembly. Nothing leaves the browser.
 */

/**
 * Lint categories whose first suggestion is safe to apply without asking.
 * Spelling is excluded on purpose: speech recognition already produces real
 * words, and Harper "corrects" names it doesn't know (Priya → Pica).
 */
const AUTO_FIX_KINDS = new Set([
  "Agreement",
  "BoundaryError",
  "Capitalization",
  "Eggcorn",
  "Grammar",
  "Malapropism",
  "Miscellaneous",
  "Punctuation",
  "Repetition",
  "Typo",
  "Usage",
  "WordChoice",
]);

/** Upper bound on fix-and-relint rounds, in case two rules disagree. */
const MAX_ROUNDS = 25;

let linterPromise: Promise<Linter> | null = null;

/** Starts downloading and compiling Harper (about 20 MB, cached afterwards). */
export function warmUpGrammarFix(): void {
  void getLinter().catch(() => {
    linterPromise = null;
  });
}

function getLinter(): Promise<Linter> {
  linterPromise ??= (async () => {
    const [{ LocalLinter }, { binary }] = await Promise.all([
      import("harper.js"),
      import("harper.js/binary"),
    ]);
    const linter = new LocalLinter({ binary });
    await linter.setup();
    return linter;
  })();
  return linterPromise;
}

function isApostropheFix(lint: Lint): boolean {
  // "dont" → "don't" is safe; "Priya" → "Pica" is not.
  const replacement = lint.suggestions()[0]?.get_replacement_text() ?? "";
  return (
    replacement.replace(/['’]/g, "").toLowerCase() ===
      lint.get_problem_text().toLowerCase() && /['’]/.test(replacement)
  );
}

function isAutoFixable(lint: Lint): boolean {
  if (lint.suggestion_count() === 0) return false;
  const kind = lint.lint_kind();
  return AUTO_FIX_KINDS.has(kind) || (kind === "Spelling" && isApostropheFix(lint));
}

export async function fixGrammar(text: string, linter: Linter): Promise<string> {
  let out = text;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const lints = await linter.lint(out, { language: "plaintext" });
    let next = out;
    try {
      const lint = lints.find(isAutoFixable);
      if (lint) next = await linter.applySuggestion(out, lint, lint.suggestions()[0]);
    } finally {
      // Lints are WebAssembly objects; release them each round.
      for (const l of lints) l.free();
    }
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Full clean-up for one dictated utterance: spoken commands and fillers,
 * then Harper's grammar fixes, then sentence punctuation. If Harper can't
 * load, the rule-based clean-up is still applied.
 */
export async function correctDictation(raw: string): Promise<string> {
  const prepared = applySpokenRules(raw);
  if (!prepared) return "";
  let fixed = prepared;
  try {
    fixed = await fixGrammar(prepared, await getLinter());
  } catch (err) {
    linterPromise = null;
    console.warn("Grammar checker unavailable; using basic clean-up only.", err);
  }
  return finishSentences(fixed);
}
