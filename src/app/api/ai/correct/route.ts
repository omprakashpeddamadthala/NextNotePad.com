import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/geminiClient";
import { correctTextSchema } from "@/lib/validation/aiSchemas";
import { badRequest } from "@/lib/api/respond";

const SYSTEM_INSTRUCTION =
  "You are a precise proofreading engine embedded in a text editor. Fix grammar, spelling, and " +
  "punctuation errors in the user's text. Preserve the original meaning, tone, language, and " +
  "formatting exactly — including Markdown syntax, line breaks, indentation, and code blocks. " +
  "Do not rewrite for style, add content, or remove content unless it is an actual error. " +
  "Respond with only the corrected text and nothing else: no preamble, no explanation, no quotes " +
  "around it, no markdown code fence wrapping the whole answer.";

/** Maps a failed Gemini call to the same status codes/messages regardless of whether it failed
 *  before the stream opened or while priming its first chunk — the two call sites this covers. */
function respondToGenAiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return NextResponse.json(
        { error: "AI correction is misconfigured (invalid API key)." },
        { status: 503 },
      );
    }
    if (err.status === 429) {
      return NextResponse.json(
        { error: "The AI service is rate-limited right now — try again shortly." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: `AI request failed: ${err.message}` },
      { status: 502 },
    );
  }
  throw err;
}

/** No auth gate — the app's guest mode (no account, local-only storage) is the default way
 *  people use NextNotePad, and this is the one feature that needs a server round-trip. Abuse
 *  exposure is bounded by Gemini's own per-key free-tier rate limit, not by this route.
 *
 *  Streams the correction back as plain text as Gemini generates it — free-tier latency here
 *  can run into the tens of seconds, and showing corrected text arrive progressively reads as
 *  far more responsive than a single multi-second blocking wait. */
export async function POST(request: NextRequest) {
  const parsed = correctTextSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  let client: ReturnType<typeof getGeminiClient>;
  try {
    client = getGeminiClient();
  } catch {
    return NextResponse.json(
      { error: "AI correction isn't configured on this server." },
      { status: 503 },
    );
  }

  let stream: AsyncGenerator<GenerateContentResponse>;
  try {
    stream = await client.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: parsed.data.text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: 8192,
        // Flash defaults to "thinking" mode on, which burns several seconds of hidden reasoning
        // tokens a straight proofread never needs. gemini-3.6-flash rejects budget 0 outright
        // (400 INVALID_ARGUMENT); 1 is the smallest budget the API accepts and still collapses
        // thinking to effectively nothing.
        thinkingConfig: { thinkingBudget: 1 },
      },
    });
  } catch (err) {
    return respondToGenAiError(err);
  }

  // Once the Response below is returned, the status code is committed — a mid-stream failure
  // can no longer become a 429/502/etc. Priming the first chunk here keeps setup-time failures
  // (bad key, invalid argument, rate limit) mapped to their real status instead of degrading
  // into a 200 stream that immediately errors out.
  let first: IteratorResult<GenerateContentResponse>;
  try {
    first = await stream.next();
  } catch (err) {
    return respondToGenAiError(err);
  }

  const encoder = new TextEncoder();
  let sentAnyText = false;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      function enqueue(chunk: GenerateContentResponse) {
        const text = chunk.text;
        if (!text) return;
        sentAnyText = true;
        controller.enqueue(encoder.encode(text));
      }

      try {
        if (!first.done) enqueue(first.value);
        while (true) {
          const next = await stream.next();
          if (next.done) break;
          enqueue(next.value);
        }
        if (!sentAnyText) {
          controller.error(new Error("The AI didn't return any text."));
          return;
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
