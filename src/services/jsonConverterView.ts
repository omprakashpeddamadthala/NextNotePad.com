import { closeAllSpecialViews } from "@/services/specialViews";
import { useJsonConverterViewStore } from "@/store/jsonConverterViewStore";

/** Opens the JSON Converter view — same on-tab convention as Diff Checker, mutually exclusive
 *  with the other special views since they all take over the editor area. */
export function openJsonConverterView(): void {
  closeAllSpecialViews();
  useJsonConverterViewStore.getState().openJsonConverter();
}
