import "server-only";
import { Resend } from "resend";

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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  cachedResend = new Resend(apiKey);
  return cachedResend;
}

export async function sendMail(options: MailOptions): Promise<MailResult> {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    return { success: false, error: "RESEND_FROM_EMAIL is not configured" };
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: fromEmail,
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
