import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (
  toEmail: string,
  resetUrl: string,
  userName?: string
): Promise<void> => {
  const from = process.env.SMTP_FROM ?? `"EcoTrack" <${process.env.SMTP_USER}>`;
  const greeting = userName ? `Hi ${userName.split(" ")[0]},` : "Hello,";

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset your EcoTrack password",
    text: [
      greeting,
      "",
      "We received a request to reset your EcoTrack password.",
      "",
      `Click the link below to set a new password (valid for 30 minutes):`,
      resetUrl,
      "",
      "If you did not request this, you can safely ignore this email.",
      "",
      "— The EcoTrack Team",
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#166534,#15803d);padding:32px 32px 24px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🌿 EcoTrack</p>
              <p style="margin:8px 0 0;color:#bbf7d0;font-size:13px;">Waste Collection Management</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#111827;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a request to reset your EcoTrack password. Click the button below
                to choose a new one. This link expires in <strong>30 minutes</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#166534;color:#ffffff;text-decoration:none;
                          font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">
                  Reset My Password
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#6b7280;word-break:break-all;
                         background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
                         padding:10px 12px;text-align:center;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                If you did not request a password reset, you can safely ignore this email.<br/>
                © ${new Date().getFullYear()} EcoTrack · Rwanda
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};
