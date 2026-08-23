import { z } from "zod";

export const correctTextSchema = z.object({
  text: z.string().min(1).max(20000),
});
