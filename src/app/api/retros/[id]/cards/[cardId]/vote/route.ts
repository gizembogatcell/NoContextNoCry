import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { voteSchema } from "@/lib/validations/retro.schema";
import { toggleVote } from "@/services/retro.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    await requireUser(request);
    const { id, cardId } = await params;
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = voteSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const { sessionId } = parsed.data;
    const card = await toggleVote(id, cardId, sessionId);

    return ok(card);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof Error) {
      return fail(
        { message: err.message, code: "BAD_REQUEST" },
        { status: 400 },
      );
    }
    return failFromUnknown(err);
  }
}
