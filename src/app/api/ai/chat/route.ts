import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { fail, failFromUnknown } from "@/lib/api/response";
import { sendMessageSchema } from "@/lib/validations/ai-chat.schema";
import {
  appendMessages,
  callAiProxy,
  createConversation,
  getConversationById,
} from "@/services/ai-chat.service";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const json = await request.json().catch(() => ({}));
    const parsed = sendMessageSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const { conversationId, message } = parsed.data;

    let contextMessages: Array<{ role: "user" | "assistant"; content: string }> =
      [];

    if (conversationId) {
      const existing = await getConversationById(conversationId, decoded.uid);
      if (!existing) {
        return fail(
          { message: "Conversation not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }
      contextMessages = existing.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    contextMessages.push({ role: "user", content: message });

    const assistantResponse = await callAiProxy(contextMessages);

    const conversation = conversationId
      ? await appendMessages(conversationId, decoded.uid, message, assistantResponse)
      : await createConversation(decoded.uid, message, assistantResponse);

    return Response.json({ data: { conversation, assistantMessage: assistantResponse } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
