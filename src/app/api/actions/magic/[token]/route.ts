import type { NextRequest } from "next/server";

import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { magicLinkActionSchema } from "@/lib/validations/action.schema";
import { isMagicTokenExpired } from "@/lib/magic-token";
import {
  getActionByToken,
  updateActionByToken,
} from "@/services/action.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const action = await getActionByToken(token);

    if (!action) {
      return fail(
        { message: "Geçersiz link", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (action.magicTokenUsed) {
      return fail(
        { message: "Bu link zaten kullanıldı", code: "TOKEN_USED" },
        { status: 409 },
      );
    }

    if (action.magicTokenExpiresAt && isMagicTokenExpired(action.magicTokenExpiresAt)) {
      return fail(
        { message: "Link süresi doldu", code: "TOKEN_EXPIRED" },
        { status: 410 },
      );
    }

    return ok({
      id: action.id,
      title: action.title,
      assigneeName: action.assigneeName,
      deadline: action.deadline,
      status: action.status,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const action = await getActionByToken(token);

    if (!action) {
      return fail(
        { message: "Geçersiz link", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (action.magicTokenUsed) {
      return fail(
        { message: "Bu link zaten kullanıldı", code: "TOKEN_USED" },
        { status: 409 },
      );
    }

    if (action.magicTokenExpiresAt && isMagicTokenExpired(action.magicTokenExpiresAt)) {
      return fail(
        { message: "Link süresi doldu", code: "TOKEN_EXPIRED" },
        { status: 410 },
      );
    }

    const body: unknown = await request.json();
    const parsed = magicLinkActionSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        { message: "Geçersiz istek", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const { action: actionType, newDeadline, reason } = parsed.data;

    if (actionType === "done") {
      const updated = await updateActionByToken(token, {
        status: "done",
        magicTokenUsed: true,
      });
      return ok(updated);
    }

    if (actionType === "in_progress") {
      const updated = await updateActionByToken(token, {
        status: "open",
        deadline: newDeadline ?? null,
      });
      return ok(updated);
    }

    // actionType === "failed"
    const updated = await updateActionByToken(token, {
      status: "failed",
      failedReason: reason ?? null,
      nextRetroCarryOver: true,
      magicTokenUsed: true,
    });
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
