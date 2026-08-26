import { prisma } from "@/lib/db/prisma";

const SINGLETON_ID = "singleton";

export interface EffectiveAiConfig {
  geminiApiKey: string | null;
  geminiModel: string | null;
  agentRouterApiKey: string | null;
  claudeModel: string | null;
}

/** Reads the DB-backed AppConfig row, falling back to env vars for any field left unset there —
 *  so a deployment that never opens Settings > AI Config behaves exactly as if this table didn't
 *  exist. Deliberately uncached: this is admin-editable and low-traffic, so a fresh read on every
 *  call means a key rotated via the UI takes effect on the very next request, not after a
 *  server restart. */
export async function getEffectiveAiConfig(): Promise<EffectiveAiConfig> {
  const row = await prisma.appConfig.findUnique({ where: { id: SINGLETON_ID } });
  return {
    geminiApiKey: row?.geminiApiKey || process.env.GEMINI_API_KEY || null,
    geminiModel: row?.geminiModel || process.env.GEMINI_MODEL || null,
    agentRouterApiKey: row?.agentRouterApiKey || process.env.AGENTROUTER_API_KEY || null,
    claudeModel: row?.claudeModel || process.env.CLAUDE_MODEL || null,
  };
}

export interface AiConfigStatus {
  gemini: { apiKeyConfigured: boolean; model: string | null };
  claude: { apiKeyConfigured: boolean; model: string | null };
}

/** Status view for the admin UI — booleans and (non-secret) model ids only, never the keys
 *  themselves, whether they came from the DB or an env var. */
export async function getAiConfigStatus(): Promise<AiConfigStatus> {
  const effective = await getEffectiveAiConfig();
  return {
    gemini: { apiKeyConfigured: Boolean(effective.geminiApiKey), model: effective.geminiModel },
    claude: { apiKeyConfigured: Boolean(effective.agentRouterApiKey), model: effective.claudeModel },
  };
}

export interface AiConfigUpdate {
  geminiApiKey?: string | null;
  geminiModel?: string | null;
  agentRouterApiKey?: string | null;
  claudeModel?: string | null;
}

/** Applies a partial update to the singleton row. A field left `undefined` is untouched (Prisma
 *  skips undefined keys in update/create data); `null` explicitly clears it back to falling
 *  through to its env var default; a string sets it. */
export async function updateAiConfig(patch: AiConfigUpdate): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...patch },
    update: patch,
  });
}
