import { useDiffViewStore } from "@/store/diffViewStore";
import { useHttpToolsViewStore } from "@/store/httpToolsViewStore";

/** Opens the HTTP Tools view — same on-tab convention as Diff Checker (replaces the editor area
 *  instead of a popup), mutually exclusive with it since both take over the whole area. */
export function openHttpToolsView(): void {
  useDiffViewStore.getState().closeDiff();
  useHttpToolsViewStore.getState().openHttpTools();
}
