"use client";

import { AppWindow } from "lucide-react";
import { TopMenu } from "./TopMenu";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function WindowMenu() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const closeAll = useTabsStore((s) => s.closeAll);
  const nodes = useWorkspaceStore((s) => s.nodes);

  return (
    <TopMenu label="Window">
      {tabs.length === 0 && (
        <DropdownMenuLabel className="font-normal text-muted-foreground">No open windows</DropdownMenuLabel>
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
      {tabs.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => closeAll()}>Close All Windows</DropdownMenuItem>
        </>
      )}
    </TopMenu>
  );
}
