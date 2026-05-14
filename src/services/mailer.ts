import "server-only";
import { Resend } from "resend";

import { getServerEnv } from "@/lib/env";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

type MailResult = {
  success: boolean;
  error?: string;
};

let cachedResend: Resend | null = null;

function getResend(): Resend {
  if (cachedResend) return cachedResend;
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  cachedResend = new Resend(RESEND_API_KEY);
  return cachedResend;
}

export async function sendMail(options: MailOptions): Promise<MailResult> {
  const { RESEND_FROM_EMAIL } = getServerEnv();
  if (!RESEND_FROM_EMAIL) {
    return { success: false, error: "RESEND_FROM_EMAIL is not configured" };
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown mail error";
    console.error("[mailer] Send failed:", message);
    return { success: false, error: message };
  }
}
