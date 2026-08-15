"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function ToolbarButton({ icon: Icon, label, onClick, active, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            // Touch targets stay finger-sized on phones and tighten to Notepad++ proportions on
            // desktop, where the pointer is precise and the strip should stay compact.
            "size-8 shrink-0 transition-colors duration-100 sm:size-7",
            active && "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
