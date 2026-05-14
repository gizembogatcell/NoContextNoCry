import type { NextRequest } from "next/server";

import { getServerEnv } from "@/lib/env";
import { ok, fail, failFromUnknown } from "@/lib/api/response";
import { getActionsDueToday, updateActionMailSent } from "@/services/action.service";
import { sendMail } from "@/services/mailer";
import { renderDeadlineCheckMail } from "@/templates/deadline-check.html";

export async function GET(request: NextRequest) {
  try {
    const { CRON_SECRET, NEXT_PUBLIC_APP_URL } = getServerEnv();

    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return fail({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      }
    }
    const dueActions = await getActionsDueToday();

    if (dueActions.length === 0) {
      return ok({ sent: 0, message: "No actions due today" });
    }

    const results: { actionId: string; success: boolean; error?: string }[] =
      [];

    for (const action of dueActions) {
      if (!action.magicToken) {
        results.push({
          actionId: action.id,
          success: false,
          error: "No magic token",
        });
        continue;
      }

      const html = renderDeadlineCheckMail({
        actionTitle: action.title,
        assigneeName: action.assigneeName,
        deadline: action.deadline,
        magicToken: action.magicToken,
        appUrl: NEXT_PUBLIC_APP_URL,
      });

      const mailResult = await sendMail({
        to: action.assigneeEmail,
        subject: `📋 Aksiyon Durumu: ${action.title}`,
        html,
      });

      if (mailResult.success) {
        await updateActionMailSent(action.id);
      }

      results.push({
        actionId: action.id,
        success: mailResult.success,
        error: mailResult.error,
      });
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (failed > 0) {
      return ok({ sent, failed, results }, { status: 207 });
    }

    return ok({ sent, results });
  } catch (err) {
    return failFromUnknown(err);
  }
}
