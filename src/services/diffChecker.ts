import { toast } from "sonner";
import { useTabsStore } from "@/store/tabsStore";
import { useDiffViewStore } from "@/store/diffViewStore";
import { closeAllSpecialViews } from "@/services/specialViews";

/** Opens the diff view comparing the active tab against another open tab (the next one in the
 *  strip) — the Tools menu, toolbar, and command palette's "Diff Checker" all funnel through this
 *  so a default pairing exists without making the user pick two tabs first. Explicitly picking
 *  the second tab is still available via a tab's right-click "Compare with Active Tab". */
export function openDiffCheckerForActiveTab(): void {
  const { tabs, activeTabId } = useTabsStore.getState();
  if (!activeTabId || tabs.length < 2) {
    toast.error("Open a second tab to use the Diff Checker.");
    return;
  }
  const other = tabs.find((t) => t.id !== activeTabId);
  if (!other) return;
  closeAllSpecialViews();
  useDiffViewStore.getState().openDiff(activeTabId, other.id);
}
