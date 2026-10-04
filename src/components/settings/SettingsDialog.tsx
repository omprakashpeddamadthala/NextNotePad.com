"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogStore } from "@/store/dialogStore";
import { useSettingsStore } from "@/store/settingsStore";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { EditorSettingsTab } from "./EditorSettingsTab";
import { ThemesSettingsTab } from "./ThemesSettingsTab";
import {
  Palette,
  Settings2,
  SlidersHorizontal,
  Code2,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SettingsTabKey = "general" | "editor" | "themes";

interface TabItem {
  id: SettingsTabKey;
  label: string;
  subtitle: string;
  icon: typeof SlidersHorizontal;
  badge?: string;
}

const TABS: TabItem[] = [
  {
    id: "general",
    label: "General",
    subtitle: "Session, autosave & defaults",
    icon: SlidersHorizontal,
  },
  {
    id: "editor",
    label: "Editor",
    subtitle: "Fonts, indentation & preview",
    icon: Code2,
  },
  {
    id: "themes",
    label: "Themes",
    subtitle: "Appearance & color schemes",
    icon: Palette,
  },
];

export function SettingsDialog() {
  const open = useDialogStore((s) => s.open.settings);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("general");

  const handleResetDefaults = () => {
    if (window.confirm("Reset all editor settings to standard defaults? This will not erase your files.")) {
      resetSettings();
      toast.success("Settings have been reset to factory defaults.");
    }
  };

  const currentTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("settings", v)}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] h-[720px] max-w-[calc(100%-2rem)] sm:max-w-4xl lg:max-w-5xl gap-0 p-0 overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-2xl backdrop-blur-2xl"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-full flex-col md:flex-row overflow-hidden">
          {/* Left Navigation Rail (Master) */}
          <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border/70 bg-muted/20 flex flex-col justify-between">
            {/* Nav Header */}
            <div>
              <div className="p-4 sm:p-5 pb-3 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-xs">
                    <Settings2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                      Preferences
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Editor &amp; Workspace</p>
                  </div>
                </div>
              </div>

              {/* Navigation List */}
              <nav className="p-2 sm:p-3 space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium leading-none truncate">
                            {tab.label}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] truncate mt-1 hidden md:block",
                              isActive ? "text-primary-foreground/80" : "text-muted-foreground/80",
                            )}
                          >
                            {tab.subtitle}
                          </div>
                        </div>
                      </div>

                      {tab.badge && (
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider shrink-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground border border-border/50",
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Nav Footer Status Card */}
            <div className="hidden md:block p-3 m-3 rounded-xl border border-border/60 bg-background/50">
              <div className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-saved to Browser</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                NextNotePad • Zero server tracking
              </p>
            </div>
          </aside>

          {/* Right Detail Pane (Detail) */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background/50">
            {/* Top Bar */}
            <header className="h-16 shrink-0 border-b border-border/70 px-4 sm:px-6 flex items-center justify-between gap-3 bg-card/40 backdrop-blur-md">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-semibold tracking-tight text-foreground flex items-center gap-2 truncate">
                  {currentTabDef.label}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTabDef.subtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  title="Reset settings to factory defaults"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setDialogOpen("settings", false)}
                  className="size-8 rounded-lg border-border/70 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Close settings (Esc)"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </header>

            {/* Scrollable Content Body */}
            <div className="np-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === "general" && <GeneralSettingsTab />}
              {activeTab === "editor" && <EditorSettingsTab />}
              {activeTab === "themes" && <ThemesSettingsTab />}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
