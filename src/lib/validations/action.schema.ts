import { z } from "zod";

export const createActionSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  text: z.string().min(1, "Action text is required").max(2000),
  assigneeEmail: z.string().email("Valid email is required"),
  assigneeName: z.string().max(200).nullable().optional(),
  deadline: z
    .string()
    .datetime({ message: "Deadline must be a valid ISO date" })
    .nullable()
    .optional(),
  type: z.enum(["mail", "jira"], {
    message: "Type must be 'mail' or 'jira'",
  }),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;
