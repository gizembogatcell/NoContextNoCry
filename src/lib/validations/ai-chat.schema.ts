import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().min(1, "Message is required").max(10_000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
});

const conversationSchema = z.object({
  id: z.string(),
  uid: z.string(),
  title: z.string(),
  messages: z.array(chatMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const conversationResponseSchema = z.object({
  data: conversationSchema,
});

const conversationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const conversationListResponseSchema = z.object({
  data: z.array(conversationSummarySchema),
});
