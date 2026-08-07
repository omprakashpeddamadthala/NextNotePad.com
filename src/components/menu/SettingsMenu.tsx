"use client";

import { Settings, Save, History } from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AutoSaveMode } from "@/types/settings";

const AUTO_SAVE_OPTIONS: { value: AutoSaveMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "2s", label: "Every 2 seconds" },
  { value: "5s", label: "Every 5 seconds" },
  { value: "10s", label: "Every 10 seconds" },
  { value: "manual", label: "Manual only" },
];

export function SettingsMenu() {
  const setSettingsDialogOpen = useUIStore((s) => s.setSettingsDialogOpen);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <TopMenu label="Settings">
      <DropdownMenuItem onSelect={() => setSettingsDialogOpen(true)}>
        <Settings /> Preferences…
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Save /> Auto Save
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={settings.autoSave}
            onValueChange={(v) => updateSettings({ autoSave: v as AutoSaveMode })}
          >
            {AUTO_SAVE_OPTIONS.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuCheckboxItem
        checked={settings.restoreSession}
        onCheckedChange={(v) => updateSettings({ restoreSession: Boolean(v) })}
      >
        <History /> Restore Session on Startup
      </DropdownMenuCheckboxItem>
    </TopMenu>
  );
}
