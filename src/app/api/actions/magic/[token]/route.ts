import type { NextRequest } from "next/server";

import { ok, fail, failFromZod, failFromUnknown } from "@/lib/api/response";
import { isMagicTokenExpired } from "@/lib/magic-token";
import { magicLinkActionSchema } from "@/lib/validations/action.schema";
import {
  getActionByToken,
  updateActionByMagicToken,
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
        { message: "Geçersiz bağlantı", code: "TOKEN_NOT_FOUND" },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const action = await getActionByToken(token);

    if (!action) {
      return fail(
        { message: "Geçersiz bağlantı", code: "TOKEN_NOT_FOUND" },
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
    if (!parsed.success) return failFromZod(parsed.error);

    const { action: actionType, deadline, failedReason } = parsed.data;

    let updated;

    switch (actionType) {
      case "done":
        updated = await updateActionByMagicToken(token, {
          status: "done",
          magicTokenUsed: true,
        });
        break;

      case "in-progress":
        updated = await updateActionByMagicToken(token, {
          status: "open",
          magicTokenUsed: true,
          deadline: deadline ?? null,
        });
        break;

      case "failed":
        updated = await updateActionByMagicToken(token, {
          status: "failed",
          magicTokenUsed: true,
          failedReason: failedReason ?? "Sebep belirtilmedi",
          nextRetroCarryOver: true,
        });
        break;
    }

    if (!updated) {
      return fail(
        { message: "Aksiyon güncellenemedi", code: "UPDATE_FAILED" },
        { status: 500 },
      );
    }

    return ok({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      failedReason: updated.failedReason,
      nextRetroCarryOver: updated.nextRetroCarryOver,
      deadline: updated.deadline,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
