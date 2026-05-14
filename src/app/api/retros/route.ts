import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { createRetroSchema } from "@/lib/validations/retro.schema";
import { createRetro, listRetrosByUser } from "@/services/retro.service";
import { listActionsByRetro } from "@/services/action.service";
import { generatePreRetroSummary } from "@/services/mail-content";
import { renderPreRetroSummaryMail } from "@/templates/pre-retro-summary.html";
import { sendMail } from "@/services/mailer";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const json = await request.json().catch(() => ({}));
    const parsed = createRetroSchema.safeParse(json);

    if (!parsed.success) {
      return failFromUnknown(parsed.error);
    }

    const retro = await createRetro(decoded.uid, parsed.data);

    if (parsed.data.sendSummaryMail) {
      fireAndForgetSummaryMail(decoded.uid, retro.id).catch(() => {});
    }

    return ok(retro, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

async function fireAndForgetSummaryMail(
  userId: string,
  newRetroId: string,
): Promise<void> {
  const retros = await listRetrosByUser(userId);
  const previousRetro = retros.find((r) => r.id !== newRetroId);
  if (!previousRetro) return;

  const actions = await listActionsByRetro(previousRetro.id);
  if (actions.length === 0) return;

  const emails = new Set<string>();
  for (const a of actions) {
    if (a.assigneeEmail) emails.add(a.assigneeEmail);
  }
  if (emails.size === 0) return;

  const actionRows = actions.map((a) => ({
    title: a.title,
    status: a.status,
    assigneeName: a.assigneeName,
    deadline: a.deadline,
  }));

  const content = await generatePreRetroSummary({ actions: actionRows });

  const done = actions.filter((a) => a.status === "done").length;
  const open = actions.filter((a) => a.status !== "done" && a.status !== "failed").length;
  const failed = actions.filter((a) => a.status === "failed").length;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const retroUrl = `${appUrl}/retros/${newRetroId}`;

  const html = renderPreRetroSummaryMail({
    subject: content.subject,
    body: content.body,
    actions: actionRows,
    stats: { done, open, failed },
    retroUrl,
  });

  const sendPromises = [...emails].map((to) =>
    sendMail({ to, subject: content.subject, html }),
  );
  await Promise.allSettled(sendPromises);
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const retros = await listRetrosByUser(decoded.uid);
    return ok(retros);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}
