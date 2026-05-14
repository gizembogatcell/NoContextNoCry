type RenderParams = {
  subject: string;
  body: string;
  completedCount: number;
  openCount: number;
  failedCount: number;
  openActions: Array<{ title: string; assigneeName: string | null }>;
  retroUrl: string;
};

export function renderPreRetroSummaryMail(params: RenderParams): string {
  const {
    subject,
    body,
    completedCount,
    openCount,
    failedCount,
    openActions,
    retroUrl,
  } = params;

  const actionRows = buildActionRows(openActions);

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🚀 RetroFlow</h1>
<p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">${subject}</p>
</td></tr>

<!-- Stat Cards -->
<tr><td style="padding:24px 24px 8px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
${buildStatCard("✅", "Tamamlanan", completedCount, "#16a34a", "#f0fdf4")}
${buildStatCard("⏳", "Devam Eden", openCount, "#d97706", "#fffbeb")}
${buildStatCard("❌", "Yapılamayan", failedCount, "#dc2626", "#fef2f2")}
</tr>
</table>
</td></tr>

<!-- Body -->
<tr><td style="padding:16px 24px;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#475569;white-space:pre-line;">${body}</p>
</td></tr>

${actionRows}

<!-- CTA Button -->
<tr><td style="padding:24px;text-align:center;">
<a href="${retroUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
Retroya Katıl →
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

function buildStatCard(
  emoji: string,
  label: string,
  count: number,
  color: string,
  bgColor: string,
): string {
  return `<td width="33%" style="padding:4px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};border-radius:8px;text-align:center;">
<tr><td style="padding:16px 8px 4px;font-size:24px;">${emoji}</td></tr>
<tr><td style="padding:0 8px;font-size:28px;font-weight:700;color:${color};">${count}</td></tr>
<tr><td style="padding:4px 8px 16px;font-size:12px;color:#64748b;">${label}</td></tr>
</table>
</td>`;
}

function buildActionRows(
  actions: Array<{ title: string; assigneeName: string | null }>,
): string {
  if (actions.length === 0) return "";

  const items = actions
    .map((a) => {
      const assignee = a.assigneeName
        ? ` <span style="color:#94a3b8;">— ${a.assigneeName}</span>`
        : "";
      return `<tr><td style="padding:6px 0;font-size:14px;color:#334155;border-bottom:1px solid #f1f5f9;">⏳ ${a.title}${assignee}</td></tr>`;
    })
    .join("\n");

  return `<!-- Open Actions -->
<tr><td style="padding:8px 24px 16px;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1e293b;">📋 Açık Aksiyonlar</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;padding:8px 12px;">
${items}
</table>
</td></tr>`;
}
