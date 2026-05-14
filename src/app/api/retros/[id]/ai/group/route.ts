import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getRetroById, ForbiddenError, saveGroups } from "@/services/retro.service";
import {
  groupCardsWithAi,
  AiGroupingError,
  AiTimeoutError,
} from "@/services/retro-ai.service";

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
      throw new ForbiddenError();
    }

    if (retro.phase !== "vote") {
      return fail(
        { message: "AI grouping is only available during vote phase", code: "PHASE_ERROR" },
        { status: 400 },
      );
    }

    const groups = await groupCardsWithAi(id);

    await saveGroups(
      id,
      groups.map((g) => ({ id: g.id, title: g.title, cardIds: g.cardIds })),
    );

    return ok(groups, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail({ message: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof AiTimeoutError) {
      return fail(
        { message: err.message, code: err.code },
        { status: 504 },
      );
    }
    if (err instanceof AiGroupingError) {
      return fail(
        { message: err.message, code: err.code },
        { status: 502 },
      );
    }
    return failFromUnknown(err);
  }
}
