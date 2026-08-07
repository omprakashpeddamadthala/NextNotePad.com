"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { THEME_ORDER } from "@/lib/constants/themes";
import { THEME_MODULES } from "@/lib/monaco/themes";

export function ThemesSettingsTab() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_ORDER.map((id) => {
        const t = THEME_MODULES[id];
        const isActive = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              "flex flex-col gap-2 border p-2 text-left",
              isActive ? "border-primary" : "border-border hover:border-foreground/40",
            )}
          >
            <div
              className="flex h-14 items-center gap-1 border px-2"
              style={{ background: t.chrome.background, borderColor: t.chrome.panelBorder }}
            >
              <span className="size-2 rounded-full" style={{ background: t.chrome.accent }} />
              <span className="h-2 flex-1 rounded-full" style={{ background: t.chrome.foreground, opacity: 0.5 }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>{t.label}</span>
              {isActive && <Check className="size-3.5 text-primary" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
