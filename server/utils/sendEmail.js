const { Resend } = require('resend');
const logger = require('./logger');

// Resend delivers mail over its HTTPS API (port 443), not SMTP ports
// (25 / 465 / 587). Render blocks outbound SMTP, which is what caused the
// "Connection timeout" on Gmail. The public function signature below is
// unchanged, so every caller keeps working exactly as before.
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @param {Object} opts { to, subject, html, attachments? }
 */
async function sendEmail({ to, subject, html, attachments }) {
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      // Same shape as before: [{ filename, content }] where content is a Buffer.
      attachments,
    });
    // Resend reports API-level problems in `error` instead of throwing.
    if (error) throw new Error(error.message || JSON.stringify(error));
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    // Do not crash the request flow if email fails; log and continue.
    logger.error(`Email failed to ${to}: ${err.message}`);
  }
}

module.exports = sendEmail;
