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
  xs: "size-4 rounded-[5px]",
  sm: "size-5 rounded-[6px]",
  md: "size-7 rounded-[8px]",
  lg: "size-10 rounded-[12px]",
  xl: "size-14 rounded-[16px]",
  "2xl": "size-20 rounded-[22px]",
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
  const sizeClass = isNumber ? undefined : (SIZE_MAP[size] ?? "size-5 rounded-[6px]");
  const style = isNumber
    ? { width: `${size}px`, height: `${size}px` }
    : undefined;

  const resolvedTagline =
    taglineText ??
    (layout === "vertical" ? APP_BRAND.tagline : APP_BRAND.shortTagline);

  return (
    <div
      className={cn(
        "select-none",
        layout === "vertical"
          ? "flex flex-col items-center text-center gap-2.5"
          : "inline-flex items-center gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden transition-all duration-200",
          "shadow-sm shadow-black/25",
          sizeClass,
          iconClassName,
        )}
        style={style}
      >
        <Image
          src="/icon-512.png"
          alt={`${APP_BRAND.name} logo`}
          width={px}
          height={px}
          className="size-full object-cover"
          priority={
            priority ||
            size === "lg" ||
            size === "xl" ||
            size === "2xl"
          }
        />
      </div>

      {(showText || showTagline || badge) && (
        <div
          className={cn(
            "flex flex-col",
            layout === "vertical"
              ? "items-center text-center"
              : "items-start text-left",
          )}
        >
          {showText && (
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-semibold tracking-tight text-foreground text-sm sm:text-[15px] leading-none">
                {APP_BRAND.name}
                {showDomain && (
                  <span className="text-[#F59E0B] font-medium text-[11px] align-super ml-px">
                    .com
                  </span>
                )}
              </span>
              {badge && (
                <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500 uppercase tracking-wide leading-none">
                  {badge}
                </span>
              )}
            </div>
          )}
          {showTagline && (
            <p className="text-[10.5px] sm:text-[11px] text-muted-foreground/70 leading-snug mt-0.5 max-w-sm">
              {resolvedTagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

