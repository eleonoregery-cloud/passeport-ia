import nodemailer from 'nodemailer';

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, company, message, website } = req.body || {};

  // Piège anti-spam : un humain ne remplit jamais ce champ caché.
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Merci de renseigner votre nom, un e-mail valide et un message.' });
    return;
  }
  if (message.length > 5000) {
    res.status(400).json({ error: 'Message trop long.' });
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `"Formulaire Passeport IA" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      replyTo: `${name} <${email}>`,
      subject: `Nouveau message de contact — ${name}${company ? ' (' + company + ')' : ''}`,
      text: `Nom : ${name}\nE-mail : ${email}\nEntreprise : ${company || '—'}\n\nMessage :\n${message}`,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact email failed:', err.message);
    res.status(502).json({ error: "L'envoi a échoué, réessayez dans un instant.", debug: err.message, code: err.code });
  }
}
