"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
  xl: "size-14",
};

const PIXEL_MAP: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 40,
  xl: 56,
};

export function AppLogo({ size = "sm", showText = false, className }: AppLogoProps) {
  const isNumber = typeof size === "number";
  const px = isNumber ? size : (PIXEL_MAP[size] ?? 20);
  const sizeClass = isNumber ? undefined : (SIZE_MAP[size] ?? "size-5");
  const style = isNumber ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <div
        className={cn("relative shrink-0 overflow-hidden rounded-md shadow-xs ring-1 ring-white/10", sizeClass)}
        style={style}
      >
        <Image
          src="/logo.png"
          alt="NextNotePad"
          width={px}
          height={px}
          className="size-full object-cover"
          priority
        />
      </div>
      {showText && (
        <span className="font-heading text-xs font-semibold tracking-tight text-foreground flex items-center gap-1">
          <span>NextNotePad</span>
        </span>
      )}
    </div>
  );
}
