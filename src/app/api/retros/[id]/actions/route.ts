import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { createActionSchema } from "@/lib/validations/action.schema";
import {
  createAction,
  listActionsByRetro,
  updateActionMailSent,
} from "@/services/action.service";
import { getRetroById, ForbiddenError } from "@/services/retro.service";
import { generateMailContent } from "@/services/mail-content";
import { renderActionAssignedMail } from "@/templates/action-assigned.html";
import { sendMail } from "@/services/mailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const decoded = await requireUser(request);
    const { id: retroId } = await params;

    const retro = await getRetroById(retroId);
    if (!retro) {
      return fail(
        { message: "Retro not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (retro.createdBy !== decoded.uid) {
      throw new ForbiddenError();
    }

    if (retro.phase !== "actions") {
      return fail(
        { message: "Actions can only be created during the actions phase", code: "PHASE_ERROR" },
        { status: 400 },
      );
    }

    const json = await request.json().catch(() => ({}));
    const parsed = createActionSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const action = await createAction(retroId, parsed.data);

    let mailError: string | undefined;
    if (action.type === "mail") {
      mailError = await fireAndForgetMail(action);
    }

    const responseData = mailError ? { ...action, mailError } : action;
    return ok(responseData, { status: 201 });
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: retroId } = await params;
    const actions = await listActionsByRetro(retroId);
    return ok(actions);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

async function fireAndForgetMail(
  action: { id: string; title: string; assigneeEmail: string; assigneeName: string | null; deadline: string | null },
): Promise<string | undefined> {
  try {
    const content = await generateMailContent({
      actionTitle: action.title,
      assigneeName: action.assigneeName,
      deadline: action.deadline,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const html = renderActionAssignedMail({
      subject: content.subject,
      body: content.body,
      actionTitle: action.title,
      assigneeName: action.assigneeName,
      deadline: action.deadline,
      appUrl,
    });

    const result = await sendMail({
      to: action.assigneeEmail,
      subject: content.subject,
      html,
    });

    if (result.success) {
      await updateActionMailSent(action.id);
      return undefined;
    }

    console.error("[actions] Mail send failed:", result.error);
    return result.error;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mail send failed";
    console.error("[actions] Mail pipeline error:", message);
    return message;
  }
}
