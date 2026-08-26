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
          "rounded-sm px-2.5 py-1 text-sm text-foreground/90 outline-none transition-colors duration-100",
          "hover:bg-[var(--np-menu-hover)] focus-visible:ring-2 focus-visible:ring-ring",
          "data-[state=open]:bg-[var(--np-menu-hover)]",
        )}
        aria-label={`${label} menu`}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72" onCloseAutoFocus={(e) => e.preventDefault()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
