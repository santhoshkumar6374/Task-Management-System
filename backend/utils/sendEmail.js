const nodemailer = require('nodemailer');

// Gmail app passwords are displayed with spaces (e.g. "xxxx xxxx xxxx xxxx")
// but must be sent without spaces in SMTP auth.
const getAppPassword = () =>
  (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

// Creates a reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',          // auto-configures host/port/TLS for Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: getAppPassword(),
    },
  });
};

/**
 * Sends an email. Failures are logged but never thrown, so a missing/incorrect
 * email configuration never blocks the core task-assignment / status-update flow.
 * @param {{to: string, subject: string, html: string}} options
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = getAppPassword();

    if (!user || !pass) {
      console.warn('[Email] Credentials not configured — skipping send.');
      return;
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Task Manager" <${user}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] ✅ Sent to ${to} | MessageId: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] ❌ Failed to send to ${to}`);
    console.error(`[Email] Error: ${error.message}`);
    if (error.code) console.error(`[Email] Code: ${error.code}`);
  }
};

module.exports = sendEmail;
