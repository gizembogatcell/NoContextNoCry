import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getActionsSummaryByUser } from "@/services/action.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const summary = await getActionsSummaryByUser(decoded.uid);

    if (!summary) {
      return ok({
        done: [],
        open: [],
        failed: [],
        stats: { done: 0, open: 0, failed: 0 },
      });
    }

    return ok(summary);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
