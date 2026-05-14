import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getCardById, castVote, VoteError } from "@/services/retro.service";

import { z } from "zod";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    await requireUser(request);
    const { id: retroId, cardId } = await params;
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const card = await getCardById(retroId, cardId);
    if (!card || !card.groupId) {
      return fail(
        { message: "Card not found or not grouped", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const vote = await castVote(retroId, card.groupId, parsed.data.sessionId);

    return ok(vote);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof VoteError) {
      return fail(
        { message: err.message, code: err.code },
        { status: 400 },
      );
    }
    return failFromUnknown(err);
  }
}
