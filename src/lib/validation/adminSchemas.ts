import { z } from "zod";

export const updateUserSchema = z
  .object({
    isAdmin: z.boolean().optional(),
    blocked: z.boolean().optional(),
  })
  .refine((data) => data.isAdmin !== undefined || data.blocked !== undefined, {
    message: "Provide isAdmin and/or blocked.",
  });
