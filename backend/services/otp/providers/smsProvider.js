/**
 * smsProvider.js — Stub v1
 *
 * Ce fournisseur sera implémenté en v2 avec Twilio / InfoBip / Orange SMS.
 * L'interface est identique à emailProvider pour permettre un swap transparent.
 *
 * Interface : { send(to: string, code: string): Promise<void> }
 */

/**
 * @param {string} to - Numéro de téléphone international
 * @param {string} code - Code OTP 6 chiffres
 */
const send = async (to, code) => {
  // v2: intégrer Twilio / InfoBip ici
  console.warn(`[SmsProvider] SMS non configuré (v1). OTP pour ${to} : ${code}`);
  throw new Error('SMS provider non configuré. Utilisez le canal email.');
};

module.exports = { send };
