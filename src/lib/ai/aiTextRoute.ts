import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api/respond";
import { aiTextRequestSchema } from "@/lib/validation/aiSchemas";
import { AiProviderError } from "./AiProviderError";
import { streamClaudeText } from "./claudeProvider";
import { streamGeminiText } from "./geminiProvider";

const encoder = new TextEncoder();

export function createAiTextRoute(systemInstruction: string) {
  return async function POST(request: NextRequest) {
    const parsed = aiTextRequestSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { text, provider } = parsed.data;

    const streamText = provider === "claude" ? streamClaudeText : streamGeminiText;
    const stream = streamText({ text, systemInstruction });

    let first: IteratorResult<string>;
    try {
      first = await stream.next();
    } catch (err) {
      if (err instanceof AiProviderError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let next = first; !next.done; next = await stream.next()) {
            controller.enqueue(encoder.encode(next.value));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  };
}
