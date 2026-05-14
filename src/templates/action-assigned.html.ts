type ActionAssignedParams = {
  actionTitle: string;
  groupTitle: string;
  assigneeName: string;
  deadline: string | null;
  magicToken: string;
  appUrl: string;
  mailBody: string;
};

export function buildActionAssignedHtml({
  actionTitle,
  groupTitle,
  assigneeName,
  deadline,
  magicToken,
  appUrl,
  mailBody,
}: ActionAssignedParams): string {
  const deadlineText = deadline ?? "Belirtilmemiş";
  const ctaUrl = `${appUrl}/action-update/${magicToken}`;
  const escapedBody = mailBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RetroFlow Aksiyon</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#034EA2 0%,#0670de 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🔄 RetroFlow
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Yeni bir aksiyon sana atandı!
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <p style="margin:0;font-size:16px;color:#1a1a2e;line-height:1.6;">
                Merhaba <strong>${assigneeName}</strong> 👋
              </p>
            </td>
          </tr>

          <!-- AI Generated Body -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0;font-size:15px;color:#444;line-height:1.7;">
                ${escapedBody}
              </p>
            </td>
          </tr>

          <!-- Action Card -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7ff;border-radius:10px;border-left:5px solid #034EA2;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#034EA2;font-weight:600;">
                      📋 Aksiyon
                    </p>
                    <p style="margin:0 0 16px;font-size:18px;color:#1a1a2e;font-weight:600;line-height:1.4;">
                      ${actionTitle}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:24px;">
                          <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#888;">Küme</p>
                          <p style="margin:0;font-size:14px;color:#333;font-weight:500;">🏷️ ${groupTitle}</p>
                        </td>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#888;">Deadline</p>
                          <p style="margin:0;font-size:14px;color:#333;font-weight:500;">📅 ${deadlineText}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#034EA2 0%,#0670de 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;">
                🚀 Uygulamada Görüntüle
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
                Bu mail RetroFlow tarafından otomatik gönderilmiştir.<br/>
                Herhangi bir sorunuz varsa retro moderatörünüze ulaşabilirsiniz.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
