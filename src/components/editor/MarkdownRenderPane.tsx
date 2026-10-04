"use client";

import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { cn } from "@/lib/utils";

interface MarkdownRenderPaneProps {
  state: "loading" | "error" | "ready";
  error?: unknown;
  html?: string;
  onRetry: () => void;
  skeletonBodyLines?: number;
  centered?: boolean;
  className?: string;
}

export function MarkdownRenderPane({
  state,
  error,
  html,
  onRetry,
  skeletonBodyLines = 6,
  centered = false,
  className,
}: MarkdownRenderPaneProps) {
  if (state === "error") {
    return (
      <LoadFailure error={error} onRetry={onRetry} className={className} />
    );
  }

  if (state === "loading") {
    return (
      <div
        className={cn(
          "animate-in fade-in space-y-4 duration-150 w-full",
          centered ? "mx-auto max-w-3xl" : "max-w-none",
          className,
        )}
      >
        <SkeletonText lines={2} className="max-w-[55%]" />
        <SkeletonText lines={skeletonBodyLines} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "np-markdown-preview np-print-target animate-in fade-in duration-200 w-full",
        centered ? "mx-auto max-w-3xl" : "max-w-none",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
