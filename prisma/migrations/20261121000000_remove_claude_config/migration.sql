-- Gemini is the only AI provider; drop the old Claude (AgentRouter) settings.
ALTER TABLE "AppConfig" DROP COLUMN IF EXISTS "agentRouterApiKey";
ALTER TABLE "AppConfig" DROP COLUMN IF EXISTS "claudeModel";
