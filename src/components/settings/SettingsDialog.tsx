"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDialogStore } from "@/store/dialogStore";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { EditorSettingsTab } from "./EditorSettingsTab";
import { ThemesSettingsTab } from "./ThemesSettingsTab";
import { ShortcutsSettingsTab } from "./ShortcutsSettingsTab";

export function SettingsDialog() {
  const open = useDialogStore((s) => s.open.settings);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("settings", v)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Changes apply immediately and are stored in this browser.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>
          <div className="max-h-[60vh] overflow-y-auto np-scrollbar py-2">
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
