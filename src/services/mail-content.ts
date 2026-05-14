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

type PreRetroSummaryParams = {
  actions: Array<{
    title: string;
    status: string;
    assigneeName: string | null;
    deadline: string | null;
  }>;
};

const FALLBACK_SUMMARY_SUBJECT = "📋 Retro Özeti — Aksiyonların Durumu";
const FALLBACK_SUMMARY_BODY =
  "Merhaba ekip! Yeni bir retro planlandı. " +
  "Önceki aksiyonların durumunu aşağıdaki tablodan görebilirsiniz. " +
  "Retroya hazırlıklı gelin! 💪";

export async function generatePreRetroSummary(
  params: PreRetroSummaryParams,
): Promise<MailContent> {
  const { actions } = params;
  const done = actions.filter((a) => a.status === "done").length;
  const open = actions.filter(
    (a) => a.status === "open" || a.status === "in_progress",
  ).length;
  const failed = actions.filter((a) => a.status === "failed").length;

  const actionList = actions
    .map(
      (a) =>
        `- "${a.title}" (${a.assigneeName ?? "Sahipsiz"}) → ${a.status}${a.deadline ? ` [Deadline: ${a.deadline}]` : ""}`,
    )
    .join("\n");

  const prompt = [
    "Şu sprint aksiyon özetini Türkçe, eğlenceli ve motive edici şekilde yaz.",
    `Tamamlanan: ${done}, Devam eden: ${open}, Yapılamayan: ${failed}.`,
    `Aksiyonlar:\n${actionList}`,
    "Yarın retro var. Ekibi motive et.",
    "Emoji kullan. HTML döndürme, sadece düz metin gövde.",
    'JSON döndür: { "subject": "...", "body": "..." }',
    "Sadece geçerli JSON döndür, başka bir şey yazma.",
  ].join("\n");

  try {
    const raw = await callAiProxy([{ role: "user", content: prompt }]);
    return parseAiResponse(raw);
  } catch (err) {
    console.error("[mail-content] Pre-retro summary AI failed, using fallback:", err);
    return { subject: FALLBACK_SUMMARY_SUBJECT, body: FALLBACK_SUMMARY_BODY };
  }
}

// ── AI response parsing ──────────────────────────────────────────────

function parseAiResponse(raw: string): MailContent {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "subject" in parsed &&
      "body" in parsed &&
      typeof (parsed as Record<string, unknown>).subject === "string" &&
      typeof (parsed as Record<string, unknown>).body === "string"
    ) {
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
