type ActionRow = {
  title: string;
  assigneeName: string | null;
  deadline: string | null;
  status: string;
};

type RenderParams = {
  subject: string;
  body: string;
  actions: ActionRow[];
  stats: { done: number; open: number; failed: number };
  retroUrl: string;
};

function statusEmoji(status: string): string {
  const map: Record<string, string> = {
    done: "✅",
    open: "⏳",
    in_progress: "🔄",
    failed: "❌",
  };
  return map[status] ?? "❓";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    done: "Tamamlandı",
    open: "Açık",
    in_progress: "Devam Ediyor",
    failed: "Başarısız",
  };
  return map[status] ?? status;
}

export function renderPreRetroSummaryMail(params: RenderParams): string {
  const { subject, body, actions, stats, retroUrl } = params;

  const actionRows = actions
    .map(
      (a) => `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${a.title}</td>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${a.assigneeName ?? "—"}</td>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${a.deadline ?? "—"}</td>
<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${statusEmoji(a.status)} ${statusLabel(a.status)}</td>
</tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">📋 RetroFlow</h1>
<p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">${subject}</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:24px;">
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;white-space:pre-line;">${body}</p>
</td></tr>

<!-- Stats Cards -->
<tr><td style="padding:0 24px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:33%;text-align:center;padding:16px 8px;background:#f0fdf4;border-radius:8px 0 0 8px;">
<p style="margin:0;font-size:28px;font-weight:700;color:#16a34a;">${stats.done}</p>
<p style="margin:4px 0 0;font-size:12px;color:#475569;">✅ Tamamlandı</p>
</td>
<td style="width:33%;text-align:center;padding:16px 8px;background:#fefce8;">
<p style="margin:0;font-size:28px;font-weight:700;color:#ca8a04;">${stats.open}</p>
<p style="margin:4px 0 0;font-size:12px;color:#475569;">⏳ Açık</p>
</td>
<td style="width:33%;text-align:center;padding:16px 8px;background:#fef2f2;border-radius:0 8px 8px 0;">
<p style="margin:0;font-size:28px;font-weight:700;color:#dc2626;">${stats.failed}</p>
<p style="margin:4px 0 0;font-size:12px;color:#475569;">❌ Başarısız</p>
</td>
</tr>
</table>
</td></tr>

<!-- Actions Table -->
${actions.length > 0 ? `<tr><td style="padding:0 24px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<tr style="background:#f8fafc;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Aksiyon</th>
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Sahip</th>
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Deadline</th>
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Durum</th>
</tr>
${actionRows}
</table>
</td></tr>` : ""}

<!-- CTA Button -->
<tr><td style="padding:8px 24px 32px;text-align:center;">
<a href="${retroUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
🚀 Retroya Katıl
</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:12px;color:#94a3b8;">Bu mail RetroFlow tarafından otomatik gönderilmiştir. 💜</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
