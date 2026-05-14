type RenderParams = {
  actionTitle: string;
  assigneeName: string | null;
  deadline: string | null;
  magicToken: string;
  appUrl: string;
};

export function renderDeadlineCheckMail(params: RenderParams): string {
  const { actionTitle, assigneeName, deadline, magicToken, appUrl } = params;
  const greeting = assigneeName
    ? `Merhaba ${assigneeName}! 👋`
    : "Merhaba! 👋";
  const deadlineRow = deadline
    ? `<tr><td style="padding:8px 16px;color:#64748b;font-size:14px;">📅 Deadline: <strong>${deadline}</strong></td></tr>`
    : "";

  const baseUrl = `${appUrl}/action-update/${magicToken}`;
  const doneUrl = `${baseUrl}?action=done`;
  const inProgressUrl = `${baseUrl}?action=in-progress`;
  const failedUrl = `${baseUrl}?action=failed`;

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
<p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Aksiyon Durum Sorgulama</p>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 24px 8px;">
<p style="margin:0;font-size:18px;font-weight:600;color:#1e293b;">${greeting}</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:8px 24px 16px;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">Sana atanan bir aksiyonun deadline tarihi geldi! Aksiyonun son durumunu aşağıdaki butonlardan biriyle güncelle. 🎯</p>
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

<!-- Three Buttons -->
<tr><td style="padding:24px;text-align:center;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:4px 6px;" align="center">
<a href="${doneUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:600;min-width:140px;">
✅ Tamamladım
</a>
</td>
<td style="padding:4px 6px;" align="center">
<a href="${inProgressUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:600;min-width:140px;">
🔄 Devam ediyor
</a>
</td>
<td style="padding:4px 6px;" align="center">
<a href="${failedUrl}" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:600;min-width:140px;">
❌ Yapılamadı
</a>
</td>
</tr>
</table>
</td></tr>

<!-- Info -->
<tr><td style="padding:0 24px 16px;">
<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">Bu bağlantılar 48 saat geçerlidir ve yalnızca bir kez kullanılabilir.</p>
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
