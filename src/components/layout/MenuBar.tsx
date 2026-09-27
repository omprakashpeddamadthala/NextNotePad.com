"use client";

import { HardDriveDownload, Settings2 } from "lucide-react";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { useAuthStore } from "@/store/authStore";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { WorkspaceDropdown } from "@/components/workspace/WorkspaceDropdown";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/ui/AppLogo";
import { ToolbarButton } from "./ToolbarButton";
import { useDialogStore } from "@/store/dialogStore";

export function MenuBar() {
  const authStatus = useAuthStore((s) => s.status);
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <nav
      role="menubar"
      aria-label="Application menu"
      className="np-topbar glass-surface relative z-20 flex h-10 shrink-0 items-center gap-0 border-b px-2 transition-colors select-none"
    >
      {/* Brand logo & workspace selector */}
      <button
        type="button"
        onClick={() => openDialog("about")}
        title="About NextNotePad.com"
        aria-label="About NextNotePad"
        className="focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded-md cursor-pointer mr-1.5 flex items-center"
      >
        <AppLogo
          size="sm"
          showText
          showDomain
          className="[&>div:last-child]:hidden xl:[&>div:last-child]:flex hover:opacity-85 transition-opacity"
        />
      </button>
      <WorkspaceDropdown />
      <Separator orientation="vertical" className="mx-2 h-4 opacity-40" />

      {/* Application menus */}
      <div className="np-scrollbar flex min-w-0 flex-1 items-center gap-0 overflow-x-auto overflow-y-hidden">
        <FileMenu />
        <EditMenu />
        <SearchMenu />
        <ViewMenu />
        <EncodingMenu />
        <LanguageMenu />
        <ToolsMenu />
        <WindowMenu />
        <HelpMenu />
      </div>

      {/* Right side: status indicators and account */}
      <div className="ml-auto flex shrink-0 items-center gap-1 pl-2 border-l border-border/60">
        <ToolbarButton
          icon={Settings2}
          label="Open Settings"
          onClick={() => openDialog("settings")}
        />
        <InstallAppButton />
        {authStatus === "guest" && (
          <span
            className="border-border/60 bg-muted/60 text-muted-foreground flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium"
            title="Guest mode — files are stored in this browser"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <HardDriveDownload className="size-3 opacity-70" />
            <span className="hidden xl:inline">Guest</span>
          </span>
        )}
        <SyncStatusBadge />
        <AccountMenu />
      </div>
    </nav>
  );
}
