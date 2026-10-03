"use client";

import {
  Terminal,
  Search,
  PanelBottom,
  Play,
  Sparkles,
} from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/store/uiStore";
import { runAction } from "@/services/shortcuts/actionRegistry";

export function TerminalMenu() {
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const setActiveBottomTab = useUIStore((s) => s.setActiveBottomTab);

  const openTerminal = () => {
    setActiveBottomTab("console");
    setBottomPanelVisible(true);
  };

  const togglePanel = () => {
    setBottomPanelVisible(!bottomPanelVisible);
  };

  const openSearchPanel = () => {
    setActiveBottomTab("search");
    setBottomPanelVisible(true);
  };

  return (
    <TopMenu label="Terminal">
      <DropdownMenuItem onSelect={openTerminal}>
        <Terminal className="size-4" /> New Terminal / Console
        <DropdownMenuShortcut>Ctrl+`</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={togglePanel}>
        <PanelBottom className="size-4" /> Toggle Terminal Panel
        <DropdownMenuShortcut>Ctrl+J</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={openSearchPanel}>
        <Search className="size-4" /> Find in Files Panel
        <DropdownMenuShortcut>Ctrl+Shift+F</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.formatDocument")}>
        <Play className="size-4" /> Run Formatter / Task
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.base64Encode")}>
        <Sparkles className="size-4" /> Run Developer Action
      </DropdownMenuItem>
    </TopMenu>
  );
}
