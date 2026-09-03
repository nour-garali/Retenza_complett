/**
 * emailProvider.js
 *
 * Fournisseur d'envoi d'OTP par email (Nodemailer).
 * Interface : { send(to: string, code: string): Promise<void> }
 *
 * Le OTPService ne dépend jamais de ce module directement.
 * Il passe par l'interface commune, ce qui permet d'ajouter
 * un fournisseur SMS (Twilio, InfoBip...) sans modifier la logique métier.
 */

const nodemailer = require('nodemailer');

// ── Transporter (initialisé une seule fois) ───────────────────────────────────
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('[EmailProvider] Variables SMTP manquantes dans .env');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

let _transporter = null;
const getTransporter = () => {
  if (!_transporter) _transporter = createTransporter();
  return _transporter;
};

// ── Template HTML ─────────────────────────────────────────────────────────────
const buildEmailHtml = (code) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Votre code Retenza</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#D73E26;padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Retenza
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">
                Programme de fidélité
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1B100C;">
                Votre code de vérification
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#6B5E58;line-height:1.6;">
                Utilisez ce code pour accéder à votre carte de fidélité Retenza.
                Ce code expire dans <strong>10 minutes</strong>.
              </p>

              <!-- Code Box -->
              <div style="background:#FBF8F6;border:2px solid #EDE5DF;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#D73E26;font-family:'Courier New',monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin:0;font-size:13px;color:#9C8B82;line-height:1.6;">
                Si vous n'avez pas demandé ce code, ignorez cet email.
                Votre compte est en sécurité.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FBF8F6;border-top:1px solid #EDE5DF;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9C8B82;">
                © ${new Date().getFullYear()} Retenza — Programme de fidélité simplifié
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Interface publique ────────────────────────────────────────────────────────

/**
 * Envoie un OTP par email.
 * @param {string} to - Adresse email du destinataire
 * @param {string} code - Code OTP en clair (6 chiffres)
 */
const send = async (to, code) => {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || `"Retenza" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: `${code} — Votre code de vérification Retenza`,
    text: `Votre code Retenza est : ${code}\nIl expire dans 10 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez ce message.`,
    html: buildEmailHtml(code),
  });

  console.log(`[EmailProvider] OTP envoyé à ${to}`);
};

module.exports = { send };
