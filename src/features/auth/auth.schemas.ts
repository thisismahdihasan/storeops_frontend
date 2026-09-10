import { z } from "zod";

export const currentUserSchema = z.object({
  createdAt: z.string(),
  email: z.string().email(),
  id: z.string().min(1),
  name: z.string().nullable(),
});

export const currentSessionResponseSchema = z.object({
  data: z.object({
    user: currentUserSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});
