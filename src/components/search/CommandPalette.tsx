"use client";

import { Fragment } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { useDialogStore } from "@/store/dialogStore";
import { PALETTE_COMMAND_GROUPS, type PaletteCommand } from "@/services/shortcuts/paletteCommands";

export function CommandPalette() {
  const open = useDialogStore((s) => s.open.commandPalette);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);
  const setOpen = (v: boolean) => setDialogOpen("commandPalette", v);

  function handleSelect(cmd: PaletteCommand) {
    setOpen(false);
    cmd.run();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        {PALETTE_COMMAND_GROUPS.map(([category, categoryCommands], i) => (
          <Fragment key={category}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {categoryCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.category}`} onSelect={() => handleSelect(cmd)}>
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
