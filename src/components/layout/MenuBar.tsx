"use client";

import {
  HardDriveDownload,
  Settings2,
  Search,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";

import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { ToolbarButton } from "./ToolbarButton";
import { useDialogStore } from "@/store/dialogStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function MenuBar() {
  const authStatus = useAuthStore((s) => s.status);
  const openDialog = useDialogStore((s) => s.openDialog);

  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toolsRailVisible = useUIStore((s) => s.toolsRailVisible);
  const toggleToolsRail = useUIStore((s) => s.toggleToolsRail);

  const activeTabId = useTabsStore((s) => s.activeTabId);
  const tabs = useTabsStore((s) => s.tabs);
  const nodes = useWorkspaceStore((s) => s.nodes);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = activeTab ? nodes[activeTab.fileId] : null;

  return (
    <TooltipProvider>
      <header
        role="menubar"
        aria-label="Application titlebar and menu"
        className="np-topbar glass-surface relative z-20 flex h-10 shrink-0 items-center justify-between px-2.5 text-xs transition-colors select-none"
        style={{
          background: "var(--np-rail-bg)",
        }}
      >
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => openDialog("about")}
            title="About NextNotePad.com"
            aria-label="About NextNotePad.com"
            className="focus-visible:ring-ring/40 mr-2 flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-all duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1"
          >
            <AppLogo size="sm" showText={false} showDomain={false} />
            <span className="font-heading text-[13px] font-bold tracking-tight text-foreground flex items-center leading-none">
              <span className="np-brand-gradient">Next</span>
              <span>NotePad</span>
              <span className="text-amber-500 font-semibold text-[11px] ml-px">.com</span>
            </span>
          </button>

          <div className="mx-0.5 h-4 w-px bg-border/40" />

          <nav aria-label="Menu bar" className="flex items-center gap-0.5 rounded-lg bg-background/40 border border-border/30 px-1 py-0.5">
            <FileMenu />
            <EditMenu />
            <SearchMenu />
            <ViewMenu />
            <ToolsMenu />
            <EncodingMenu />
            <LanguageMenu />
            <WindowMenu />
            <HelpMenu />
          </nav>
        </div>

        <div className="mx-3 flex min-w-0 flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => openDialog("quickOpen")}
            title="Search files across all workspaces (Ctrl+P)"
            aria-label="Search files across all workspaces"
            className="np-search-pill group flex h-7 w-full max-w-xs sm:max-w-sm items-center justify-between gap-2 px-3 text-[11px] text-muted-foreground cursor-pointer"
          >
            <div className="flex min-w-0 items-center gap-2 truncate">
              <Search className="size-3.5 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" />
              <span className="truncate font-normal">
                {activeNode
                  ? `${activeNode.name} — Search files`
                  : "Search files across workspaces…"}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-[9px] font-mono text-muted-foreground/70">
              Ctrl P
            </kbd>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Toggle Side Bar (Ctrl+B)"
                aria-pressed={sidebarVisible}
                onClick={() => toggleSidebar()}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg border border-border/40 transition-all duration-150 cursor-pointer outline-none",
                  sidebarVisible
                    ? "bg-accent text-foreground shadow-xs"
                    : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/40",
                )}
              >
                <PanelLeft className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Toggle Side Bar (Ctrl+B)
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Developer Toolkit"
                aria-pressed={toolsRailVisible}
                onClick={() => toggleToolsRail()}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-all duration-150 cursor-pointer outline-none border",
                  toolsRailVisible
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-xs"
                    : "border-border/40 text-muted-foreground/70 hover:text-foreground hover:bg-accent/40",
                )}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span className="hidden sm:inline font-medium">Dev Tools</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Toggle Developer Toolkit
            </TooltipContent>
          </Tooltip>

          <ToolbarButton
            icon={Settings2}
            label="Open Settings"
            onClick={() => openDialog("settings")}
          />
          <InstallAppButton />

          {authStatus === "guest" && (
            <span
              className="border-border/40 bg-muted/40 text-muted-foreground hidden lg:flex h-6 items-center gap-1.5 rounded-full border px-2 text-[10px] font-medium"
              title="Guest mode — files stored locally in browser"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 np-glow-dot" />
              <HardDriveDownload className="size-2.5 opacity-60" />
              <span>Guest</span>
            </span>
          )}

          <SyncStatusBadge />
          <AccountMenu />
        </div>
      </header>
    </TooltipProvider>
  );
}
