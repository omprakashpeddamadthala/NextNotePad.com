import { useDiffViewStore } from "@/store/diffViewStore";
import { useRegexTesterViewStore } from "@/store/regexTesterViewStore";
import { useJsonConverterViewStore } from "@/store/jsonConverterViewStore";

/** Diff Checker, Regex Tester, and JSON Converter all take over the whole editor area instead of
 *  opening a popup — so opening one must close the others, or a closed-but-still-"open" view
 *  would be sitting hidden behind whichever is showing. Each view's own open action calls this
 *  first. */
export function closeAllSpecialViews(): void {
  useDiffViewStore.getState().closeDiff();
  useRegexTesterViewStore.getState().closeRegexTester();
  useJsonConverterViewStore.getState().closeJsonConverter();
}
