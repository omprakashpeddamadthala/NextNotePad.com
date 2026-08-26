import type { AiProvider } from "@/types/settings";
import { getEffectiveAiConfig } from "./appConfig";
import { streamGeminiCorrection } from "./geminiProvider";
import { streamClaudeCorrection } from "./claudeProvider";

export type { AiProvider };

/** Single entry point the API route calls through — picks the right backend and returns the same
 *  AsyncGenerator<string> shape regardless of which one it is, so the route never needs to know
 *  Gemini and Claude exist as two different SDKs with two different wire formats. */
export function streamAiCorrection(params: {
  provider: AiProvider;
  text: string;
  systemInstruction: string;
}): AsyncGenerator<string> {
  const { provider, text, systemInstruction } = params;
  return provider === "claude"
    ? streamClaudeCorrection({ text, systemInstruction })
    : streamGeminiCorrection({ text, systemInstruction });
}

export async function isProviderConfigured(provider: AiProvider): Promise<boolean> {
  const config = await getEffectiveAiConfig();
  return provider === "claude"
    ? Boolean(config.agentRouterApiKey && config.claudeModel)
    : Boolean(config.geminiApiKey);
}
