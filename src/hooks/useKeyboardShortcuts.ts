import { useEffect } from "react";
import { SHORTCUTS, type ActionId } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";

const TEXT_EDITING_NATIVE_ACTIONS: ActionId[] = [
  "edit.undo",
  "edit.redo",
  "edit.selectAll",
  "edit.deleteLine",
  "edit.duplicateLine",
  "edit.formatDocument",
  "search.find",
  "search.replace",
  "search.goToLine",
];

function normalizeKey(key: string): string {
  if (key === " ") return "Space";
  return key.length === 1 ? key.toUpperCase() : key;
}

function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (!["Control", "Meta", "Alt", "Shift"].includes(e.key)) {
    parts.push(normalizeKey(e.key));
  }
  return parts.join("+");
}

function isTextEditingContextFocused(): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.closest(".monaco-editor")) return true;
  if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") return true;
  return active.isContentEditable;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const combo = eventToCombo(e);
      const shortcut = SHORTCUTS.find((s) => s.keys.toUpperCase() === combo.toUpperCase());
      if (!shortcut) return;
      if (isTextEditingContextFocused() && TEXT_EDITING_NATIVE_ACTIONS.includes(shortcut.action)) return;
      const handled = runAction(shortcut.action);
      if (handled) e.preventDefault();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
