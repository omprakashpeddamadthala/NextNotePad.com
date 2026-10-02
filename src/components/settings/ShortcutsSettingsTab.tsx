"use client";

import { useState } from "react";
import { Search, Keyboard, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SHORTCUTS } from "@/lib/constants/shortcuts";
import { toast } from "sonner";

const CATEGORIES = ["All", "File", "Edit", "Search", "View", "Window"] as const;

export function ShortcutsSettingsTab() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const filteredShortcuts = SHORTCUTS.filter((s) => {
    const matchesCategory =
      selectedCategory === "All" || s.category === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.label.toLowerCase().includes(q) ||
      s.keys.toLowerCase().includes(q) ||
      s.action.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleCopyKeys = (keys: string, action: string) => {
    navigator.clipboard.writeText(keys);
    setCopiedAction(action);
    toast.success(`Copied shortcut: ${keys}`);
    setTimeout(() => setCopiedAction(null), 1500);
  };

  // Helper to split "Ctrl+Shift+P" into ["Ctrl", "Shift", "P"]
  const renderKeyCaps = (keysStr: string) => {
    const parts = keysStr.split("+");
    return (
      <div className="flex items-center gap-1">
        {parts.map((part, index) => (
          <span key={index} className="flex items-center gap-1">
            <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border/80 bg-muted/80 px-2 font-mono text-[11px] font-semibold text-foreground shadow-xs">
              {part}
            </kbd>
            {index < parts.length - 1 && (
              <span className="text-muted-foreground/60 text-xs">+</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Keyboard className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h4>
              <p className="text-xs text-muted-foreground">Standard Notepad++ keybindings mapped to browser actions</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/40">
            {filteredShortcuts.length} {filteredShortcuts.length === 1 ? "shortcut" : "shortcuts"}
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-3.5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts by name or keys (e.g. Save, Ctrl+S, Line, Palette)..."
              className="pl-9 bg-background/60 text-xs h-9"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === "All"
                  ? SHORTCUTS.length
                  : SHORTCUTS.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isSelected
                        ? "bg-black/20 text-white"
                        : "bg-background/80 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="rounded-xl border border-border/80 bg-card/60 shadow-xs overflow-hidden">
        {filteredShortcuts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Keyboard className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No keyboard shortcuts match your search</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try searching for a different keyword or key combo</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredShortcuts.map((shortcut) => {
              const isCopied = copiedAction === shortcut.action;
              return (
                <div
                  key={shortcut.action}
                  className="flex items-center justify-between gap-4 p-3.5 sm:px-5 hover:bg-muted/30 transition-colors group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {shortcut.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-muted text-muted-foreground border border-border/40 shrink-0">
                        {shortcut.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground/70 truncate">
                      {shortcut.action}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderKeyCaps(shortcut.keys)}
                    <button
                      type="button"
                      onClick={() => handleCopyKeys(shortcut.keys, shortcut.action)}
                      className="size-7 rounded-md border border-border/60 bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Copy key combination"
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
