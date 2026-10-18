"use client";

import { AppWindow, Lock } from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useLockStore } from "@/store/lockStore";
import { useDialogStore } from "@/store/dialogStore";

export function WindowMenu() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const nodes = useWorkspaceStore((s) => s.nodes);

  return (
    <TopMenu label="Window">
      <DropdownMenuItem
        onSelect={() => {
          const lockStore = useLockStore.getState();
          if (lockStore.enabled) {
            void lockStore.lock();
          } else {
            useDialogStore.getState().openDialog("settings");
          }
        }}
      >
        <Lock /> Lock Application
        <DropdownMenuShortcut>Ctrl+Alt+L</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {tabs.length === 0 && (
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          No open windows
        </DropdownMenuLabel>
      )}
      {tabs.map((tab) => {
        const node = nodes[tab.fileId];
        return (
          <DropdownMenuItem
            key={tab.id}
            onSelect={() => setActiveTab(tab.id)}
            className={tab.id === activeTabId ? "bg-accent" : ""}
          >
            <AppWindow /> {node?.name ?? "Untitled"}
          </DropdownMenuItem>
        );
      })}
    </TopMenu>
  );
}
