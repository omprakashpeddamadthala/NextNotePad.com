import { toast } from "sonner";
import { useTabsStore } from "@/store/tabsStore";
import { useDiffViewStore } from "@/store/diffViewStore";
import { closeAllSpecialViews } from "@/services/specialViews";

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
