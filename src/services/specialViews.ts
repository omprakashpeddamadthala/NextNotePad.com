import { useDiffViewStore } from "@/store/diffViewStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";

export function closeAllSpecialViews(): void {
  useDiffViewStore.getState().closeDiff();
  useMarkdownFullPageViewStore.getState().closeFullPage();
}
