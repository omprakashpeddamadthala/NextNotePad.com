"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** "touch" pins a finger-sized target with no `sm:` shrink — for MobileAppBar, which (per
   *  useIsMobile's 767px cutoff) can render as narrow as 640px, the point at which the default
   *  size's `sm:size-7` would otherwise kick in and shrink an on-screen touch target.
   *  "compact" is for rows with several buttons crammed alongside a text label (the Explorer
   *  header) where the default size truncates the label at common laptop/split-screen widths. */
  size?: "default" | "touch" | "compact";
}

export function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  size = "default",
}: ToolbarButtonProps) {
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
            "text-muted-foreground hover:text-foreground shrink-0 rounded-lg transition-all duration-150 ease-out active:scale-[0.93]",
            size === "touch"
              ? "size-11"
              : size === "compact"
                ? "size-6"
                : "size-7",
            active &&
              "bg-primary/10 text-primary ring-primary/25 ring-1",
          )}
        >
          <Icon className={cn(
            "transition-none",
            size === "compact" ? "size-3.5" : "size-[15px]",
          )} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
