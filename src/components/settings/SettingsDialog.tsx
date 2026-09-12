"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDialogStore } from "@/store/dialogStore";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { EditorSettingsTab } from "./EditorSettingsTab";
import { ThemesSettingsTab } from "./ThemesSettingsTab";
import { ShortcutsSettingsTab } from "./ShortcutsSettingsTab";
import { AiConfigSettingsTab } from "./AiConfigSettingsTab";
import {
  Bot,
  Keyboard,
  Palette,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

export function SettingsDialog() {
  const open = useDialogStore((s) => s.open.settings);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("settings", v)}>
      <DialogContent className="max-h-[92dvh] gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="bg-muted/25 border-b px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary ring-primary/15 flex size-9 items-center justify-center rounded-xl ring-1">
              <Settings2 className="size-4.5" />
            </span>
            Settings
          </DialogTitle>
          <DialogDescription className="pl-11">
            Changes apply immediately and are stored in this browser.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="min-h-0 gap-0">
          <TabsList className="np-scrollbar bg-muted/20 grid h-auto w-full grid-cols-5 gap-1 overflow-x-auto rounded-none border-b p-2">
            <TabsTrigger
              value="general"
              className="h-10 gap-1.5 text-[11px] sm:text-xs"
            >
              <SlidersHorizontal className="size-3.5" /> General
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="h-10 gap-1.5 text-[11px] sm:text-xs"
            >
              <Settings2 className="size-3.5" /> Editor
            </TabsTrigger>
            <TabsTrigger
              value="themes"
              className="h-10 gap-1.5 text-[11px] sm:text-xs"
            >
              <Palette className="size-3.5" /> Themes
            </TabsTrigger>
            <TabsTrigger
              value="shortcuts"
              className="h-10 gap-1.5 text-[11px] sm:text-xs"
            >
              <Keyboard className="size-3.5" /> Shortcuts
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="h-10 gap-1.5 text-[11px] sm:text-xs"
            >
              <Bot className="size-3.5" /> AI Config
            </TabsTrigger>
          </TabsList>
          <div className="np-scrollbar max-h-[65dvh] overflow-y-auto p-4 sm:p-6">
            <TabsContent value="general">
              <GeneralSettingsTab />
            </TabsContent>
            <TabsContent value="editor">
              <EditorSettingsTab />
            </TabsContent>
            <TabsContent value="themes">
              <ThemesSettingsTab />
            </TabsContent>
            <TabsContent value="shortcuts">
              <ShortcutsSettingsTab />
            </TabsContent>
            <TabsContent value="ai">
              <AiConfigSettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
