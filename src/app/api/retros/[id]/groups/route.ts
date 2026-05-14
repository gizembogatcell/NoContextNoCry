import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { updateGroupsSchema } from "@/lib/validations/retro.schema";
import {
  getGroups,
  updateGroups,
  ForbiddenError,
} from "@/services/retro.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const groups = await getGroups(id);
    return ok(groups);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const decoded = await requireUser(request);
    const { id } = await params;
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return fail({ message: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 });
    }
    const parsed = updateGroupsSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const groups = await updateGroups(id, decoded.uid, parsed.data);
    return ok(groups);
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
