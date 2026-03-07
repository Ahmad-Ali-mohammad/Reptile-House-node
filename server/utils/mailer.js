import nodemailer from 'nodemailer';

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function normalizeRecipients(input) {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((value) => String(value || '').trim()).filter(Boolean)));
  }

  return Array.from(
    new Set(
      String(input || '')
        .split(/[,\n;]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function getMailAuth() {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  return user && pass ? { user, pass } : null;
}

function getMailFrom() {
  const address = String(process.env.MAIL_FROM || process.env.SMTP_USER || '').trim();
  const name = String(process.env.MAIL_FROM_NAME || 'Reptile House').trim();
  if (!address) return '';
  return name ? `${name} <${address}>` : address;
}

let transporter = null;

function createTransporter() {
  const auth = getMailAuth();
  if (!auth) return null;

  const port = Number.parseInt(String(process.env.SMTP_PORT || '465'), 10) || 465;
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

  return nodemailer.createTransport({
    host: String(process.env.SMTP_HOST || 'smtp.gmail.com').trim() || 'smtp.gmail.com',
    port,
    secure,
    auth,
  });
}

export function isMailConfigured() {
  const auth = getMailAuth();
  const enabled = parseBoolean(process.env.MAIL_ENABLED, Boolean(auth));
  return enabled && Boolean(auth) && Boolean(getMailFrom());
}

export async function sendMail({ to, subject, text, html }) {
  const recipients = normalizeRecipients(to);
  if (!recipients.length || !isMailConfigured()) {
    return { skipped: true, recipients };
  }

  if (!transporter) {
    transporter = createTransporter();
  }

  if (!transporter) {
    return { skipped: true, recipients };
  }

  return transporter.sendMail({
    from: getMailFrom(),
    to: recipients.join(', '),
    replyTo: String(process.env.MAIL_REPLY_TO || '').trim() || undefined,
    subject,
    text,
    html,
  });
}
