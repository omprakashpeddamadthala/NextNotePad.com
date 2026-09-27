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
          "text-foreground/65 flex h-7 items-center rounded-md px-2 text-[12.5px] font-medium transition-[color,background-color] duration-100 ease-out outline-none",
          "hover:bg-accent hover:text-foreground focus-visible:ring-ring/30 focus-visible:ring-1",
          "data-[state=open]:bg-accent data-[state=open]:text-foreground",
        )}
        aria-label={`${label} menu`}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        className="w-64"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
