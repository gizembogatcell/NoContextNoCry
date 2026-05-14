import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getCarryOverActions } from "@/services/action.service";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const actions = await getCarryOverActions(decoded.uid);
    return ok(actions);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
