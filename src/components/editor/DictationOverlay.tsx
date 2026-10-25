"use client";

import { Check, Loader2, Mic, X } from "lucide-react";
import { useDictationStore } from "@/store/dictationStore";
import {
  cancelDictation,
  finishDictation,
} from "@/services/dictation/dictationController";
import { DICTATION_HOTKEY_LABEL } from "@/hooks/useDictationHotkey";
import { cn } from "@/lib/utils";

const PREVIEW_CHARS = 90;

/** Floating pill shown while recording and while the AI cleans up the text. */
export function DictationOverlay() {
  const phase = useDictationStore((s) => s.phase);
  const mode = useDictationStore((s) => s.mode);
  const finalText = useDictationStore((s) => s.finalText);
  const interimText = useDictationStore((s) => s.interimText);

  if (phase === "idle") return null;

  const listening = phase === "listening";
  const transcript = [finalText, interimText].filter(Boolean).join(" ");
  const preview =
    transcript.length > PREVIEW_CHARS ? `…${transcript.slice(-PREVIEW_CHARS)}` : transcript;
  const hint = !listening
    ? "Correcting grammar… · Esc to keep as spoken"
    : mode === "hold"
      ? "Release to finish · Esc to cancel"
      : `${DICTATION_HOTKEY_LABEL} or Enter to finish · Esc to cancel`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-full border border-border/70 bg-popover/95 py-2 pl-2 pr-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            listening ? "bg-red-500/15 text-red-500" : "bg-primary/15 text-primary",
          )}
        >
          {listening ? <Mic className="size-4 animate-pulse" /> : <Loader2 className="size-4 animate-spin" />}
        </div>

        {listening && (
          <div className="flex h-4 shrink-0 items-end gap-0.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-red-500/80 animate-pulse"
                style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            {preview || <span className="text-muted-foreground">Listening… start speaking</span>}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>

        {listening && (
          <button
            type="button"
            aria-label="Insert dictation"
            onClick={() => finishDictation()}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          aria-label={listening ? "Cancel dictation" : "Keep as spoken"}
          onClick={() => cancelDictation()}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
