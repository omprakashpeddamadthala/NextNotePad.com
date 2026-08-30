"use client";

import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { cn } from "@/lib/utils";

interface MarkdownRenderPaneProps {
  state: "loading" | "error" | "ready";
  error?: unknown;
  html?: string;
  onRetry: () => void;
  /** Body skeleton line count — the side-by-side preview and the full-page view have different
   *  amounts of vertical room, so each picks its own. */
  skeletonBodyLines?: number;
  /** The side-by-side preview centers its column against the editor next to it; the full-page
   *  view owns the whole pane and left-aligns instead. */
  centered?: boolean;
  className?: string;
}

/** The rendered-markdown body shared by MarkdownPreview and MarkdownFullPageView: loading
 *  skeleton, load failure with retry, or the rendered HTML. The two callers fetch content
 *  differently (MarkdownPreview needs live reactive updates as you type; MarkdownFullPageView
 *  takes a one-time snapshot since it's never shown alongside a live editor) and have different
 *  headers, so only this shared body is factored out rather than the whole component. */
export function MarkdownRenderPane({
  state,
  error,
  html,
  onRetry,
  skeletonBodyLines = 6,
  centered = true,
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
          "animate-in fade-in space-y-4 duration-150",
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
        "np-markdown-preview np-print-target animate-in fade-in duration-200",
        centered ? "mx-auto max-w-3xl" : "max-w-none",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
