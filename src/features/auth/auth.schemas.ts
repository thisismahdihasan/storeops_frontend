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

export const authResponseSchema = z.object({
  data: z.object({
    user: currentUserSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  name: z.string().trim().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

export const logoutResponseSchema = z.object({
  message: z.string(),
  success: z.literal(true),
});
