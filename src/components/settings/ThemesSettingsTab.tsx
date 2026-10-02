"use client";

import { useState } from "react";
import { Check, Palette, Sparkles, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { THEME_ORDER } from "@/lib/constants/themes";
import { THEME_MODULES } from "@/lib/monaco/themes";
import type { ThemeName } from "@/types/theme";

export function ThemesSettingsTab() {
  const currentTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [filter, setFilter] = useState<"all" | "dark" | "light">("all");

  const filteredThemes = THEME_ORDER.filter((id) => {
    const t = THEME_MODULES[id];
    if (filter === "dark") return t.chrome.isDark;
    if (filter === "light") return !t.chrome.isDark;
    return true;
  });

  const activeThemeModule = THEME_MODULES[currentTheme];

  return (
    <div className="space-y-6">
      {/* Header Info & Active Banner */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Theme &amp; Appearance</h4>
              <p className="text-xs text-muted-foreground">Select an authentic color palette for your editor, sidebar &amp; chrome</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All ({THEME_ORDER.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("dark")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "dark" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Moon className="size-3" /> Dark
            </button>
            <button
              type="button"
              onClick={() => setFilter("light")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "light" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sun className="size-3" /> Light
            </button>
          </div>
        </div>

        {/* Current Active Theme Highlight */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Active theme:</span>
            <span className="font-semibold text-foreground">{activeThemeModule?.label}</span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {activeThemeModule?.chrome.isDark ? "Dark Scheme" : "Light Scheme"}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Theme changes apply in real-time</span>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredThemes.map((id) => {
          const t = THEME_MODULES[id];
          const isActive = currentTheme === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id as ThemeName)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer overflow-hidden",
                isActive
                  ? "border-primary bg-primary/[0.04] ring-2 ring-primary/25 shadow-md shadow-primary/5"
                  : "border-border/70 bg-card/50 hover:border-primary/40 hover:bg-card hover:shadow-xs",
              )}
            >
              {/* Theme Mockup Screen */}
              <div
                className="flex h-24 flex-col overflow-hidden rounded-lg border shadow-xs text-[10px] select-none transition-transform group-hover:scale-[1.01]"
                style={{
                  background: t.chrome.background,
                  borderColor: t.chrome.panelBorder,
                }}
              >
                {/* Window Chrome Title / Tab Bar */}
                <div
                  className="flex h-5 items-center justify-between border-b px-2"
                  style={{
                    background: t.chrome.toolbarBackground || t.chrome.panel,
                    borderColor: t.chrome.panelBorder,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: t.chrome.accent }}
                    />
                    <div
                      className="flex items-center gap-1 h-3.5 px-2 rounded-t text-[9px] font-mono border-t border-x"
                      style={{
                        background: t.chrome.tabActiveBackground,
                        borderColor: t.chrome.panelBorder,
                        color: t.chrome.foreground,
                      }}
                    >
                      <span className="size-1 rounded-full" style={{ background: t.chrome.accent }} />
                      <span className="opacity-90">index.ts</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono opacity-50" style={{ color: t.chrome.foreground }}>
                    NextNotePad
                  </span>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 flex p-2 font-mono text-[9px]">
                  {/* Left Gutter */}
                  <div
                    className="w-4 border-r pr-1 flex flex-col gap-1 text-[8px] opacity-40 select-none"
                    style={{
                      borderColor: t.chrome.panelBorder,
                      color: t.chrome.foreground,
                    }}
                  >
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                  </div>

                  {/* Syntax Highlighted Lines */}
                  <div className="flex-1 pl-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <span
                        className="font-bold"
                        style={{ color: t.chrome.accent }}
                      >
                        import
                      </span>
                      <span style={{ color: t.chrome.foreground, opacity: 0.85 }}>
                        {"{ Editor }"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="font-bold"
                        style={{ color: t.chrome.accent }}
                      >
                        const
                      </span>
                      <span style={{ color: t.chrome.foreground, opacity: 0.9 }}>
                        theme = &quot;{t.id}&quot;;
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{ color: t.chrome.accent, opacity: 0.6 }}>
                        {"// authentic scheme"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div
                  className="flex h-3.5 items-center justify-between px-2 text-[7px] font-mono"
                  style={{
                    background: t.chrome.statusBarBackground,
                    color: t.chrome.statusBarForeground,
                  }}
                >
                  <span>UTF-8</span>
                  <span style={{ color: t.chrome.accentForeground }}>TypeScript</span>
                </div>
              </div>

              {/* Theme Details Footer */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-semibold tracking-tight",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors",
                      )}
                    >
                      {t.label}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded font-medium",
                        t.chrome.isDark
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-200 text-slate-700",
                      )}
                    >
                      {t.chrome.isDark ? "Dark" : "Light"}
                    </span>
                  </div>

                  {/* Color Swatch Dots */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className="size-2.5 rounded-full border border-black/20 shadow-xs"
                      style={{ background: t.chrome.background }}
                      title="Background"
                    />
                    <span
                      className="size-2.5 rounded-full border border-black/20 shadow-xs"
                      style={{ background: t.chrome.accent }}
                      title="Accent"
                    />
                    <span
                      className="size-2.5 rounded-full border border-black/20 shadow-xs"
                      style={{ background: t.chrome.tabActiveBackground }}
                      title="Tab Active"
                    />
                    <span
                      className="size-2.5 rounded-full border border-black/20 shadow-xs"
                      style={{ background: t.chrome.statusBarBackground }}
                      title="Status Bar"
                    />
                  </div>
                </div>

                {/* Active Checkmark Pill */}
                {isActive ? (
                  <div className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-xs">
                    <Check className="size-3 stroke-[3]" /> Active
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Apply <Sparkles className="size-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
