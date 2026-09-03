/**
 * emailService.js
 * Service email générique pour Retenza.
 * Réutilise la config SMTP du .env (même que OTP).
 * Envoie les emails d'activation, refus, renvoi d'activation.
 */

const nodemailer = require('nodemailer');

let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error('[EmailService] Variables SMTP manquantes dans .env');
    }
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return _transporter;
};

// ── Wrapper commun ────────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || '"Retenza" <no-reply@retenza.com>';
  await transporter.sendMail({ from, to, subject, html });
  console.log(`[EmailService] Email envoyé à ${to} — Sujet : ${subject}`);
};

// ── Templates ─────────────────────────────────────────────────────────────────
const baseStyle = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #F5F0EB;
  margin: 0; padding: 0;
`;

const card = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="${baseStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0D1117;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#D73E26;letter-spacing:-0.5px;">retenza.</span>
          </td>
        </tr>
        <tr><td style="padding:40px;">${content}</td></tr>
        <tr>
          <td style="background:#F5F0EB;padding:20px 40px;text-align:center;">
            <p style="font-size:11px;color:#9C8B82;margin:0;">
              © ${new Date().getFullYear()} Retenza Connect — Ne pas répondre à cet email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const btnStyle = `
  display:inline-block;background:#D73E26;color:#ffffff;
  text-decoration:none;padding:14px 32px;border-radius:12px;
  font-weight:700;font-size:15px;margin:24px 0;
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Email d'activation (après acceptation Admin)
// ─────────────────────────────────────────────────────────────────────────────
const sendActivationEmail = async ({ to, businessName, activationUrl }) => {
  const html = card(`
    <h2 style="color:#0D1117;font-size:24px;font-weight:800;margin:0 0 8px;">
      Votre partenariat avec Retenza est accepté 🎉
    </h2>
    <p style="color:#5D534F;font-size:14px;margin:0 0 20px;">
      Félicitations ! Votre commerce <strong>${businessName}</strong> a été approuvé par notre équipe.
    </p>
    <p style="color:#5D534F;font-size:14px;margin:0 0 8px;">
      Votre espace partenaire est prêt. Cliquez sur le bouton ci-dessous pour créer votre mot de passe
      et accéder à votre tableau de bord.
    </p>
    <div style="text-align:center;">
      <a href="${activationUrl}" style="${btnStyle}">
        Activer mon compte
      </a>
    </div>
    <p style="color:#9C8B82;font-size:12px;text-align:center;margin:0;">
      Ce lien est valable <strong>24 heures</strong>. Passé ce délai, contactez notre support.
    </p>
    <hr style="border:none;border-top:1px solid #EDE5DF;margin:24px 0;"/>
    <p style="color:#9C8B82;font-size:11px;text-align:center;margin:0;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
    </p>
  `);

  await sendMail({
    to,
    subject: 'Votre partenariat avec Retenza est accepté 🎉',
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Email de refus
// ─────────────────────────────────────────────────────────────────────────────
const sendRejectionEmail = async ({ to, businessName, reason }) => {
  const reasonText = reason
    ? `<p style="color:#5D534F;font-size:14px;margin:16px 0 0;padding:16px;background:#FFF5F2;border-radius:10px;border-left:3px solid #D73E26;">
        <strong>Motif :</strong> ${reason}
       </p>`
    : '';

  const html = card(`
    <h2 style="color:#0D1117;font-size:22px;font-weight:800;margin:0 0 8px;">
      Suite à votre demande de partenariat
    </h2>
    <p style="color:#5D534F;font-size:14px;margin:0 0 16px;">
      Nous avons bien examiné la demande de partenariat de <strong>${businessName}</strong>.
    </p>
    <p style="color:#5D534F;font-size:14px;margin:0;">
      Après analyse, nous ne sommes pas en mesure d'accepter votre demande pour le moment.
    </p>
    ${reasonText}
    <p style="color:#5D534F;font-size:14px;margin:20px 0 0;">
      Vous pouvez soumettre une nouvelle demande si votre situation évolue ou nous contacter
      à <a href="mailto:support@retenza.com" style="color:#D73E26;">support@retenza.com</a>.
    </p>
  `);

  await sendMail({
    to,
    subject: 'Réponse à votre demande de partenariat Retenza',
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Email de renvoi d'activation
// ─────────────────────────────────────────────────────────────────────────────
const sendResendActivationEmail = async ({ to, businessName, activationUrl }) => {
  const html = card(`
    <h2 style="color:#0D1117;font-size:22px;font-weight:800;margin:0 0 8px;">
      Nouveau lien d'activation
    </h2>
    <p style="color:#5D534F;font-size:14px;margin:0 0 20px;">
      Voici un nouveau lien pour activer votre compte commerçant <strong>${businessName}</strong>.
    </p>
    <div style="text-align:center;">
      <a href="${activationUrl}" style="${btnStyle}">Activer mon compte</a>
    </div>
    <p style="color:#9C8B82;font-size:12px;text-align:center;margin:0;">
      Ce lien est valable <strong>24 heures</strong>. L'ancien lien a été invalidé.
    </p>
  `);

  await sendMail({
    to,
    subject: 'Nouveau lien d\'activation — Retenza Connect',
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Email de réinitialisation de mot de passe
// ─────────────────────────────────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const html = card(`
    <h2 style="color:#0D1117;font-size:22px;font-weight:800;margin:0 0 8px;">
      Réinitialisation de votre mot de passe
    </h2>
    <p style="color:#5D534F;font-size:14px;margin:0 0 20px;">
      Vous avez demandé à réinitialiser votre mot de passe. Cliquez ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <div style="text-align:center;">
      <a href="${resetUrl}" style="${btnStyle}">Réinitialiser mon mot de passe</a>
    </div>
    <p style="color:#9C8B82;font-size:12px;text-align:center;margin:0;">
      Ce lien est valable <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
    </p>
  `);

  await sendMail({
    to,
    subject: 'Réinitialisation de votre mot de passe — Retenza Connect',
    html,
  });
};

module.exports = {
  sendActivationEmail,
  sendRejectionEmail,
  sendResendActivationEmail,
  sendPasswordResetEmail,
};
