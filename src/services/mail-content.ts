import "server-only";

import { callAiProxy } from "@/services/ai-chat.service";

type MailContentParams = {
  actionTitle: string;
  groupTitle: string;
  votes: number;
  assigneeName: string;
  deadline: string | null;
};

export async function generateMailContent({
  actionTitle,
  groupTitle,
  votes,
  assigneeName,
  deadline,
}: MailContentParams): Promise<{ subject: string; body: string }> {
  const deadlineText = deadline ?? "belirtilmemiş";

  const prompt = `Şu aksiyon için Türkçe, eğlenceli ve motive edici bir e-posta yaz.
Aksiyon: "${actionTitle}"
Küme: "${groupTitle}"
Oy sayısı: ${votes}
Alıcı: ${assigneeName}
Deadline: ${deadlineText}
Emoji kullan. HTML döndürme, sadece düz metin gövde.`;

  try {
    const body = await callAiProxy([{ role: "user", content: prompt }]);
    const subject = `🚀 RetroFlow: "${actionTitle}" aksiyonu sana atandı!`;
    return { subject, body };
  } catch {
    const subject = `RetroFlow: "${actionTitle}" aksiyonu sana atandı`;
    const body = `Merhaba ${assigneeName},\n\n"${actionTitle}" aksiyonu sana atandı.\nKüme: ${groupTitle}\nDeadline: ${deadlineText}\n\nBaşarılar! 💪`;
    return { subject, body };
  }
}
