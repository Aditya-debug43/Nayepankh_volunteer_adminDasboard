const https = require('https');
const logger = require('./logger');

// Brevo (formerly Sendinblue) transactional email over its HTTPS API (port 443).
// This avoids SMTP ports (25 / 465 / 587), which Railway and Render block — that block
// was the cause of the earlier 2-minute "Connection timeout". Uses only Node's built-in
// `https` module, so there is no extra dependency to install and it runs on any Node version.
// The exported function signature is unchanged, so every caller keeps working as-is.

const BREVO_HOST = 'api.brevo.com';
const BREVO_PATH = '/v3/smtp/email';

// Accepts EMAIL_FROM as either "Name <email@x.com>" or just "email@x.com".
function parseSender(from) {
  const m = /^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/.exec(from || '');
  if (m) return { name: (m[1] || '').trim() || 'NayePankh Foundation', email: m[2].trim() };
  return { name: 'NayePankh Foundation', email: (from || '').trim() };
}

function postToBrevo(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: BREVO_HOST,
        path: BREVO_PATH,
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY || '',
          'Content-Type': 'application/json',
          accept: 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
          else reject(new Error(`Brevo responded ${res.statusCode}: ${body}`));
        });
      }
    );
    // Fail fast rather than hanging if the network stalls.
    req.setTimeout(20000, () => req.destroy(new Error('Brevo request timed out')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * @param {Object} opts { to, subject, html, attachments? }
 */
async function sendEmail({ to, subject, html, attachments }) {
  try {
    const payload = {
      sender: parseSender(process.env.EMAIL_FROM),
      to: Array.isArray(to) ? to.map((e) => ({ email: e })) : [{ email: to }],
      subject,
      htmlContent: html,
    };
    // Map nodemailer-style attachments [{ filename, content: Buffer }] to Brevo's
    // [{ name, content: <base64> }] shape, so callers (e.g. the certificate email) don't change.
    if (attachments && attachments.length) {
      payload.attachment = attachments.map((a) => ({
        name: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
      }));
    }
    await postToBrevo(payload);
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    // Do not crash the request flow if email fails; log and continue.
    logger.error(`Email failed to ${to}: ${err.message}`);
  }
}

module.exports = sendEmail;
