import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@retroflow.app",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return { id: data?.id ?? "" };
}
