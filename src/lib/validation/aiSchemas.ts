import { z } from "zod";

export const correctTextSchema = z.object({
  text: z.string().min(1).max(20000),
  // Optional and defaulted so older cached client code (or any caller that omits it) keeps
  // getting today's Gemini-only behavior unchanged.
  provider: z.enum(["gemini", "claude"]).optional().default("gemini"),
});

// Each field: omitted = leave unchanged, null = clear (fall back to the env var default),
// non-empty string = set. Admin-only — see src/lib/auth/admin.ts.
const secretField = z.string().min(1).nullable().optional();
export const updateAiConfigSchema = z.object({
  geminiApiKey: secretField,
  geminiModel: secretField,
  agentRouterApiKey: secretField,
  claudeModel: secretField,
});
