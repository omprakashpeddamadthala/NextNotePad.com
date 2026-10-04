"use client";

import { useState } from "react";
import {
  Type,
  Code2,
  WrapText,
  Hash,
  Map,
  Space,
  Brackets,
  MousePointer2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settingsStore";
import type { CursorStyle } from "@/types/settings";

const FONT_PRESETS = [
  {
    name: "JetBrains Mono",
    value: "'JetBrains Mono', var(--font-mono), 'Fira Code', Consolas, monospace",
    tag: "Recommended",
  },
  {
    name: "Fira Code",
    value: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    tag: "Ligatures",
  },
  {
    name: "Cascadia Code",
    value: "'Cascadia Code', 'Segoe UI Mono', Consolas, monospace",
    tag: "Windows",
  },
  {
    name: "Consolas",
    value: "Consolas, 'Courier New', monospace",
    tag: "Classic",
  },
  {
    name: "System Mono",
    value: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
    tag: "Native",
  },
];

const CURSOR_STYLES: { value: CursorStyle; label: string; desc: string }[] = [
  { value: "line", label: "Line (Default)", desc: "Standard vertical bar" },
  { value: "line-thin", label: "Line (Thin)", desc: "Ultra-narrow vertical bar" },
  { value: "block", label: "Block", desc: "Full character block (Vim-style)" },
  { value: "block-outline", label: "Block (Outline)", desc: "Hollow rectangular frame" },
  { value: "underline", label: "Underline", desc: "Horizontal baseline cursor" },
  { value: "underline-thin", label: "Underline (Thin)", desc: "Subtle hairline baseline" },
];

export function EditorSettingsTab() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [sampleLang, setSampleLang] = useState<"ts" | "py" | "md">("ts");

  const changeFontSize = (delta: number) => {
    const next = Math.max(8, Math.min(40, settings.fontSize + delta));
    updateSettings({ fontSize: next });
  };

  const sampleCode = {
    ts: `// Real-Time Editor Configuration Preview
function calculateMetrics<T extends { value: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}`,
    py: `# Real-Time Editor Configuration Preview
def calculate_metrics(items: list[dict]) -> float:
    return sum(item.get("value", 0) for item in items)`,
    md: `# Editor Preview
- **Font**: ${settings.fontSize}px font with ${settings.tabWidth}-space indentation
- **Minimap**: ${settings.showMinimap ? "Enabled" : "Hidden"} | **Word Wrap**: ${settings.wordWrap ? "On" : "Off"}`,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/70 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Editor Preview
            </h4>
          </div>
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
            <button
              type="button"
              onClick={() => setSampleLang("ts")}
              className={`px-2 py-0.5 rounded font-mono transition-colors ${
                sampleLang === "ts" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              TS
            </button>
            <button
              type="button"
              onClick={() => setSampleLang("py")}
              className={`px-2 py-0.5 rounded font-mono transition-colors ${
                sampleLang === "py" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PY
            </button>
            <button
              type="button"
              onClick={() => setSampleLang("md")}
              className={`px-2 py-0.5 rounded font-mono transition-colors ${
                sampleLang === "md" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              MD
            </button>
          </div>
        </div>

        <div
          className="relative rounded-lg border border-border bg-[#181a1f] p-4 text-foreground overflow-hidden shadow-inner font-mono select-none"
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${Math.min(Math.max(settings.fontSize, 11), 18)}px`,
            lineHeight: 1.6,
            tabSize: settings.tabWidth,
          }}
        >
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/5 opacity-60 text-[10px]">
            <span className="size-2 rounded-full bg-rose-500/80" />
            <span className="size-2 rounded-full bg-amber-500/80" />
            <span className="size-2 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[10px] text-white/40">
              preview.{sampleLang} • {settings.fontSize}px • {settings.tabWidth} spaces
            </span>
          </div>

          <div className="flex">
            {settings.showLineNumbers && (
              <div className="pr-3 text-right text-white/30 select-none border-r border-white/10 mr-3 text-xs">
                <div>1</div>
                <div>2</div>
                <div>3</div>
              </div>
            )}

            <div className="flex-1 whitespace-pre overflow-x-auto text-emerald-400/90 text-xs">
              {sampleCode[sampleLang].split("\n").map((line, i) => (
                <div key={i} className="flex items-center">
                  <span>{line}</span>
                  {i === 2 && (
                    <span
                      className={`inline-block ml-0.5 ${
                        settings.cursorStyle === "block"
                          ? "w-2 h-4 bg-primary animate-pulse"
                          : settings.cursorStyle === "underline"
                          ? "w-2 h-0.5 bg-primary self-end animate-pulse"
                          : "w-0.5 h-4 bg-primary animate-pulse"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {settings.showMinimap && (
              <div className="w-8 ml-3 border-l border-white/10 pl-1.5 opacity-30 flex flex-col gap-1 text-[4px]">
                <div className="h-1 bg-white/40 rounded-xs w-full" />
                <div className="h-1 bg-white/40 rounded-xs w-3/4" />
                <div className="h-1 bg-white/40 rounded-xs w-4/5" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Type className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Typography &amp; Sizing</h4>
            <p className="text-xs text-muted-foreground">Customize font family, sizing, and tab width</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Font Family</Label>
              <span className="text-[11px] text-muted-foreground">Select preset or customize below</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FONT_PRESETS.map((preset) => {
                const isActive = settings.fontFamily.includes(preset.name);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateSettings({ fontFamily: preset.value })}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/70 hover:bg-muted text-foreground border border-border/60"
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className={`text-[10px] px-1 rounded ${
                      isActive ? "bg-black/20 text-white" : "bg-background/80 text-muted-foreground"
                    }`}>
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
            <Input
              id="fontFamily"
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="font-mono text-xs bg-background/60 mt-1.5"
              placeholder="Custom font stack..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fontSize" className="text-sm font-medium">Font Size</Label>
                <span className="text-xs font-mono font-semibold text-primary">{settings.fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => changeFontSize(-1)}
                  disabled={settings.fontSize <= 8}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  id="fontSize"
                  type="number"
                  min={8}
                  max={40}
                  value={settings.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 8 && val <= 40) {
                      updateSettings({ fontSize: val });
                    }
                  }}
                  className="h-8 text-center font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => changeFontSize(1)}
                  disabled={settings.fontSize >= 40}
                >
                  <Plus className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground shrink-0"
                  title="Reset to 15px"
                  onClick={() => updateSettings({ fontSize: 15 })}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tabWidth" className="text-sm font-medium">Tab Indentation</Label>
                <span className="text-xs font-mono font-semibold text-primary">{settings.tabWidth} spaces</span>
              </div>
              <div className="flex items-center gap-2">
                {[2, 4, 8].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={settings.tabWidth === size ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-8 text-xs font-mono"
                    onClick={() => updateSettings({ tabWidth: size })}
                  >
                    {size} spaces
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
            <div className="flex items-center gap-2">
              <MousePointer2 className="size-3.5 text-muted-foreground" />
              <Label htmlFor="cursorStyle" className="text-sm font-medium">Cursor Style</Label>
            </div>
            <Select
              value={settings.cursorStyle}
              onValueChange={(v) => updateSettings({ cursorStyle: v as CursorStyle })}
            >
              <SelectTrigger id="cursorStyle" className="w-full bg-background border-border/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURSOR_STYLES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">— {c.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Code2 className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Layout &amp; Smart Editing</h4>
            <p className="text-xs text-muted-foreground">Configure editor canvas aids, line wraps and helper indicators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              key: "wordWrap" as const,
              label: "Word Wrap",
              desc: "Wrap lines to match the editor viewport width",
              icon: WrapText,
            },
            {
              key: "showLineNumbers" as const,
              label: "Line Numbers",
              desc: "Show row numbers in the left gutter",
              icon: Hash,
            },
            {
              key: "showMinimap" as const,
              label: "Code Minimap",
              desc: "Display high-level code thumbnail on the right",
              icon: Map,
            },
            {
              key: "insertSpaces" as const,
              label: "Insert Spaces",
              desc: "Insert spaces instead of tab characters when pressing Tab",
              icon: Space,
            },
            {
              key: "renderWhitespace" as const,
              label: "Render Whitespace",
              desc: "Visualize space dots and tab glyphs",
              icon: Space,
            },
            {
              key: "autoClosingBrackets" as const,
              label: "Auto-Close Brackets",
              desc: "Automatically insert closing quotes, brackets, and braces",
              icon: Brackets,
            },
          ].map((item) => {
            const Icon = item.icon;
            const checked = settings[item.key];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <Label htmlFor={item.key} className="text-xs font-semibold cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={checked}
                  onCheckedChange={(v) => updateSettings({ [item.key]: v })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
