import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

/** Markdown -> sanitized HTML for the preview pane. Client-only (DOMPurify needs `window`) —
 *  only call this from code already gated behind `dynamic(..., { ssr: false })`. */
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  // DOMPurify strips data: URIs from src by default. Allow data:image/* so that
  // base64-embedded images inserted by the editor render correctly in the preview.
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ["src"],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|ftp|tel|callto|cid|xmpp|data:image\/(?:png|jpe?g|gif|webp|svg\+xml|bmp|ico|tiff?)):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
