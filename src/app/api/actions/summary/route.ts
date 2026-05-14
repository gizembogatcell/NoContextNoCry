import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getLatestRetroByUser } from "@/services/retro.service";
import { getActionSummaryByRetro } from "@/services/action.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const latestRetro = await getLatestRetroByUser(decoded.uid);

    if (!latestRetro) {
      return ok(null);
    }

    const grouped = await getActionSummaryByRetro(latestRetro.id);

    const stats = {
      done: grouped.done.length,
      open: grouped.open.length,
      failed: grouped.failed.length,
      inProgress: grouped.inProgress.length,
      total:
        grouped.done.length +
        grouped.open.length +
        grouped.failed.length +
        grouped.inProgress.length,
    };

    return ok({
      retroId: latestRetro.id,
      retroTitle: latestRetro.title,
      ...grouped,
      stats,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
