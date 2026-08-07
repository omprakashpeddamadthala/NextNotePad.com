"use client";

import { SHORTCUTS } from "@/lib/constants/shortcuts";

const CATEGORIES = ["File", "Edit", "Search", "View", "Window"] as const;

export function ShortcutsSettingsTab() {
  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => (
        <div key={category}>
          <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category}</h4>
          <div className="divide-y divide-border border-y">
            {SHORTCUTS.filter((s) => s.category === category).map((s) => (
              <div key={s.action} className="flex items-center justify-between py-1 text-sm">
                <span>{s.label}</span>
                <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-xs">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
