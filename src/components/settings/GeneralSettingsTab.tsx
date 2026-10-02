"use client";

import {
  History,
  FileCode2,
  Binary,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
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
import type { AiProvider, AutoSaveMode, EncodingName } from "@/types/settings";
import { LANGUAGES } from "@/lib/constants/languages";

const AUTO_SAVE_OPTIONS: { value: AutoSaveMode; label: string; desc: string }[] = [
  { value: "off", label: "Off", desc: "No automatic saving" },
  { value: "2s", label: "Every 2 seconds", desc: "Fastest background persistence" },
  { value: "5s", label: "Every 5 seconds (Recommended)", desc: "Balanced performance & safety" },
  { value: "10s", label: "Every 10 seconds", desc: "Low-frequency background saves" },
  { value: "manual", label: "Manual only (Ctrl+S)", desc: "Only save on explicit keyboard shortcut" },
];

const ENCODINGS: { value: EncodingName; label: string; desc: string }[] = [
  { value: "UTF-8", label: "UTF-8 (Standard)", desc: "Default universal web encoding" },
  { value: "UTF-8 BOM", label: "UTF-8 BOM", desc: "With byte-order mark for legacy tools" },
  { value: "UTF-16 LE", label: "UTF-16 LE", desc: "Little Endian Windows unicode" },
  { value: "UTF-16 BE", label: "UTF-16 BE", desc: "Big Endian unicode" },
  { value: "ASCII", label: "ASCII (7-bit)", desc: "Plain basic Latin text" },
  { value: "ISO-8859-1", label: "ISO-8859-1", desc: "Western European Latin-1" },
];

const AI_PROVIDER_OPTIONS: { value: AiProvider; label: string; badge: string; desc: string }[] = [
  {
    value: "gemini",
    label: "Google Gemini",
    badge: "Official",
    desc: "Direct Google GenAI integration (Fast & High-accuracy)",
  },
  {
    value: "claude",
    label: "Claude (via AgentRouter)",
    badge: "Enterprise",
    desc: "Anthropic Claude models via AgentRouter gateway",
  },
];

interface GeneralSettingsTabProps {
  onNavigateTab?: (tab: string) => void;
}

export function GeneralSettingsTab({ onNavigateTab }: GeneralSettingsTabProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="space-y-6">
      {/* Session & Persistence */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Session & Persistence</h4>
            <p className="text-xs text-muted-foreground">Manage startup restoration and automatic file saving</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Restore Session */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/50 p-3.5 transition-colors hover:bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="restore-session" className="text-sm font-medium cursor-pointer">
                Restore session on startup
              </Label>
              <p className="text-xs text-muted-foreground">
                Reopens your active tabs, cursor location, scroll offsets, and active folder state.
              </p>
            </div>
            <Switch
              id="restore-session"
              checked={settings.restoreSession}
              onCheckedChange={(v) => updateSettings({ restoreSession: v })}
            />
          </div>

          {/* Auto Save */}
          <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-save" className="text-sm font-medium">Auto-Save Behavior</Label>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {settings.autoSave === "off" ? "Disabled" : settings.autoSave}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Controls how frequently unsaved document changes are committed to storage.
                </p>
              </div>
            </div>
            <Select
              value={settings.autoSave}
              onValueChange={(v) => updateSettings({ autoSave: v as AutoSaveMode })}
            >
              <SelectTrigger id="auto-save" className="w-full bg-background border-border/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTO_SAVE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">— {opt.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* New File Defaults */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCode2 className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">New File Defaults</h4>
            <p className="text-xs text-muted-foreground">Default character encoding and syntax for newly created buffers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Default Encoding */}
          <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
            <div className="flex items-center gap-2">
              <Binary className="size-3.5 text-muted-foreground" />
              <Label htmlFor="default-encoding" className="text-sm font-medium">Default Encoding</Label>
            </div>
            <Select
              value={settings.defaultEncoding}
              onValueChange={(v) => updateSettings({ defaultEncoding: v as EncodingName })}
            >
              <SelectTrigger id="default-encoding" className="w-full bg-background border-border/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCODINGS.map((enc) => (
                  <SelectItem key={enc.value} value={enc.value}>
                    <span className="font-medium">{enc.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Standard UTF-8 is recommended for cross-platform compatibility.</p>
          </div>

          {/* Default Language */}
          <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3.5">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-3.5 text-muted-foreground" />
              <Label htmlFor="default-language" className="text-sm font-medium">Default Language</Label>
            </div>
            <Select
              value={settings.defaultLanguage}
              onValueChange={(v) => updateSettings({ defaultLanguage: v })}
            >
              <SelectTrigger id="default-language" className="w-full bg-background border-border/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    <span className="font-medium">{lang.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Applies syntax highlighting when creating an untitled tab.</p>
          </div>
        </div>
      </div>

      {/* AI Assistant Preferences */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">AI Intelligence Provider</h4>
              <p className="text-xs text-muted-foreground">Select provider for grammar correction, code explanations &amp; completions</p>
            </div>
          </div>
          {onNavigateTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab("ai")}
              className="text-xs gap-1.5 h-8 border-primary/30 hover:border-primary/60 text-primary"
            >
              Manage API Keys <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AI_PROVIDER_OPTIONS.map((provider) => {
              const isSelected = (settings.aiProvider ?? "gemini") === provider.value;
              return (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() => updateSettings({ aiProvider: provider.value })}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs"
                      : "border-border/60 bg-background/50 hover:border-border hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-medium text-sm text-foreground">{provider.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {provider.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{provider.desc}</p>
                  {isSelected && (
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-primary">
                      <CheckCircle2 className="size-3" /> Selected Provider
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>Server-side encryption is used for API requests. Keys are never exposed to client browsers.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
