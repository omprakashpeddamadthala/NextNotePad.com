import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/api/respond";
import { isBlockedHost } from "@/lib/http/ssrfGuard";

// Deliberately unauthenticated (unlike every other API route) — guest mode never touches the
// server at all otherwise, and HTTP Tools is a general utility unrelated to workspace/cloud data,
// not something worth gating behind sign-in. See ssrfGuard.ts for the tradeoff that unlocks.
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
const TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

const httpRequestSchema = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
});

function isTextLikeContentType(contentType: string): boolean {
  return contentType === "" || /^(text\/|application\/(json|xml|javascript|.*\+json|.*\+xml))/i.test(contentType);
}

export async function POST(request: NextRequest) {
  const parsed = httpRequestSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);
  const { method, url, headers, body } = parsed.data;

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "Only http:// and https:// URLs are supported." }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json(
      { error: "Requests to localhost/private network addresses aren't allowed." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();
  const hasBody = method !== "GET" && method !== "HEAD" && Boolean(body);

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? body : undefined,
      signal: controller.signal,
      redirect: "follow",
    });
    const durationMs = Date.now() - startedAt;

    const responseHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const buffer = await upstream.arrayBuffer();
    const truncated = buffer.byteLength > MAX_RESPONSE_BYTES;
    const bytes = truncated ? buffer.slice(0, MAX_RESPONSE_BYTES) : buffer;

    const contentType = upstream.headers.get("content-type") ?? "";
    const isTextLike = isTextLikeContentType(contentType);
    const responseBody = isTextLike
      ? new TextDecoder("utf-8", { fatal: false }).decode(bytes)
      : `[Binary response — ${buffer.byteLength.toLocaleString()} bytes, content-type: ${contentType || "unknown"}]`;

    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: responseBody,
      durationMs,
      truncated,
      isBinary: !isTextLike,
    });
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const message = controller.signal.aborted
      ? `Request timed out after ${TIMEOUT_MS / 1000}s.`
      : err instanceof Error
        ? err.message
        : "Request failed.";
    return NextResponse.json({ error: message, durationMs }, { status: 502 });
  } finally {
    clearTimeout(timeoutHandle);
  }
}
