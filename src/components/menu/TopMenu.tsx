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
          "rounded-md px-2 py-0.5 text-xs font-medium text-foreground/80 outline-none transition-all duration-150",
          "hover:bg-accent/80 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring",
          "data-[state=open]:bg-accent data-[state=open]:text-foreground",
        )}
        aria-label={`${label} menu`}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 shadow-xl backdrop-blur-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
