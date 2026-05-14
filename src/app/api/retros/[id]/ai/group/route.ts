import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getAllCards, applyAiGroups, getRetroById } from "@/services/retro.service";
import { groupCardsWithAi } from "@/services/retro-ai.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const decoded = await requireUser(request);
    const { id } = await params;

    const retro = await getRetroById(id);
    if (!retro) {
      return fail(
        { message: "Retro not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (retro.createdBy !== decoded.uid) {
      return fail(
        { message: "Only the moderator can trigger AI grouping", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    if (retro.phase !== "vote") {
      return fail(
        { message: "AI grouping is only available in vote phase", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    const cards = await getAllCards(id);
    if (cards.length === 0) {
      return ok([]);
    }

    const groups = await groupCardsWithAi(cards);
    await applyAiGroups(id, groups);

    return ok(groups);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof Error && err.message === "AI_TIMEOUT") {
      return fail(
        { message: "AI yanıt süresini aştı. Manuel gruplama yapabilirsiniz.", code: "AI_TIMEOUT" },
        { status: 504 },
      );
    }
    return failFromUnknown(err);
  }
}
