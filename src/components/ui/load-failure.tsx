"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isOfflineError } from "@/lib/api/fetchJson";

export function LoadFailure({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const offline = isOfflineError(error);
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong loading this.";

  return (
    <div
      role="alert"
      className={cn(
        "text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm",
        className,
      )}
    >
      {offline ? (
        <WifiOff className="text-muted-foreground/70 size-7" />
      ) : (
        <AlertTriangle className="text-warning size-7" />
      )}
      <p className="max-w-sm">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Try Again
        </Button>
      )}
    </div>
  );
}
