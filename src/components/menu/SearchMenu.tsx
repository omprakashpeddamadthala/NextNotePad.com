"use client";

import { Search, Replace, Navigation, FolderSearch, Command as CommandIcon } from "lucide-react";
import { TopMenu } from "./TopMenu";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import { SHORTCUT_BY_ACTION } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";

export function SearchMenu() {
  return (
    <TopMenu label="Search">
      <DropdownMenuItem onSelect={() => runAction("search.find")}>
        <Search /> Find
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["search.find"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("search.replace")}>
        <Replace /> Replace
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["search.replace"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("search.goToLine")}>
        <Navigation /> Go To Line
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["search.goToLine"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("search.findInFiles")}>
        <FolderSearch /> Find in Files (Workspace)
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["search.findInFiles"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("search.quickOpen")}>
        <CommandIcon /> Quick Open
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["search.quickOpen"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
    </TopMenu>
  );
}
