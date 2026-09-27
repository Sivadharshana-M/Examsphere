/**
 * emailService.js
 * Reusable email service for ExamSphere AI.
 * Loads SMTP configuration from environment variables — never from source code.
 */

const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────

let transporter = null;
let isSmtpVerified = false;

/**
 * Build and return the nodemailer transporter.
 * Called once at startup and cached for reuse.
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: SMTP_SECURE === 'true', // true for port 465, false for 587/others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

// ─── Startup verification ─────────────────────────────────────────────────────

/**
 * Verify the SMTP transporter during server startup.
 * Prints diagnostics but never logs credentials.
 */
async function verifyEmailService() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.log('');
    console.log('[Email] ⚠️  SMTP configuration missing.');
    console.log('[Email] Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env');
    console.log('[Email] Password reset emails cannot be sent until SMTP is configured.');
    console.log('');
    isSmtpVerified = false;
    return;
  }

  try {
    transporter = createTransporter();
    await transporter.verify();
    isSmtpVerified = true;
    console.log('[Email] ✅ SMTP configuration detected.');
    console.log(`[Email] ✅ SMTP transporter verified successfully (host: ${SMTP_HOST}).`);
  } catch (err) {
    console.error(`[Email] ❌ SMTP configuration error: ${err.message}`);
    
    if (SMTP_HOST.toLowerCase().includes('gmail.com')) {
      console.error('[Email] ℹ️  Note: Gmail requires an "App Password" to be used instead of your normal password.');
      console.error('[Email] ℹ️  Go to Google Account -> Security -> 2-Step Verification -> App Passwords.');
    } else {
      console.error('[Email] Please check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD settings in .env');
    }
    
    isSmtpVerified = false;
    transporter = null; // Ensure we don't silently use a broken transporter
  }
}

// ─── Email functions ──────────────────────────────────────────────────────────

/**
 * Send the password reset email.
 *
 * @param {object} user         - Mongoose user document ({ name, email })
 * @param {string} resetUrl     - Full reset URL with raw token (e.g. http://localhost:3000/reset-password/<token>)
 */
async function sendPasswordResetEmail(user, resetUrl) {
  if (!isSmtpVerified || !transporter) {
    throw new Error('SMTP transporter is not configured or failed verification. Please configure email settings in .env');
  }

  const mailFrom = process.env.MAIL_FROM || `"ExamSphere AI" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from: mailFrom,
    to: user.email,
    subject: 'ExamSphere AI — Password Reset',
    // Plain-text fallback
    text: `Hello ${user.name},\n\nWe received a request to reset your ExamSphere AI password.\n\nClick the link below to reset your password (valid for 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nRegards,\nExamSphere AI Team`,
    // HTML version
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f1117; color: #e2e8f0; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #1a1f2e; border-radius: 12px; overflow: hidden; border: 1px solid rgba(99,102,241,0.25); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 1.6rem; color: #fff; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
    .body { padding: 36px 40px; }
    .body p { margin: 0 0 16px; line-height: 1.65; color: #cbd5e1; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 1rem; font-weight: 700; letter-spacing: 0.02em; }
    .url-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 12px 16px; word-break: break-all; font-family: monospace; font-size: 0.8rem; color: #a5b4fc; margin: 8px 0 16px; }
    .footer { padding: 20px 40px 28px; border-top: 1px solid rgba(255,255,255,0.07); font-size: 0.82rem; color: #64748b; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ExamSphere <span style="color:#a5f3fc">AI</span></h1>
      <p>Voice-Based Accessible Examination System</p>
    </div>
    <div class="body">
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your <strong>ExamSphere AI</strong> password.</p>
      <p>Click the button below to reset your password. This link will expire in <strong>15 minutes</strong>.</p>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="font-size:0.85rem; color:#94a3b8;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <div class="url-box">${resetUrl}</div>
      <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>Regards, <strong>ExamSphere AI Team</strong></p>
    </div>
  </div>
</body>
</html>`,
  };

  console.log(`[Password Reset] Sending reset email to: ${user.email}`);

  const info = await transporter.sendMail(mailOptions);

  console.log(`[Password Reset] ✅ Email sent successfully. Message ID: ${info.messageId}`);
}

module.exports = { verifyEmailService, sendPasswordResetEmail };
