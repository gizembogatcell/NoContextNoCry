import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { fail, failFromUnknown, ok } from "@/lib/api/response";
import { getConversationsByUser } from "@/services/ai-chat.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const conversations = await getConversationsByUser(decoded.uid);
    return ok(conversations);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
