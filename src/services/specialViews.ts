import { useDiffViewStore } from "@/store/diffViewStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";

/** These on-tab views all replace the same editor area, so only one can be open at a time —
 *  each view's own "open" function calls this first to close whatever else might be showing. */
export function closeAllSpecialViews(): void {
  useDiffViewStore.getState().closeDiff();
  useMarkdownFullPageViewStore.getState().closeFullPage();
}
