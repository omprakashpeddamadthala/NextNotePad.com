import { z } from "zod";

export const aiTextRequestSchema = z.object({
  text: z.string().min(1).max(20000),
});

const secretField = z.string().min(1).nullable().optional();
export const updateAiConfigSchema = z.object({
  geminiApiKey: secretField,
  geminiModel: secretField,
});
