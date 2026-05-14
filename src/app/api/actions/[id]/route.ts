import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { updateActionSchema } from "@/lib/validations/action.schema";
import { getActionById, updateAction } from "@/services/action.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: actionId } = await params;

    const existing = await getActionById(actionId);
    if (!existing) {
      return fail(
        { message: "Action not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const json = await request.json().catch(() => ({}));
    const parsed = updateActionSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const updated = await updateAction(actionId, parsed.data);
    if (!updated) {
      return fail(
        { message: "Action update failed", code: "UPDATE_FAILED" },
        { status: 500 },
      );
    }

    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: actionId } = await params;

    const action = await getActionById(actionId);
    if (!action) {
      return fail(
        { message: "Action not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return ok(action);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
