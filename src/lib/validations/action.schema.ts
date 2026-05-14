import { z } from "zod";

export const createActionSchema = z.object({
  retroId: z.string().min(1),
  cardId: z.string().nullable().default(null),
  title: z.string().min(1, "Aksiyon başlığı gereklidir").max(500),
  assigneeEmail: z.string().email("Geçerli bir e-posta adresi gereklidir"),
  assigneeName: z.string().nullable().default(null),
  deadline: z.string().nullable().default(null),
  type: z.enum(["mail", "jira"]),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;

export const updateActionSchema = z.object({
  status: z.enum(["open", "done", "in_progress", "failed"]).optional(),
  deadline: z.string().nullable().optional(),
  title: z.string().min(1).max(500).optional(),
  failedReason: z.string().nullable().optional(),
});

export type UpdateActionInput = z.infer<typeof updateActionSchema>;

export const suggestActionsSchema = z.object({
  groups: z.array(
    z.object({
      groupId: z.string().min(1),
      title: z.string().min(1),
      cardIds: z.array(z.string()),
    }),
  ),
});

export type SuggestActionsInput = z.infer<typeof suggestActionsSchema>;

export const actionResponseSchema = z.object({
  data: z.object({
    _id: z.string(),
    retroId: z.string(),
    cardId: z.string().nullable(),
    title: z.string(),
    assigneeEmail: z.string(),
    assigneeName: z.string().nullable(),
    deadline: z.string().nullable(),
    type: z.enum(["mail", "jira"]),
    status: z.enum(["open", "done", "in_progress", "failed"]),
    mailSentAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const actionListResponseSchema = z.object({
  data: z.array(
    z.object({
      _id: z.string(),
      retroId: z.string(),
      title: z.string(),
      assigneeEmail: z.string(),
      assigneeName: z.string().nullable(),
      deadline: z.string().nullable(),
      type: z.enum(["mail", "jira"]),
      status: z.enum(["open", "done", "in_progress", "failed"]),
      mailSentAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export const suggestionsResponseSchema = z.object({
  data: z.array(
    z.object({
      groupId: z.string(),
      groupTitle: z.string(),
      voteCount: z.number(),
      suggestedAction: z.string(),
    }),
  ),
});
