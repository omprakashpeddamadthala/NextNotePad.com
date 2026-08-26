"use client";

import { Keyboard, Info, BarChart3 } from "lucide-react";
import { TopMenu } from "./TopMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDialogStore } from "@/store/dialogStore";

export function HelpMenu() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <TopMenu label="Help">
      <DropdownMenuItem onSelect={() => openDialog("commandPalette")}>
        <Keyboard /> Keyboard Shortcuts &amp; Commands
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => openDialog("workspaceStats")}>
        <BarChart3 /> Workspace Statistics
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => openDialog("about")}>
        <Info /> About NextNotePad.com
      </DropdownMenuItem>
    </TopMenu>
  );
}
