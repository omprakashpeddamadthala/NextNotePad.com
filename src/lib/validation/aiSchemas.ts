import { z } from "zod";

export const aiTextRequestSchema = z.object({
  text: z.string().min(1).max(20000),
  provider: z.enum(["gemini", "claude"]).optional().default("gemini"),
});

const secretField = z.string().min(1).nullable().optional();
export const updateAiConfigSchema = z.object({
  geminiApiKey: secretField,
  geminiModel: secretField,
  agentRouterApiKey: secretField,
  claudeModel: secretField,
});
