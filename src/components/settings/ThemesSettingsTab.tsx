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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEME_ORDER.map((id) => {
        const t = THEME_MODULES[id];
        const isActive = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              "group bg-card/70 flex flex-col gap-2 rounded-xl border p-2.5 text-left shadow-xs transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]",
              isActive
                ? "border-primary/50 ring-primary/10 ring-2"
                : "border-border/80 hover:border-primary/25",
            )}
          >
            <div
              className="flex h-16 items-center gap-1.5 overflow-hidden rounded-lg border px-2.5 shadow-inner"
              style={{
                background: t.chrome.background,
                borderColor: t.chrome.panelBorder,
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: t.chrome.accent }}
              />
              <span
                className="h-2 flex-1 rounded-full"
                style={{ background: t.chrome.foreground, opacity: 0.5 }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={isActive ? "text-primary" : "text-foreground"}>
                {t.label}
              </span>
              {isActive && (
                <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
