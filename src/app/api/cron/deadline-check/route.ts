import { ok, failFromUnknown } from "@/lib/api/response";
import { findActionsDueBefore } from "@/services/action.service";
import { sendMail } from "@/services/mailer";
import { renderDeadlineCheckMail } from "@/templates/deadline-check.html";

export async function GET() {
  try {
    const now = new Date();
    const actions = await findActionsDueBefore(now);

    if (actions.length === 0) {
      return ok({ sent: 0, message: "No actions due" });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    let sent = 0;

    for (const action of actions) {
      if (!action.magicToken || action.magicTokenUsed) continue;

      const html = renderDeadlineCheckMail({
        actionTitle: action.title,
        assigneeName: action.assigneeName,
        deadline: action.deadline,
        magicToken: action.magicToken,
        appUrl,
      });

      const result = await sendMail({
        to: action.assigneeEmail,
        subject: `⏰ Deadline hatırlatma: ${action.title}`,
        html,
      });

      if (result.success) sent++;
    }

    return ok({ sent, total: actions.length });
  } catch (err) {
    return failFromUnknown(err);
  }
}
