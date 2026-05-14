import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { updatePhaseSchema } from "@/lib/validations/retro.schema";
import {
  updatePhase,
  startTimer,
  ForbiddenError,
  PhaseTransitionError,
} from "@/services/retro.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const decoded = await requireUser(request);
    const { id } = await params;
    const json = await request.json().catch(() => ({}));
    const parsed = updatePhaseSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    let retro;

    if (parsed.data.phase === "write") {
      retro = await startTimer(id, decoded.uid);
    } else {
      retro = await updatePhase(id, decoded.uid, parsed.data.phase);
    }

    return ok(retro);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail({ message: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof PhaseTransitionError) {
      return fail({ message: err.message, code: err.code }, { status: 400 });
    }
    return failFromUnknown(err);
  }
}
