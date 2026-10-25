import { toast } from "sonner";
import { useDictationStore, type DictationMode } from "@/store/dictationStore";
import { useEditorInsertStore, type LiveInsert } from "@/store/editorInsertStore";
import { useSettingsStore } from "@/store/settingsStore";
import { correctDictation, warmUpGrammarFix } from "./grammarFix";

/**
 * Voice typing: words are typed into the editor live while the user speaks;
 * when they stop, the text stays and a grammar-corrected version replaces it
 * (Ctrl+Z restores the words as spoken). Correction runs offline in the
 * browser — see `grammarFix.ts`. Shared by the toolbar
 * button, the Tools menu, the hotkey and the floating pill, so it lives
 * outside React.
 */

interface Utterance {
  live: LiveInsert;
  recognition: SpeechRecognition | null;
  wantListening: boolean;
  finishing: boolean;
  /** Set when the user skips the correction; the raw text stays. */
  skipPolish: boolean;
  onRecognitionEnd: (() => void) | null;
}

let current: Utterance | null = null;

const store = () => useDictationStore.getState();

function getCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function isDictationSupported(): boolean {
  return getCtor() !== null;
}

export function startDictation(mode: DictationMode = "handsfree"): boolean {
  if (store().phase === "listening") return false;
  if (!isDictationSupported()) {
    toast.error("Voice typing isn't supported in this browser — try Chrome or Edge.");
    return false;
  }
  // A previous utterance still being polished keeps its text as spoken.
  if (current) skipPolish();

  const live = useEditorInsertStore.getState().beginLiveInsert?.() ?? null;
  if (!live) {
    toast.error("Open a file first to dictate into it.");
    return false;
  }
  const u: Utterance = {
    live,
    recognition: null,
    wantListening: true,
    finishing: false,
    skipPolish: false,
    onRecognitionEnd: null,
  };
  current = u;
  store().set({ phase: "listening", mode, finalText: "", interimText: "" });
  if (autoCorrectEnabled()) warmUpGrammarFix();
  listen(u);
  return true;
}

/** Stops listening; the spoken text stays and is then polished in place. */
export function finishDictation(): void {
  const u = current;
  if (!u || store().phase !== "listening" || u.finishing) return;
  u.finishing = true;
  u.wantListening = false;
  void endRecognition(u).then(() => deliver(u));
}

/**
 * While listening: stops and removes the text typed so far.
 * While correcting: stops waiting and keeps the words as spoken.
 */
export function cancelDictation(): void {
  const u = current;
  if (!u) return;
  if (store().phase === "polishing") {
    skipPolish();
    return;
  }
  u.wantListening = false;
  u.finishing = true;
  u.recognition?.abort();
  u.live.remove();
  u.live.dispose();
  current = null;
  store().set({ phase: "idle", finalText: "", interimText: "" });
}

export function toggleDictation(): void {
  if (store().phase === "listening") finishDictation();
  else startDictation("handsfree");
}

function skipPolish(): void {
  const u = current;
  if (!u) return;
  u.skipPolish = true;
  u.live.setPending(false);
  u.live.dispose();
  current = null;
  store().set({ phase: "idle", finalText: "", interimText: "" });
}

function listen(u: Utterance): void {
  const Ctor = getCtor();
  if (!Ctor) return;
  const r = new Ctor();
  r.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;

  // Results are per recognition session; Chrome restarts sessions on long
  // pauses, so keep text from earlier sessions in `carried`.
  const carried = store().finalText;

  r.onresult = (event) => {
    if (current !== u) return;
    let finals = "";
    let interim = "";
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) finals = join(finals, text);
      else interim = join(interim, text);
    }
    const finalText = join(carried, finals);
    store().set({ finalText, interimText: interim });
    if (!u.finishing) u.live.update(join(finalText, interim));
  };

  r.onerror = (event) => {
    if (event.error === "no-speech" || event.error === "aborted") return;
    u.wantListening = false;
    const message =
      event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access was blocked. Allow it in the browser's site settings."
        : `Voice input error: ${event.error}`;
    toast.error(message);
  };

  r.onend = () => {
    u.recognition = null;
    if (u.wantListening && current === u) {
      listen(u);
      return;
    }
    const done = u.onRecognitionEnd;
    u.onRecognitionEnd = null;
    if (done) done();
    else if (!u.finishing && current === u) {
      // Ended on its own (error or permission): keep what we have.
      u.finishing = true;
      void deliver(u);
    }
  };

  u.recognition = r;
  try {
    r.start();
  } catch {
    u.recognition = null;
    toast.error("Couldn't start the microphone.");
    cancelDictation();
  }
}

/** Resolves once the recognizer has flushed its last results. */
function endRecognition(u: Utterance): Promise<void> {
  const r = u.recognition;
  if (!r) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      u.onRecognitionEnd = null;
      resolve();
    }, 2000);
    u.onRecognitionEnd = () => {
      clearTimeout(timeout);
      resolve();
    };
    r.stop();
  });
}

async function deliver(u: Utterance): Promise<void> {
  if (current !== u) return;
  const { finalText, interimText } = store();
  // If the recognizer never finalised the last words, use its best guess.
  const raw = join(finalText, interimText);
  if (!raw) {
    u.live.remove();
    u.live.dispose();
    current = null;
    store().set({ phase: "idle", finalText: "", interimText: "" });
    return;
  }

  u.live.commit(raw);
  if (!autoCorrectEnabled()) {
    u.live.dispose();
    current = null;
    store().set({ phase: "idle", finalText: "", interimText: "" });
    return;
  }

  u.live.setPending(true);
  store().set({ phase: "polishing", finalText: raw, interimText: "" });
  const corrected = await correctDictation(raw);
  if (!u.skipPolish && corrected && corrected !== raw) u.live.replace(corrected);
  u.live.setPending(false);
  u.live.dispose();
  if (current === u) {
    current = null;
    store().set({ phase: "idle", finalText: "", interimText: "" });
  }
}

function autoCorrectEnabled(): boolean {
  return useSettingsStore.getState().settings.dictationAutoCorrect !== false;
}

function join(a: string, b: string): string {
  const left = a.trim();
  const right = b.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}
