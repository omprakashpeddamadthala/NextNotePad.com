import { cn } from "@/lib/utils";

/** Squared-off shimmer placeholder — deliberately not rounded, to match the app's Notepad++
 *  chrome rather than the pill-shaped skeletons shadcn ships by default. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-sm bg-muted-foreground/15", className)}
      {...props}
    />
  );
}

/** Stand-in for a block of text while its content loads — staggered widths so it reads as prose
 *  rather than a solid bar. Used by the editor, markdown preview, and full-page viewer. */
function SkeletonText({ lines = 5, className }: { lines?: number; className?: string }) {
  const widths = ["w-[92%]", "w-[78%]", "w-[85%]", "w-[64%]", "w-[88%]", "w-[71%]"];
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3", widths[i % widths.length])} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
