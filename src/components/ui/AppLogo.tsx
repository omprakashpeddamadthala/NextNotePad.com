"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_BRAND } from "@/lib/constants/branding";

export interface AppLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  showText?: boolean;
  showDomain?: boolean;
  showTagline?: boolean;
  taglineText?: string;
  badge?: string;
  layout?: "horizontal" | "vertical";
  priority?: boolean;
  className?: string;
  iconClassName?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: "size-4 rounded-xs",
  sm: "size-5 rounded-md",
  md: "size-7 rounded-md",
  lg: "size-10 rounded-xl",
  xl: "size-14 rounded-2xl",
  "2xl": "size-20 rounded-2xl",
};

const PIXEL_MAP: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
  "2xl": 80,
};

export function AppLogo({
  size = "sm",
  showText = false,
  showDomain = false,
  showTagline = false,
  taglineText,
  badge,
  layout = "horizontal",
  priority = false,
  className,
  iconClassName,
}: AppLogoProps) {
  const isNumber = typeof size === "number";
  const px = isNumber ? size : (PIXEL_MAP[size] ?? 20);
  const sizeClass = isNumber ? undefined : (SIZE_MAP[size] ?? "size-5 rounded-md");
  const style = isNumber ? { width: `${size}px`, height: `${size}px` } : undefined;

  const resolvedTagline = taglineText ?? (layout === "vertical" ? APP_BRAND.tagline : APP_BRAND.shortTagline);

  return (
    <div
      className={cn(
        "select-none",
        layout === "vertical"
          ? "flex flex-col items-center text-center gap-2.5"
          : "inline-flex items-center gap-2.5",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden shadow-xs ring-1 ring-white/15 bg-[#121316] transition-transform duration-200",
          sizeClass,
          iconClassName,
        )}
        style={style}
      >
        <Image
          src="/logo.png"
          alt={APP_BRAND.name}
          width={px}
          height={px}
          className="size-full object-cover"
          priority={priority || size === "lg" || size === "xl" || size === "2xl"}
        />
      </div>

      {(showText || showTagline || badge) && (
        <div
          className={cn(
            "flex flex-col",
            layout === "vertical" ? "items-center text-center" : "items-start text-left",
          )}
        >
          {showText && (
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-heading font-semibold tracking-tight text-foreground text-sm sm:text-base">
                {APP_BRAND.name}
                {showDomain && <span className="text-primary font-medium text-xs">.com</span>}
              </span>
              {badge && (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </div>
          )}
          {showTagline && (
            <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-snug mt-0.5 max-w-sm">
              {resolvedTagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

