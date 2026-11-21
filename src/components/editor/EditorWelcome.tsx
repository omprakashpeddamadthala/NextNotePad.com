"use client";

import {
  FilePlus,
  FolderOpen,
  CalendarDays,
  Command as CommandIcon,
  Clock,
  ChevronRight,
  Code2,
  HardDrive,
  Cloud,
  GitCompare,
  Wrench,
  Search,
  Trash2,
  Mic,
  Smartphone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/fileIcons";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useDialogStore } from "@/store/dialogStore";
import { useAuthStore } from "@/store/authStore";
import { openFileForUser } from "@/services/openFile";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";
import { APP_VERSION } from "@/lib/constants/version";

interface AppFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  action?: () => void;
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof FilePlus;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-2.5 text-left text-xs transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.99] focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50 transition-all duration-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:ring-primary/20">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground group-hover:text-primary transition-colors text-xs leading-tight">
          {label}
        </span>
        {description && (
          <span className="block truncate text-[11px] text-muted-foreground mt-0.5 leading-none">
            {description}
          </span>
        )}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/30 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
    </button>
  );
}

export function EditorWelcome() {
  const recent = useRecentFilesStore((s) => s.recent);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openDialog = useDialogStore((s) => s.openDialog);
  const authStatus = useAuthStore((s) => s.status);

  const recentFiles = recent
    .map((entry) => nodes[entry.fileId])
    .filter((node) => node?.type === "file")
    .slice(0, 4);

  const APP_FEATURES: AppFeature[] = [
    {
      icon: Code2,
      title: "Monaco Pro Editor",
      description: "50+ languages, code folding, minimap, formatting, and multi-cursor editing.",
      badge: "50+ Langs",
      action: () => runAction("file.new"),
    },
    {
      icon: HardDrive,
      title: "100% Offline-First",
      description: "Zero login needed. Files, tabs, and settings persist safely in browser IndexedDB.",
      badge: "Private",
      action: () => toast.info("All files are stored 100% locally in your browser (IndexedDB)."),
    },
    {
      icon: Cloud,
      title: "Google Drive Sync",
      description: "Optional cloud backup to synchronize your workspaces across computers & devices.",
      badge: "Cloud Sync",
      action: () => openDialog("settings"),
    },
    {
      icon: GitCompare,
      title: "Side-by-Side Diff Checker",
      description: "Compare two files or revisions side-by-side with visual split-screen diffing.",
      badge: "Diff Tool",
      action: () => openDialog("commandPalette"),
    },
    {
      icon: Wrench,
      title: "Developer Text Tools",
      description: "Built-in JSON Formatter, Base64 encoder, Hash generator, URL tools & Markdown preview.",
      badge: "Built-in",
      action: () => openDialog("commandPalette"),
    },
    {
      icon: Search,
      title: "Global Search & Regex",
      description: "Find across all open files with regular expressions, match case, and batch replace.",
      badge: "Fast Search",
      action: () => runAction("search.findInFiles"),
    },
    {
      icon: Trash2,
      title: "Recycle Bin Recovery",
      description: "Accidental deletion protection — easily restore soft-deleted files and folders anytime.",
      badge: "Recovery",
      action: () => runAction("view.toggleRecycleBin"),
    },
    {
      icon: Mic,
      title: "Voice Dictation",
      description: "Hold Alt+V and speak — your words type live at the cursor, then grammar and filler words are fixed automatically, offline.",
      badge: "Speech-to-Text",
      action: () => toast.info("Open a file, then hold Alt+V (or click the mic in the top bar) and speak."),
    },
    {
      icon: Smartphone,
      title: "Installable PWA App",
      description: "Install as a standalone native app on Mac, Windows, Linux, Android, and iOS.",
      badge: "Zero Install",
      action: () => toast.info("Use the 'Install App' button in the menu bar to install NextNotePad."),
    },
  ];

  return (
    <div className="socratix-bg np-scrollbar h-full w-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      <div className="animate-in fade-in duration-300 w-full max-w-6xl mx-auto flex flex-col gap-6 @container">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <AppLogo
              size="lg"
              priority
              iconClassName="shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold tracking-tight text-foreground leading-none">
                  <span className="np-brand-gradient">Next</span>NotePad
                  <span className="text-amber-500 ml-0.5 text-xs font-semibold align-super">.com</span>
                </h1>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                  {APP_BRAND.badge}
                </span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground border border-border/70">
                  v{APP_VERSION.version}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {APP_BRAND.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1 shadow-xs">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-[11px] text-foreground/80">
                {authStatus === "authenticated" ? "Cloud Sync Active" : "Guest Mode (Local)"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground/70 shadow-xs">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Offline Ready</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 @3xl:grid-cols-12 gap-6 items-start">
          <div className="@3xl:col-span-4 flex flex-col gap-5">
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-1 gap-2">
                <QuickAction
                  icon={FilePlus}
                  label="New File"
                  description="Create an empty file (Ctrl+N)"
                  onClick={() => runAction("file.new")}
                />
                <QuickAction
                  icon={FolderOpen}
                  label="Open / Import…"
                  description="Open local files or folders (Ctrl+O)"
                  onClick={() => runAction("file.open")}
                />
                <QuickAction
                  icon={CalendarDays}
                  label="Today's Daily Note"
                  description="Open or create today's daily log"
                  onClick={() =>
                    void openTodayDailyNote().catch(() => toast.error("Couldn't open today's daily note."))
                  }
                />
                <QuickAction
                  icon={CommandIcon}
                  label="Command Palette"
                  description="Find commands and tools (Ctrl+Shift+P)"
                  onClick={() => openDialog("commandPalette")}
                />
              </div>
            </div>

            <div>
              <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3" />
                Recent Files
              </h2>
              {recentFiles.length > 0 ? (
                <ul className="overflow-hidden rounded-xl border border-border/60 bg-card divide-y divide-border/50">
                  {recentFiles.map((node) => {
                    const Icon = getFileIcon(node.name);
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => openFileForUser(node.id)}
                          className="group flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                        >
                          <Icon className="size-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors text-xs">
                            {node.name}
                          </span>
                          <span className="ml-auto hidden truncate text-[11px] text-muted-foreground/70 sm:block max-w-[130px]">
                            {node.path}
                          </span>
                          <ChevronRight className="size-3 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-xs text-muted-foreground">
                  No recent files yet. Create a file or press Ctrl+N to begin editing.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Local &amp; Private Storage</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">IndexedDB</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  100% in-browser persistence. Zero tracking, zero telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="@3xl:col-span-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3" />
                Features &amp; Capabilities
              </h2>
              <span className="text-[11px] font-medium text-muted-foreground/70">
                9 built-in modules
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
              {APP_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.title}
                    type="button"
                    onClick={feature.action}
                    className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3.5 text-left transition-[border-color,box-shadow] duration-150 hover:border-primary/30 hover:shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50 transition-colors duration-150 group-hover:bg-primary/10 group-hover:text-primary group-hover:ring-primary/20">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {feature.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground/80">{feature.badge}</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{APP_BRAND.domain}</span>
            <span>•</span>
            <span>Fast, offline-first notepad with zero install</span>
          </div>
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono text-[10px] bg-muted text-foreground/80 px-1.5 py-0.5 rounded border border-border/70">Ctrl+N</kbd> New</span>
            <span><kbd className="font-mono text-[10px] bg-muted text-foreground/80 px-1.5 py-0.5 rounded border border-border/70">Ctrl+O</kbd> Open</span>
            <span><kbd className="font-mono text-[10px] bg-muted text-foreground/80 px-1.5 py-0.5 rounded border border-border/70">Ctrl+P</kbd> Quick Open</span>
            <span><kbd className="font-mono text-[10px] bg-muted text-foreground/80 px-1.5 py-0.5 rounded border border-border/70">Ctrl+Shift+P</kbd> Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}
