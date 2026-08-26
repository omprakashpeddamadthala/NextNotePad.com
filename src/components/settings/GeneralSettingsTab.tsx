"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";
import type { AiProvider, AutoSaveMode, EncodingName } from "@/types/settings";
import { LANGUAGES } from "@/lib/constants/languages";

const AUTO_SAVE_OPTIONS: { value: AutoSaveMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "2s", label: "Every 2 seconds" },
  { value: "5s", label: "Every 5 seconds" },
  { value: "10s", label: "Every 10 seconds" },
  { value: "manual", label: "Manual only (Ctrl+S)" },
];

const ENCODINGS: EncodingName[] = ["UTF-8", "UTF-8 BOM", "UTF-16 LE", "UTF-16 BE", "ASCII", "ISO-8859-1"];

const AI_PROVIDER_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude (via AgentRouter)" },
];

export function GeneralSettingsTab() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="restore-session">Restore session on startup</Label>
          <p className="text-xs text-muted-foreground">Reopen your tabs, cursor and scroll position next visit.</p>
        </div>
        <Switch
          id="restore-session"
          checked={settings.restoreSession}
          onCheckedChange={(v) => updateSettings({ restoreSession: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Auto Save</Label>
        <Select value={settings.autoSave} onValueChange={(v) => updateSettings({ autoSave: v as AutoSaveMode })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTO_SAVE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Default Encoding (new files)</Label>
        <Select
          value={settings.defaultEncoding}
          onValueChange={(v) => updateSettings({ defaultEncoding: v as EncodingName })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENCODINGS.map((enc) => (
              <SelectItem key={enc} value={enc}>
                {enc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Default Language (new files)</Label>
        <Select value={settings.defaultLanguage} onValueChange={(v) => updateSettings({ defaultLanguage: v })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>AI Provider (Fix Grammar &amp; Spelling)</Label>
        <Select
          value={settings.aiProvider ?? "gemini"}
          onValueChange={(v) => updateSettings({ aiProvider: v as AiProvider })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Requires the corresponding API key to be configured on the server.
        </p>
      </div>
    </div>
  );
}
