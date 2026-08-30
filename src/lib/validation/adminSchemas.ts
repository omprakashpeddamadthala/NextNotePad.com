import { z } from "zod";

// Both optional so a caller can flip just one flag — at least one must be present (checked below)
// so an empty `{}` body doesn't silently no-op.
export const updateUserSchema = z
  .object({
    isAdmin: z.boolean().optional(),
    blocked: z.boolean().optional(),
  })
  .refine((data) => data.isAdmin !== undefined || data.blocked !== undefined, {
    message: "Provide isAdmin and/or blocked.",
  });
