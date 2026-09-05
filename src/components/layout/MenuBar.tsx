"use client";

import { HardDriveDownload } from "lucide-react";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { SettingsMenu } from "@/components/menu/SettingsMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { useAuthStore } from "@/store/authStore";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { WorkspaceDropdown } from "@/components/workspace/WorkspaceDropdown";
import { Separator } from "@/components/ui/separator";

export function MenuBar() {
  const authStatus = useAuthStore((s) => s.status);

  return (
    <nav
      role="menubar"
      aria-label="Application menu"
      className="flex h-8 shrink-0 items-center gap-0.5 border-b bg-background px-1 select-none"
    >
      <div className="np-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden">
        <WorkspaceDropdown />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <FileMenu />
        <EditMenu />
        <SearchMenu />
        <ViewMenu />
        <EncodingMenu />
        <LanguageMenu />
        <ToolsMenu />
        <SettingsMenu />
        <WindowMenu />
        <HelpMenu />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <InstallAppButton />
        {authStatus === "guest" && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HardDriveDownload className="size-3.5" />
            Guest Mode — stored locally
          </span>
        )}
        <SyncStatusBadge />
        <AccountMenu />
      </div>
    </nav>
  );
}
