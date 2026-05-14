import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { updatePhaseSchema } from "@/lib/validations/retro.schema";
import { updatePhase, startTimer } from "@/services/retro.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const decoded = await requireUser(request);
    const { id } = await params;
    const json: unknown = await request.json().catch(() => ({}));
    const parsed = updatePhaseSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const { phase, startTimer: shouldStartTimer } = parsed.data;

    if (shouldStartTimer) {
      const retro = await startTimer(id, decoded.uid);
      return ok(retro);
    }

    const retro = await updatePhase(id, decoded.uid, phase);
    return ok(retro);
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
