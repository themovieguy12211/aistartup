import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const FROM = "DagrAI <noreply@auth.dagrai.xyz>";

export async function sendPasswordReset(email: string, token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://dagrai.xyz";
  const link = `${origin}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your DagrAI password",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 0">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#16161e;border:1px solid #2a2a3a;border-radius:10px;overflow:hidden">
              <tr><td style="padding:32px 32px 8px">
                <div style="font-size:20px;font-weight:600;color:#f0f0f3;text-align:center">DagrAI</div>
              </td></tr>
              <tr><td style="padding:8px 32px 24px;text-align:center">
                <p style="font-size:18px;font-weight:500;color:#f0f0f3;margin:0 0 12px">Reset your password</p>
                <p style="font-size:15px;color:#a0a0b0;line-height:1.6;margin:0">Click the button below to set a new password.</p>
              </td></tr>
              <tr><td style="padding:0 32px 24px;text-align:center">
                <a href="${link}" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:15px;font-weight:500">Reset Password</a>
              </td></tr>
              <tr><td style="padding:0 32px 32px;text-align:center">
                <p style="font-size:13px;color:#6b6b80;margin:0">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendConfirmation(email: string, confirmUrl: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your DagrAI account",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 0">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#16161e;border:1px solid #2a2a3a;border-radius:10px;overflow:hidden">
              <tr><td style="padding:32px 32px 8px">
                <div style="font-size:20px;font-weight:600;color:#f0f0f3;text-align:center">DagrAI</div>
              </td></tr>
              <tr><td style="padding:8px 32px 24px;text-align:center">
                <p style="font-size:18px;font-weight:500;color:#f0f0f3;margin:0 0 12px">Verify your email</p>
                <p style="font-size:15px;color:#a0a0b0;line-height:1.6;margin:0">Click below to confirm your email and activate your account.</p>
              </td></tr>
              <tr><td style="padding:0 32px 24px;text-align:center">
                <a href="${confirmUrl}" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:15px;font-weight:500">Confirm Email</a>
              </td></tr>
              <tr><td style="padding:0 32px 32px;text-align:center">
                <p style="font-size:12px;color:#6b6b80;margin:0;border-top:1px solid #222230;padding-top:20px">If you didn't create an account, you can safely ignore this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
