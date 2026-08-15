import { closeAllSpecialViews } from "@/services/specialViews";
import { useRegexTesterViewStore } from "@/store/regexTesterViewStore";

/** Opens the Regex Tester view — same on-tab convention as Diff Checker, mutually exclusive with
 *  the other special views since they all take over the editor area. */
export function openRegexTesterView(): void {
  closeAllSpecialViews();
  useRegexTesterViewStore.getState().openRegexTester();
}
