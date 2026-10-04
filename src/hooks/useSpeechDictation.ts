"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface UseSpeechDictationOptions {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
}

export function useSpeechDictation({ onResult, onError }: UseSpeechDictationOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);
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
    if (recognitionRef.current) return;

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
