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
  badgeClass: string;
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
      className="group relative flex items-center gap-3 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12131a] p-2.5 text-left text-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs active:scale-[0.99] focus-visible:ring-1.5 focus-visible:ring-[#007492] dark:focus-visible:ring-[#00e5cc] focus-visible:outline-none cursor-pointer"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-[#00e5cc] ring-1 ring-slate-200/60 dark:ring-white/10 transition-all group-hover:bg-[#181d26] group-hover:text-white dark:group-hover:bg-[#00e5cc] dark:group-hover:text-[#0a0a0f] group-hover:scale-105">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900 dark:text-white group-hover:text-[#007492] dark:group-hover:text-[#00e5cc] transition-colors text-xs leading-tight">
          {label}
        </span>
        {description && (
          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
            {description}
          </span>
        )}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
    </button>
  );
}

/** Shown when no file is open. Full-bleed responsive dashboard without empty whitespace. */
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
      badgeClass: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
      action: () => runAction("file.new"),
    },
    {
      icon: HardDrive,
      title: "100% Offline-First",
      description: "Zero login needed. Files, tabs, and settings persist safely in browser IndexedDB.",
      badge: "Private",
      badgeClass: "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300",
      action: () => toast.info("All files are stored 100% locally in your browser (IndexedDB)."),
    },
    {
      icon: Cloud,
      title: "Google Drive Sync",
      description: "Optional cloud backup to synchronize your workspaces across computers & devices.",
      badge: "Cloud Sync",
      badgeClass: "border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
      action: () => openDialog("settings"),
    },
    {
      icon: GitCompare,
      title: "Side-by-Side Diff Checker",
      description: "Compare two files or revisions side-by-side with visual split-screen diffing.",
      badge: "Diff Tool",
      badgeClass: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
      action: () => openDialog("commandPalette"),
    },
    {
      icon: Wrench,
      title: "Developer Text Tools",
      description: "Built-in JSON Formatter, Base64 encoder, Hash generator, URL tools & Markdown preview.",
      badge: "Built-in",
      badgeClass: "border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 text-[#007492] dark:text-[#00e5cc]",
      action: () => openDialog("commandPalette"),
    },
    {
      icon: Search,
      title: "Global Search & Regex",
      description: "Find across all open files with regular expressions, match case, and batch replace.",
      badge: "Fast Search",
      badgeClass: "border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
      action: () => runAction("search.findInFiles"),
    },
    {
      icon: Trash2,
      title: "Recycle Bin Recovery",
      description: "Accidental deletion protection — easily restore soft-deleted files and folders anytime.",
      badge: "Recovery",
      badgeClass: "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300",
      action: () => runAction("view.toggleRecycleBin"),
    },
    {
      icon: Mic,
      title: "Voice Dictation",
      description: "Speak to write notes and documentation directly into the editor using speech-to-text.",
      badge: "Speech-to-Text",
      badgeClass: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
      action: () => toast.info("Click the microphone button on any open file tab to start dictation."),
    },
    {
      icon: Smartphone,
      title: "Installable PWA App",
      description: "Install as a standalone native app on Mac, Windows, Linux, Android, and iOS.",
      badge: "Zero Install",
      badgeClass: "border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
      action: () => toast.info("Use the 'Install App' button in the menu bar to install NextNotePad."),
    },
  ];

  return (
    <div className="socratix-bg np-scrollbar h-full w-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col justify-between select-none">
      <div className="animate-in fade-in w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between gap-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/90 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <AppLogo size="lg" className="hover:scale-105 transition-transform shrink-0 shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {APP_BRAND.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 px-2.5 py-0.5 text-[9.5px] font-medium text-amber-900 dark:text-amber-200 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{APP_BRAND.badge}</span>
                </span>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  v{APP_VERSION.version}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {APP_BRAND.tagline} • <span className="opacity-90">{APP_BRAND.subTagline}</span>
              </p>
            </div>
          </div>

          {/* Header Status Badges (Socratix style) */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#12131a]/80 backdrop-blur-xs px-2.5 py-1 text-slate-600 dark:text-slate-300 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px]">
                {authStatus === "authenticated" ? "Cloud Sync Active" : "Guest Mode (Local)"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#12131a]/80 backdrop-blur-xs px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
              <CheckCircle2 className="size-3 text-[#007492] dark:text-[#00e5cc]" />
              <span>Offline Ready</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5 flex-1 items-stretch">
          {/* Left Column: Actions, Recent, and Local Workspace Info */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            {/* Quick Actions */}
            <div>
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
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

            {/* Recent Files or Starter Guide */}
            <div className="flex-1 flex flex-col">
              <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="size-3 text-[#007492] dark:text-[#00e5cc]" />
                Recent Files
              </h2>
              {recentFiles.length > 0 ? (
                <ul className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12131a] divide-y divide-slate-100 dark:divide-white/5 shadow-2xs flex-1">
                  {recentFiles.map((node) => {
                    const Icon = getFileIcon(node.name);
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => openFileForUser(node.id)}
                          className="group flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[#007492] dark:focus-visible:ring-[#00e5cc] focus-visible:outline-none cursor-pointer"
                        >
                          <Icon className="size-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity text-slate-600 dark:text-slate-300" />
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#007492] dark:group-hover:text-[#00e5cc] transition-colors text-xs">
                            {node.name}
                          </span>
                          <span className="ml-auto hidden truncate text-[10px] text-slate-400 dark:text-slate-500 sm:block max-w-[130px]">
                            {node.path}
                          </span>
                          <ChevronRight className="size-3 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 text-center flex-1 flex flex-col items-center justify-center">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No recent files yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Create a file or use Ctrl+N to begin editing
                  </p>
                </div>
              )}
            </div>

            {/* Local Storage & Security Card */}
            <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12131a] p-3 flex items-center gap-3 shadow-2xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Local &amp; Private Storage</span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">IndexedDB</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  100% in-browser persistence. Zero tracking, zero telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Features & Capabilities (3x3 grid) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Sparkles className="size-3 text-[#007492] dark:text-[#00e5cc]" />
                Features &amp; Capabilities
              </h2>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                9 Built-in Modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 flex-1 items-stretch">
              {APP_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.title}
                    type="button"
                    onClick={feature.action}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12131a] p-3 text-left transition-all duration-150 hover:border-slate-300 dark:hover:border-white/25 hover:shadow-xs active:scale-[0.99] cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-[#00e5cc] ring-1 ring-slate-200/60 dark:ring-white/10 group-hover:bg-[#181d26] group-hover:text-white dark:group-hover:bg-[#00e5cc] dark:group-hover:text-[#0a0a0f] transition-colors">
                            <Icon className="size-3.5" />
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs truncate leading-tight group-hover:text-[#007492] dark:group-hover:text-[#00e5cc] transition-colors">
                            {feature.title}
                          </span>
                        </div>
                        <span className={`rounded-full border px-1.5 py-0.2 text-[8.5px] font-medium shrink-0 leading-none ${feature.badgeClass}`}>
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {feature.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{APP_BRAND.domain}</span>
            <span>•</span>
            <span>Fast, offline-first notepad with zero install</span>
          </div>
          <div className="flex items-center gap-3">
            <span><kbd className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">Ctrl+N</kbd> New</span>
            <span><kbd className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">Ctrl+O</kbd> Open</span>
            <span><kbd className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">Ctrl+P</kbd> Quick Open</span>
            <span><kbd className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">Ctrl+Shift+P</kbd> Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}
