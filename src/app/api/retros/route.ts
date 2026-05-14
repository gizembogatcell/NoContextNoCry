import type { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/api/auth";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { createRetroSchema } from "@/lib/validations/retro.schema";
import {
  createRetro,
  listRetrosByUser,
  getPreviousRetro,
  getRetroRecipients,
} from "@/services/retro.service";
import {
  getActionStatsByRetro,
  markFailedAsCarryOver,
} from "@/services/action.service";
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

    void markCarryOverAndSendMails(decoded.uid, retro.id, parsed.data.sendSummaryMail);

    return ok(retro, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return fail({ message: err.message, code: err.code }, { status: 401 });
    }
    return failFromUnknown(err);
  }
}

async function markCarryOverAndSendMails(
  uid: string,
  newRetroId: string,
  shouldSendMail: boolean,
): Promise<void> {
  try {
    const previousRetro = await getPreviousRetro(uid, newRetroId);
    if (!previousRetro) return;

    await markFailedAsCarryOver(previousRetro.id);

    if (!shouldSendMail) return;

    const stats = await getActionStatsByRetro(previousRetro.id);
    const totalActions =
      stats.completedCount + stats.openCount + stats.failedCount;
    if (totalActions === 0) return;

    const recipients = await getRetroRecipients(previousRetro.id);
    if (recipients.length === 0) return;

    const aiContent = await generatePreRetroSummary({
      completedCount: stats.completedCount,
      openCount: stats.openCount,
      failedCount: stats.failedCount,
      openActions: stats.openActions.map((a) => ({
        title: a.title,
        assigneeName: a.assigneeName,
      })),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const retroUrl = `${appUrl}/retros/${newRetroId}`;

    const html = renderPreRetroSummaryMail({
      subject: aiContent.subject,
      body: aiContent.body,
      completedCount: stats.completedCount,
      openCount: stats.openCount,
      failedCount: stats.failedCount,
      openActions: stats.openActions.map((a) => ({
        title: a.title,
        assigneeName: a.assigneeName,
      })),
      retroUrl,
    });

    await Promise.all(
      recipients.map((to) =>
        sendMail({ to, subject: aiContent.subject, html }),
      ),
    );
  } catch (err) {
    console.error("[retros/route] Failed to process carry-over / summary mails:", err);
  }
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
