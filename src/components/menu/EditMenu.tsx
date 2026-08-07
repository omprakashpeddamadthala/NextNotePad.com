"use client";

import { Undo2, Redo2, Scissors, Copy, Clipboard, TextCursorInput, Rows3, CopyPlus, Braces } from "lucide-react";
import { TopMenu } from "./TopMenu";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import { SHORTCUT_BY_ACTION } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";

export function EditMenu() {
  return (
    <TopMenu label="Edit">
      <DropdownMenuItem onSelect={() => runAction("edit.undo")}>
        <Undo2 /> Undo
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.undo"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.redo")}>
        <Redo2 /> Redo
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.redo"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("edit.cut")}>
        <Scissors /> Cut
        <DropdownMenuShortcut>Ctrl+X</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.copy")}>
        <Copy /> Copy
        <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.paste")}>
        <Clipboard /> Paste
        <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.selectAll")}>
        <TextCursorInput /> Select All
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.selectAll"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("edit.deleteLine")}>
        <Rows3 /> Delete Line
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.deleteLine"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("edit.duplicateLine")}>
        <CopyPlus /> Duplicate Line
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.duplicateLine"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("edit.formatDocument")}>
        <Braces /> Format Document / Selection
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["edit.formatDocument"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
    </TopMenu>
  );
}
