"use client";

import { useEffect, useRef, useState } from "react";
import { Minimize2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

const HIDE_AFTER_MS = 1800;

/**
 * The only control visible in focus mode. It fades in when the mouse moves
 * (always visible on touch screens) and Esc also leaves focus mode, unless the
 * editor already used Esc to close something like the find box.
 */
export function FocusModeExit() {
  const setFocusMode = useUIStore((s) => s.setFocusMode);
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show() {
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) setFocusMode(false);
    }
    show();
    window.addEventListener("mousemove", show);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      window.removeEventListener("mousemove", show);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setFocusMode]);

  return (
    <button
      type="button"
      onClick={() => setFocusMode(false)}
      className={`bg-card/85 text-muted-foreground hover:text-foreground border-border/70 focus-visible:ring-ring fixed top-3 right-3 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-opacity duration-300 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none [@media(hover:none)]:opacity-100 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Minimize2 className="size-3.5" />
      Exit focus
      <kbd className="text-muted-foreground/80 ml-1 font-mono text-[10px]">
        Esc
      </kbd>
    </button>
  );
}
