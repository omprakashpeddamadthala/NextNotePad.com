import { getEffectiveAiConfig } from "./appConfig";

export interface ClaudeConfig {
  apiKey: string;
  model: string;
}

/** Resolves AgentRouter/Claude config from the DB-backed AppConfig (falling back to env vars),
 *  throwing if either half is still missing — same "unconfigured means a clean error, not a
 *  crash" contract the old env-only version had. Model availability is tied to the specific
 *  AgentRouter key's plan (verified: a key can have access to as little as a single model), so
 *  unlike Gemini there's no safe default to fall back to — an admin (via Settings > AI Config) or
 *  operator (via CLAUDE_MODEL) must set it to whatever their own key actually has access to. */
export async function getClaudeConfig(): Promise<ClaudeConfig> {
  const config = await getEffectiveAiConfig();
  if (!config.agentRouterApiKey || !config.claudeModel) {
    throw new Error("AgentRouter API key and/or Claude model is not configured.");
  }
  return { apiKey: config.agentRouterApiKey, model: config.claudeModel };
}
