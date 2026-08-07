import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

/** Markdown -> sanitized HTML for the preview pane. Client-only (DOMPurify needs `window`) —
 *  only call this from code already gated behind `dynamic(..., { ssr: false })`. */
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
