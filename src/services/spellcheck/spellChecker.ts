import type NSpell from "nspell";

const DICTIONARY_URL = "/dictionaries/en-US/en-US";
const MAX_SUGGESTIONS = 5;

let loading: Promise<NSpell> | null = null;
const ignoredThisSession = new Set<string>();

/**
 * Downloads the English dictionary (~550 KB) the first time spell check is
 * used; the browser caches it after that. Nothing loads while it's off.
 */
export function loadSpeller(): Promise<NSpell> {
  loading ??= (async () => {
    const [{ default: nspell }, aff, dic] = await Promise.all([
      import("nspell"),
      fetch(`${DICTIONARY_URL}.aff`).then((r) => {
        if (!r.ok) throw new Error(`Dictionary download failed (${r.status})`);
        return r.text();
      }),
      fetch(`${DICTIONARY_URL}.dic`).then((r) => {
        if (!r.ok) throw new Error(`Dictionary download failed (${r.status})`);
        return r.text();
      }),
    ]);
    return nspell(aff, dic);
  })();
  loading.catch(() => {
    loading = null; // let a later attempt retry
  });
  return loading;
}

export function isWordCorrect(speller: NSpell, word: string, personal: ReadonlySet<string>): boolean {
  const lower = word.toLowerCase();
  if (personal.has(lower) || ignoredThisSession.has(lower)) return true;
  return speller.correct(word);
}

export function suggestionsFor(speller: NSpell, word: string): string[] {
  return speller.suggest(word).slice(0, MAX_SUGGESTIONS);
}

/** Hides a word until the page is reloaded. */
export function ignoreWord(word: string): void {
  ignoredThisSession.add(word.toLowerCase());
}
