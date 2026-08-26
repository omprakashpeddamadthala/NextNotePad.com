import { NextRequest, NextResponse } from "next/server";
import { streamAiCorrection, isProviderConfigured } from "@/lib/ai/aiProvider";
import { AiProviderError } from "@/lib/ai/AiProviderError";
import { correctTextSchema } from "@/lib/validation/aiSchemas";
import { badRequest } from "@/lib/api/respond";

const SYSTEM_INSTRUCTION =
  "You are a Markdown formatting engine embedded in a text editor. Read the user's text, " +
  "understand its structure and meaning, then rewrite it as clean, well-organized Markdown. Use " +
  "headings for titles and sections, bullet or numbered lists for enumerations, **bold**/*italic* " +
  "for emphasis, `inline code` and fenced code blocks for code or commands, > blockquotes for " +
  "quoted material, and Markdown tables when the content is tabular. Preserve the original " +
  "meaning, facts, and language — only restructure and format it, never invent or remove " +
  "information. Respond with only the resulting Markdown and nothing else: no preamble, no " +
  "explanation, no quotes around it, no code fence wrapping the whole answer.";

function respondToProviderError(err: unknown): NextResponse {
  if (err instanceof AiProviderError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

/** Same shape and streaming approach as /api/ai/correct — see that route for the rationale on
 *  no auth gate and priming the first chunk before returning the Response. This route reuses
 *  `correctTextSchema` (its `{ text, provider }` shape isn't correction-specific) and the same
 *  generic `streamAiCorrection` provider call, swapping in a Markdown-formatting system prompt. */
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
