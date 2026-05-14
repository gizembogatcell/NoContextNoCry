import "server-only";

import { callAiProxy } from "@/services/ai-chat.service";

type MailContentParams = {
  actionTitle: string;
  groupTitle?: string | null;
  voteCount?: number | null;
  repeatCount?: number | null;
  assigneeName?: string | null;
  deadline?: string | null;
};

type MailContent = {
  subject: string;
  body: string;
};

export type PreRetroSummaryParams = {
  completedCount: number;
  openCount: number;
  failedCount: number;
  openActions: Array<{ title: string; assigneeName: string | null }>;
};

export type PreRetroSummaryContent = {
  subject: string;
  body: string;
};

const FALLBACK_SUBJECT = "Yeni bir aksiyon sana atandı! 🚀";
const FALLBACK_BODY =
  "Merhaba! Retro toplantısında sana yeni bir aksiyon atandı. " +
  "Detayları uygulamada görüntüleyebilirsin. Başarılar! 💪";

export async function generateMailContent(
  params: MailContentParams,
): Promise<MailContent> {
  const prompt = buildPrompt(params);

  try {
    const raw = await callAiProxy([{ role: "user", content: prompt }]);
    return parseAiResponse(raw);
  } catch (err) {
    console.error("[mail-content] AI generation failed, using fallback:", err);
    return { subject: FALLBACK_SUBJECT, body: FALLBACK_BODY };
  }
}

function buildPrompt(params: MailContentParams): string {
  const parts = [
    "Şu aksiyon için Türkçe, eğlenceli ve motive edici bir e-posta yaz.",
    `Aksiyon: "${params.actionTitle}"`,
  ];

  if (params.groupTitle) parts.push(`Küme: "${params.groupTitle}"`);
  if (params.voteCount != null) parts.push(`Oy sayısı: ${params.voteCount}`);
  if (params.repeatCount != null) parts.push(`Kaçıncı retroda çıktığı: ${params.repeatCount}`);
  if (params.assigneeName) parts.push(`Alıcı: ${params.assigneeName}`);
  if (params.deadline) parts.push(`Deadline: ${params.deadline}`);

  parts.push("Emoji kullan. HTML döndürme, sadece düz metin gövde.");
  parts.push('JSON döndür: { "subject": "...", "body": "..." }');
  parts.push("Sadece geçerli JSON döndür, başka bir şey yazma.");

  return parts.join("\n");
}

// ── Pre-retro summary ────────────────────────────────────────────────

const PRE_RETRO_FALLBACK_SUBJECT = "Yarın retro var! 🎯 Sprint özeti hazır";
const PRE_RETRO_FALLBACK_BODY =
  "Merhaba ekip! Yarınki retro öncesi geçen sprintin aksiyon özetini paylaşmak istedik. " +
  "Detayları retroda konuşacağız. Herkesi bekliyoruz! 💪";

export async function generatePreRetroSummary(
  params: PreRetroSummaryParams,
): Promise<PreRetroSummaryContent> {
  const prompt = buildPreRetroPrompt(params);

  try {
    const raw = await callAiProxy([{ role: "user", content: prompt }]);
    return parsePreRetroResponse(raw);
  } catch (err) {
    console.error("[mail-content] Pre-retro AI generation failed, using fallback:", err);
    return { subject: PRE_RETRO_FALLBACK_SUBJECT, body: PRE_RETRO_FALLBACK_BODY };
  }
}

function buildPreRetroPrompt(params: PreRetroSummaryParams): string {
  const actionList = params.openActions
    .map((a) => `- ${a.title}${a.assigneeName ? ` (${a.assigneeName})` : ""}`)
    .join("\n");

  const parts = [
    "Şu sprint aksiyon özetini Türkçe, eğlenceli ve motive edici şekilde yaz.",
    `Tamamlanan: ${params.completedCount}, Devam eden: ${params.openCount}, Yapılamayan: ${params.failedCount}.`,
  ];

  if (actionList) {
    parts.push(`Açık aksiyonlar:\n${actionList}`);
  }

  parts.push("Yarın retro var.");
  parts.push("Emoji kullan. HTML döndürme, sadece düz metin gövde.");
  parts.push('JSON döndür: { "subject": "...", "body": "..." }');
  parts.push("Sadece geçerli JSON döndür, başka bir şey yazma.");

  return parts.join("\n");
}

function parsePreRetroResponse(raw: string): PreRetroSummaryContent {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    if (isSubjectBodyPair(parsed)) {
      return {
        subject: (parsed as PreRetroSummaryContent).subject,
        body: (parsed as PreRetroSummaryContent).body,
      };
    }
  } catch {
    console.error("[mail-content] Failed to parse pre-retro AI response:", raw.slice(0, 200));
  }

  return { subject: PRE_RETRO_FALLBACK_SUBJECT, body: PRE_RETRO_FALLBACK_BODY };
}

// ── AI response parsing ──────────────────────────────────────────────

function parseAiResponse(raw: string): MailContent {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    if (isSubjectBodyPair(parsed)) {
      return {
        subject: (parsed as MailContent).subject,
        body: (parsed as MailContent).body,
      };
    }
  } catch {
    console.error("[mail-content] Failed to parse AI response as JSON:", raw.slice(0, 200));
  }

  return { subject: FALLBACK_SUBJECT, body: FALLBACK_BODY };
}

function isSubjectBodyPair(val: unknown): val is { subject: string; body: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "subject" in val &&
    "body" in val &&
    typeof (val as Record<string, unknown>).subject === "string" &&
    typeof (val as Record<string, unknown>).body === "string"
  );
}
