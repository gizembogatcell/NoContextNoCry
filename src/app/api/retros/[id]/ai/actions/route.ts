import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import {
  getRetroById,
  ForbiddenError,
} from "@/services/retro.service";
import { generateActionSuggestions } from "@/services/retro-ai.service";

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

    if (retro.phase !== "actions" && retro.phase !== "vote") {
      return fail(
        {
          message: "AI suggestions are only available in vote or actions phase",
          code: "INVALID_PHASE",
        },
        { status: 400 },
      );
    }

    const suggestions = await generateActionSuggestions(id, retro.createdBy);
    return ok({ suggestions });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail({ message: err.message, code: err.code }, { status: 403 });
    }
    return failFromUnknown(err);
  }
}
