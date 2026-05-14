import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api/auth";
import { ok, failFromZod, failFromUnknown } from "@/lib/api/response";
import { createActionSchema } from "@/lib/validations/action.schema";
import {
  createAction,
  getActionsByRetro,
  markMailSent,
  markMailFailed,
} from "@/services/action.service";
import { generateMailContent } from "@/services/mail-content";
import { sendMail } from "@/services/mailer";
import { buildActionAssignedHtml } from "@/templates/action-assigned.html";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: retroId } = await params;

    const body: unknown = await request.json();
    const parsed = createActionSchema.safeParse({ ...body, retroId });
    if (!parsed.success) return failFromZod(parsed.error);

    const action = await createAction(parsed.data);

    if (action.type === "mail") {
      fireAndForgetMail(action._id, action).catch(() => {});
    }

    return ok(action, { status: 201 });
  } catch (err) {
    return failFromUnknown(err);
  }
}

async function fireAndForgetMail(
  actionId: string,
  action: {
    title: string;
    assigneeEmail: string;
    assigneeName: string | null;
    deadline: string | null;
    magicToken: string | null;
    cardId: string | null;
  },
) {
  try {
    const groupTitle = action.cardId ?? "Genel";
    const { subject, body } = await generateMailContent({
      actionTitle: action.title,
      groupTitle,
      votes: 0,
      assigneeName: action.assigneeName ?? action.assigneeEmail,
      deadline: action.deadline,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const html = buildActionAssignedHtml({
      actionTitle: action.title,
      groupTitle,
      assigneeName: action.assigneeName ?? action.assigneeEmail,
      deadline: action.deadline,
      magicToken: action.magicToken ?? "",
      appUrl,
      mailBody: body,
    });

    await sendMail({ to: action.assigneeEmail, subject, html });
    await markMailSent(actionId);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown mail error";
    console.error("[mail] Failed to send action mail:", reason);
    await markMailFailed(actionId, reason);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id: retroId } = await params;

    const actions = await getActionsByRetro(retroId);
    return ok(actions);
  } catch (err) {
    return failFromUnknown(err);
  }
}
