import { NextRequest, NextResponse } from "next/server";
import { streamAiCorrection, isProviderConfigured } from "@/lib/ai/aiProvider";
import { AiProviderError } from "@/lib/ai/AiProviderError";
import { correctTextSchema } from "@/lib/validation/aiSchemas";
import { badRequest } from "@/lib/api/respond";

const SYSTEM_INSTRUCTION =
  "You are a prompt-engineering assistant embedded in a text editor. Read the user's text, " +
  "understand its context, intent, and key details, then turn it into a single well-structured " +
  "prompt suitable for giving to an AI assistant. The prompt should state the task clearly, " +
  "carry forward the concrete details, constraints, and goals implied by the original text, and " +
  "specify the desired output format when one is implied. Do not answer or fulfill the task " +
  "yourself — only produce the prompt that would ask for it. Respond with only the generated " +
  "prompt and nothing else: no preamble, no explanation, no quotes around it, no code fence " +
  "wrapping the whole answer.";

function respondToProviderError(err: unknown): NextResponse {
  if (err instanceof AiProviderError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

/** Same shape and streaming approach as /api/ai/correct and /api/ai/markdown — see /api/ai/correct
 *  for the rationale on no auth gate and priming the first chunk before returning the Response. */
export async function POST(request: NextRequest) {
  const parsed = correctTextSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);
  const { text, provider } = parsed.data;

  if (!(await isProviderConfigured(provider))) {
    const label = provider === "claude" ? "Claude (AgentRouter)" : "Gemini";
    return NextResponse.json({ error: `${label} isn't configured on this server.` }, { status: 503 });
  }

  const stream = streamAiCorrection({ provider, text, systemInstruction: SYSTEM_INSTRUCTION });

  let first: IteratorResult<string>;
  try {
    first = await stream.next();
  } catch (err) {
    return respondToProviderError(err);
  }

  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        while (true) {
          const next = await stream.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
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
