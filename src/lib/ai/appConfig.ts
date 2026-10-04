import { prisma } from "@/lib/db/prisma";

const SINGLETON_ID = "singleton";

export interface EffectiveAiConfig {
  geminiApiKey: string | null;
  geminiModel: string | null;
  agentRouterApiKey: string | null;
  claudeModel: string | null;
}

export async function getEffectiveAiConfig(): Promise<EffectiveAiConfig> {
  let row = null;
  try {
    row = await prisma.appConfig.findUnique({ where: { id: SINGLETON_ID } });
  } catch (err) {
    console.error("[appConfig] Failed to read AppConfig from database, using env fallback:", err);
  }
  return {
    geminiApiKey: row?.geminiApiKey || process.env.GEMINI_API_KEY || null,
    geminiModel: row?.geminiModel || process.env.GEMINI_MODEL || null,
    agentRouterApiKey: row?.agentRouterApiKey || process.env.AGENTROUTER_API_KEY || null,
    claudeModel: row?.claudeModel || process.env.CLAUDE_MODEL || null,
  };
}

export interface AiConfigStatus {
  gemini: { apiKeyConfigured: boolean; model: string | null };
}

export async function getAiConfigStatus(): Promise<AiConfigStatus> {
  const effective = await getEffectiveAiConfig();
  return {
    gemini: { apiKeyConfigured: Boolean(effective.geminiApiKey), model: effective.geminiModel },
  };
}

export interface AiConfigUpdate {
  geminiApiKey?: string | null;
  geminiModel?: string | null;
  agentRouterApiKey?: string | null;
  claudeModel?: string | null;
}

export async function updateAiConfig(patch: AiConfigUpdate): Promise<void> {
  try {
    await prisma.appConfig.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...patch },
      update: patch,
    });
  } catch (err) {
    console.error("[appConfig] Failed to upsert AppConfig in database:", err);
    throw err;
  }
}
