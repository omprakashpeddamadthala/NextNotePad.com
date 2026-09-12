"use client";

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopMenuProps {
  label: string;
  children: ReactNode;
}

export function TopMenu({ label, children }: TopMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "text-foreground/75 flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium transition-[color,background-color,box-shadow,transform] duration-150 ease-out outline-none",
          "hover:bg-accent hover:text-foreground focus-visible:ring-ring/30 focus-visible:ring-2",
          "data-[state=open]:bg-accent data-[state=open]:text-foreground active:scale-[0.97] data-[state=open]:shadow-xs",
        )}
        aria-label={`${label} menu`}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-64"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
