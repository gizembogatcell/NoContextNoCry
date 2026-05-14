import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { checkTimerExpiry } from "@/services/retro.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const retro = await checkTimerExpiry(id);

    if (!retro) {
      return fail(
        { message: "Retro not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok(retro);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
