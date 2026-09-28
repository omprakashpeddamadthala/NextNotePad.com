"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { THEME_MODULES } from "@/lib/monaco/themes";

/** Pushes the active theme's colors onto :root as CSS custom properties, live, no reload needed. */
export function ThemeApplier() {
  const themeName = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const theme = THEME_MODULES[themeName];
    if (!theme) return;
    const root = document.documentElement;
    const { chrome } = theme;

    root.classList.toggle("dark", chrome.isDark);
    root.setAttribute("data-np-theme", theme.id);

    // Compute a muted foreground: 55% foreground mixed with background
    // This is a reasonable default — the individual chrome objects don't define it explicitly
    const mutedFg = chrome.isDark
      ? "rgba(148, 163, 184, 0.9)"  // slate-400 ish for dark themes
      : "rgba(100, 116, 139, 0.9)"; // slate-500 ish for light themes

    const shadcnVars: Record<string, string> = {
      "--background": chrome.background,
      "--foreground": chrome.foreground,
      "--card": chrome.panel,
      "--card-foreground": chrome.foreground,
      "--popover": chrome.panel,
      "--popover-foreground": chrome.foreground,
      "--primary": chrome.accent,
      "--primary-foreground": chrome.accentForeground,
      "--secondary": chrome.tabInactiveBackground,
      "--secondary-foreground": chrome.foreground,
      "--muted": chrome.panel,
      "--muted-foreground": mutedFg,
      "--accent": chrome.menuHover,
      "--accent-foreground": chrome.foreground,
      "--border": chrome.panelBorder,
      "--input": chrome.panelBorder,
      "--ring": chrome.accent,
    };

    // Compute sidebar/rail background — slightly darker than toolbar for visual hierarchy
    const railBg = chrome.isDark
      ? `color-mix(in srgb, ${chrome.toolbarBackground} 85%, black 15%)`
      : `color-mix(in srgb, ${chrome.toolbarBackground} 92%, black 8%)`;

    const chromeVars: Record<string, string> = {
      "--np-toolbar-bg": chrome.toolbarBackground,
      "--np-statusbar-bg": chrome.statusBarBackground,
      "--np-statusbar-fg": chrome.statusBarForeground,
      "--np-tab-active-bg": chrome.tabActiveBackground,
      "--np-tab-inactive-bg": chrome.tabInactiveBackground,
      "--np-tab-border": chrome.tabBorder,
      "--np-scrollbar": chrome.scrollbar,
      "--np-menu-hover": chrome.menuHover,
      "--np-rail-bg": chrome.toolbarBackground,
      "--np-rail-border": chrome.tabBorder,
      "--np-sidebar-bg": railBg,
      "--np-sidebar-border": chrome.tabBorder,
    };

    for (const [key, value] of Object.entries({ ...shadcnVars, ...chromeVars })) {
      root.style.setProperty(key, value);
    }
  }, [themeName]);

  return null;
}
