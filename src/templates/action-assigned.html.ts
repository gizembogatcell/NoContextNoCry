type RenderParams = {
  subject: string;
  body: string;
  actionTitle: string;
  assigneeName: string | null;
  deadline: string | null;
  appUrl: string;
};

export function renderActionAssignedMail(params: RenderParams): string {
  const { subject, body, actionTitle, assigneeName, deadline, appUrl } = params;
  const greeting = assigneeName ? `Merhaba ${assigneeName}! 👋` : "Merhaba! 👋";
  const deadlineRow = deadline
    ? `<tr><td style="padding:8px 16px;color:#64748b;font-size:14px;">📅 Deadline: <strong>${deadline}</strong></td></tr>`
    : "";

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

<!-- Greeting -->
<tr><td style="padding:24px 24px 8px;">
<p style="margin:0;font-size:18px;font-weight:600;color:#1e293b;">${greeting}</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:8px 24px 16px;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#475569;white-space:pre-line;">${body}</p>
</td></tr>

<!-- Action Card -->
<tr><td style="padding:8px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-left:4px solid #6366f1;border-radius:8px;">
<tr><td style="padding:16px;">
<p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">📋 Aksiyon</p>
<p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${actionTitle}</p>
</td></tr>
${deadlineRow}
</table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:24px;text-align:center;">
<a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
Uygulamada Görüntüle →
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
