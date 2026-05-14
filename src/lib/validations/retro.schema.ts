import { z } from "zod";

export const createRetroSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  timerMinutes: z.number().int().min(1).max(60),
  votesPerUser: z.number().int().min(1).max(20).default(3),
  sendSummaryMail: z.boolean().default(true),
});

export type CreateRetroInput = z.infer<typeof createRetroSchema>;

export const addCardSchema = z.object({
  column: z.enum(["mad", "sad", "glad"]),
  content: z.string().min(1, "Content is required").max(2000),
  sessionId: z.string().min(1, "Session ID is required"),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

export const updatePhaseSchema = z.object({
  phase: z.enum(["write", "vote", "actions", "closed"]),
});

export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;

export const updateGroupsSchema = z.object({
  groups: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(200),
      cardIds: z.array(z.string().min(1)),
    }),
  ).min(1, "At least one group is required"),
});

export type UpdateGroupsInput = z.infer<typeof updateGroupsSchema>;

export const castVoteSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;
