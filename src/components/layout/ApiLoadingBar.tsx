"use client";

import { useApiActivityStore } from "@/store/apiActivityStore";

export function ApiLoadingBar() {
  const visible = useApiActivityStore((s) => s.visible);

  return (
    <div
      aria-hidden={!visible}
      role="progressbar"
      aria-label="Loading"
      aria-busy={visible}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {visible && <div className="np-indeterminate-bar h-full w-2/5" />}
    </div>
  );
}
