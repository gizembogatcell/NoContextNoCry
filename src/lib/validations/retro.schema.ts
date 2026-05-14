import { z } from "zod";

export const createRetroSchema = z.object({
  title: z.string().min(1, "Retro adı gereklidir").max(200),
  timerMinutes: z.number().int().min(1).max(60).default(5),
  votesPerUser: z.number().int().min(1).max(10).default(3),
});

export type CreateRetroInput = z.infer<typeof createRetroSchema>;

export const updatePhaseSchema = z.object({
  phase: z.enum(["write", "vote", "actions", "closed"]),
  startTimer: z.boolean().optional(),
});

export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;

export const addCardSchema = z.object({
  column: z.enum(["mad", "sad", "glad"]),
  content: z.string().min(1, "Not içeriği gereklidir").max(1000),
  sessionId: z.string().min(1, "Session ID gereklidir"),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

export const voteSchema = z.object({
  sessionId: z.string().min(1, "Session ID gereklidir"),
});

export type VoteInput = z.infer<typeof voteSchema>;

export const retroResponseSchema = z.object({
  data: z.object({
    _id: z.string(),
    title: z.string(),
    phase: z.enum(["write", "vote", "actions", "closed"]),
    votesPerUser: z.number(),
    timerMinutes: z.number(),
    timerEndsAt: z.string().nullable(),
    createdBy: z.string(),
    teamId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const retroListResponseSchema = z.object({
  data: z.array(
    z.object({
      _id: z.string(),
      title: z.string(),
      phase: z.enum(["write", "vote", "actions", "closed"]),
      timerMinutes: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export const cardResponseSchema = z.object({
  data: z.object({
    _id: z.string(),
    retroId: z.string(),
    column: z.enum(["mad", "sad", "glad"]),
    content: z.string(),
    sessionId: z.string(),
    votes: z.number(),
    votedBy: z.array(z.string()),
    groupId: z.string().nullable(),
    groupTitle: z.string().nullable(),
    createdAt: z.string(),
  }),
});

export const cardListResponseSchema = z.object({
  data: z.array(
    z.object({
      _id: z.string(),
      retroId: z.string(),
      column: z.enum(["mad", "sad", "glad"]),
      content: z.string(),
      sessionId: z.string(),
      votes: z.number(),
      votedBy: z.array(z.string()),
      groupId: z.string().nullable(),
      groupTitle: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
});
