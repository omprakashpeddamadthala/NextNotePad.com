"use client";

import { ChevronRight } from "lucide-react";
import { useActiveFile } from "@/hooks/useActiveFile";
import { getBreadcrumbSegments } from "@/lib/utils/pathUtils";

export function Breadcrumb() {
  const { file } = useActiveFile();
  if (!file) return <div className="h-6 shrink-0 border-b px-2" />;

  const segments = getBreadcrumbSegments(file.path);

  return (
    <div className="flex h-6 shrink-0 items-center gap-1 overflow-x-auto border-b px-2 text-xs text-muted-foreground">
      {segments.map((seg, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" />}
          <span className={i === segments.length - 1 ? "text-foreground" : ""}>{seg}</span>
        </span>
      ))}
    </div>
  );
}
