import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getLatestRetroByUser } from "@/services/retro.service";
import {
  getCarryOverActions,
  markFailedAsCarryOver,
} from "@/services/action.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const latestRetro = await getLatestRetroByUser(decoded.uid);

    if (!latestRetro) {
      return ok({ openCount: 0, failedCount: 0, actions: [] });
    }

    const actions = await getCarryOverActions(latestRetro.id);

    let openCount = 0;
    let failedCount = 0;
    for (const action of actions) {
      if (action.status === "open") openCount++;
      if (action.status === "failed") failedCount++;
    }

    return ok({ openCount, failedCount, actions });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const latestRetro = await getLatestRetroByUser(decoded.uid);

    if (!latestRetro) {
      return ok({ marked: 0 });
    }

    const marked = await markFailedAsCarryOver(latestRetro.id);
    return ok({ marked });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
