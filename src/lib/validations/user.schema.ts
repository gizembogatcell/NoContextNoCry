import { z } from "zod";

export const upsertUserSchema = z.object({
  displayName: z.string().min(1).max(120).nullable().optional(),
  photoURL: z.string().url().nullable().optional(),
});

export type UpsertUserInput = z.infer<typeof upsertUserSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userProfileResponseSchema = z.object({
  data: userProfileSchema,
});
