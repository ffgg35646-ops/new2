import { createTransport } from "nodemailer";

let transporter: ReturnType<typeof createTransport> | undefined;

function getMailConfig() {
  const host = process.env["SMTP_HOST"] || "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"] || "465");
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const from = process.env["MAIL_FROM"] || user;

  if (!user || !pass || !from) {
    throw new Error("SMTP_USER, SMTP_PASS and MAIL_FROM are required.");
  }

  return { host, port, user, pass, from };
}

function getTransporter() {
  if (!transporter) {
    const config = getMailConfig();
    transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }
  return transporter;
}

export async function sendVerificationCode(email: string, code: string) {
  const { from } = getMailConfig();

  await getTransporter().sendMail({
    from: `عقار البطين <${from}>`,
    to: email,
    subject: "رمز تأكيد حسابك | عقار البطين",
    html: `<!doctype html>
<html lang="ar" dir="rtl"><body style="margin:0;padding:40px 16px;background:#f4f1ea;font-family:Arial,Tahoma,sans-serif;color:#29251f">
<div style="max-width:520px;margin:auto;background:#fff;border-radius:24px;border:1px solid #e7e1d7;overflow:hidden">
<div style="background:#245749;padding:30px;text-align:center;color:#fff;font-size:28px;font-weight:800">عقار البطين</div>
<div style="padding:34px 28px;text-align:center">
<h1 style="margin:0 0 12px;font-size:24px">تأكيد بريدك الإلكتروني</h1>
<p style="font-size:15px;line-height:1.9;color:#6f6a62">استخدم رمز التأكيد التالي لإكمال إنشاء حسابك:</p>
<div dir="ltr" style="display:inline-block;min-width:180px;padding:18px 28px;background:#f8f5ed;border:2px dashed #245749;border-radius:18px;font-size:36px;font-weight:800;letter-spacing:10px;color:#245749">${code}</div>
<p style="font-size:13px;color:#777168;line-height:1.8">أدخل الرمز داخل الموقع. صلاحية الرمز 10 دقائق.</p>
</div></div></body></html>`,
  });
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  const { from } = getMailConfig();

  await getTransporter().sendMail({
    from: `عقار البطين <${from}>`,
    to: email,
    subject: "إعادة تعيين كلمة المرور | عقار البطين",
    html: `<div dir="rtl" style="font-family:Arial,Tahoma,sans-serif;max-width:520px;margin:40px auto;padding:30px;text-align:center;background:#fff;border:1px solid #e7e1d7;border-radius:24px">
<h2 style="color:#245749">إعادة تعيين كلمة المرور</h2>
<p>اضغط الزر التالي لإنشاء كلمة مرور جديدة:</p>
<a href="${resetUrl}" style="display:inline-block;background:#245749;color:#fff;text-decoration:none;padding:13px 28px;border-radius:14px;font-weight:bold">تغيير كلمة المرور</a>
</div>`,
  });
}
