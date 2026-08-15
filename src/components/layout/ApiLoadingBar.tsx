"use client";

import { useApiActivityStore } from "@/store/apiActivityStore";

/** Thin indeterminate progress bar pinned to the top of the app, shown whenever a call to the
 *  app's own API is in flight (saving, loading the workspace, syncing Drive...). Indeterminate
 *  rather than percentage-based because these are single requests with no measurable progress —
 *  the point is "something is happening", not "how far along". */
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
      {/* Only animate while visible, so a hidden bar isn't burning a compositor thread. */}
      {visible && <div className="np-indeterminate-bar h-full w-2/5 bg-primary" />}
    </div>
  );
}
