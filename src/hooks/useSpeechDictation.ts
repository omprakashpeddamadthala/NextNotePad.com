"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface UseSpeechDictationOptions {
  /** Called once per finalized phrase — only final results are committed, for accuracy. */
  onResult: (text: string) => void;
  onError?: (message: string) => void;
}

/** Continuous browser speech-to-text (Web Speech API — Chromium only). Auto-restarts on the
 *  engine's own silence timeout so a single mic toggle keeps dictating until stopped by hand. */
export function useSpeechDictation({ onResult, onError }: UseSpeechDictationOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);
  // Holds the latest `start` so `onend`'s auto-restart can call it without directly
  // self-referencing the `const start` binding (which the React Compiler rejects).
  const startRef = useRef<() => void>(() => {});
  const isSupported = getSpeechRecognitionCtor() !== null;

  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  });

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    if (recognitionRef.current) return; // already running

    const recognition = new Ctor();
    recognition.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = result[0]?.transcript.trim();
        if (transcript) onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantListeningRef.current = false;
      setListening(false);
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // Chrome silently ends the session after a period of silence — restart transparently
      // if the user hasn't explicitly stopped, so dictation feels continuous.
      if (wantListeningRef.current) {
        startRef.current();
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    wantListeningRef.current = true;
    recognition.start();
    setListening(true);
  }, []);

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => stop, [stop]);

  return { start, stop, listening, isSupported };
}
