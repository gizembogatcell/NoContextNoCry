import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { fail, failFromUnknown, ok } from "@/lib/api/response";
import { updateConversationSchema } from "@/lib/validations/ai-chat.schema";
import {
  deleteConversation,
  getConversationById,
  updateConversation,
} from "@/services/ai-chat.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const decoded = await requireUser(request);
    const { id } = await context.params;
    const conversation = await getConversationById(id, decoded.uid);

    if (!conversation) {
      return fail(
        { message: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok(conversation);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const decoded = await requireUser(request);
    const { id } = await context.params;
    const json = await request.json().catch(() => ({}));
    const parsed = updateConversationSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const updated = await updateConversation(id, decoded.uid, parsed.data);

    if (!updated) {
      return fail(
        { message: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const decoded = await requireUser(request);
    const { id } = await context.params;
    const deleted = await deleteConversation(id, decoded.uid);

    if (!deleted) {
      return fail(
        { message: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok({ deleted: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
