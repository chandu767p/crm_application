const nodemailer = require('nodemailer');

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

exports.sendPasswordResetEmail = async (to, resetUrl, name) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Do Systems CRM" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:40px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#2563eb;border-radius:12px;margin-bottom:16px;">
            <span style="color:#fff;font-weight:900;font-size:18px;">DS</span>
          </div>
          <h1 style="margin:0;color:#1e293b;font-size:22px;font-weight:700;">Password Reset</h1>
          <p style="color:#64748b;margin-top:8px;">Do Systems CRM</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hello ${name || 'there'},</p>
          <p style="color:#374151;font-size:15px;margin:0 0 24px;">We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Reset My Password</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;border-top:1px solid #f1f5f9;padding-top:16px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
        <p style="color:#cbd5e1;font-size:12px;text-align:center;margin-top:24px;">&copy; ${new Date().getFullYear()} Do Systems. All rights reserved.</p>
      </div>
    `,
  });
};

exports.sendGenericEmail = async (to, subject, htmlContent) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Do Systems CRM" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};
