/**
 * otpService.js — Orchestrateur OTP
 *
 * Ce service est le seul point d'entrée pour toute logique OTP.
 * Il ne connaît pas le protocole de transport (email, SMS) — il délègue
 * au provider approprié via une interface commune { send(to, code) }.
 *
 * Responsabilités :
 *  - Générer un code aléatoire à 6 chiffres
 *  - Hacher le code (bcrypt) avant stockage
 *  - Invalider les anciens OTPs actifs du même identifier
 *  - Appeler le bon provider
 *  - Vérifier le code soumis (avec anti-bruteforce)
 *  - Émettre un verifiedToken JWT (usage unique, 15 min)
 *
 * Le contrôleur ne contient aucune logique OTP — il appelle uniquement ce service.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTPCode = require('../../models/OTPCode');
const emailProvider = require('./providers/emailProvider');
const smsProvider = require('./providers/smsProvider');

// ── Configuration ─────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const VERIFIED_TOKEN_EXPIRY = '15m';
const BCRYPT_ROUNDS = 10;

// ── Sélection du provider ─────────────────────────────────────────────────────
const getProvider = (type) => {
  if (type === 'email') return emailProvider;
  if (type === 'phone') return smsProvider;
  throw new Error(`Provider inconnu : ${type}`);
};

// ── Génération d'un code numérique aléatoire ──────────────────────────────────
const generateCode = () => {
  // crypto.randomInt est cryptographiquement sûr
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
};

// ── Clé secrète JWT (verifiedToken) ──────────────────────────────────────────
const getVerifiedTokenSecret = () => {
  const secret = process.env.OTP_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('[OTPService] JWT_SECRET non configuré dans .env');
  return secret;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère, stocke et envoie un OTP.
 *
 * @param {Object} params
 * @param {string} params.identifier      - Email ou numéro de téléphone
 * @param {string} params.identifierType  - 'email' | 'phone'
 * @param {string} params.purpose         - 'guest_card' | 'login'
 * @param {Object} params.metadata        - Données contextuelles (ex: { merchantCode })
 * @param {string} params.ipAddress       - IP du client (audit)
 * @param {string} params.userAgent       - User-Agent (audit)
 */
const sendOtp = async ({ identifier, identifierType = 'email', purpose, metadata = {}, ipAddress, userAgent }) => {
  const normalizedId = identifier.toLowerCase().trim();

  // 1. Invalider tous les OTPs actifs précédents pour cet identifier + purpose
  await OTPCode.updateMany(
    { identifier: normalizedId, purpose, verified: false, locked: false },
    { $set: { locked: true } }
  );

  // 2. Générer un code et le hacher
  const plainCode = generateCode();
  const codeHash = await bcrypt.hash(plainCode, BCRYPT_ROUNDS);

  // 3. Calculer l'expiration
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 4. Persister en base
  await OTPCode.create({
    identifier: normalizedId,
    identifierType,
    codeHash,
    expiresAt,
    purpose,
    metadata,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  // 5. Envoyer via le bon provider
  const provider = getProvider(identifierType);
  await provider.send(normalizedId, plainCode);

  console.log(`[OTPService] OTP envoyé → ${normalizedId} (purpose: ${purpose})`);

  return {
    identifier: normalizedId,
    expiresAt,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie un code OTP soumis par l'utilisateur.
 * Retourne un verifiedToken JWT (usage unique, 15 min) si correct.
 *
 * @param {Object} params
 * @param {string} params.identifier  - Email ou téléphone
 * @param {string} params.code        - Code saisi par l'utilisateur
 * @param {string} params.purpose     - 'guest_card' | 'login'
 * @param {string} params.ipAddress   - IP (audit)
 */
const verifyOtp = async ({ identifier, code, purpose, ipAddress }) => {
  const normalizedId = identifier.toLowerCase().trim();

  // 1. Trouver l'OTP actif le plus récent (non vérifié, non expiré, non bloqué)
  const otpDoc = await OTPCode.findOne({
    identifier: normalizedId,
    purpose,
    verified: false,
    locked: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select('+codeHash'); // codeHash est select:false par défaut

  if (!otpDoc) {
    throw Object.assign(new Error('Code invalide ou expiré. Veuillez demander un nouveau code.'), { statusCode: 400 });
  }

  // 2. Incrémenter les tentatives d'abord (avant la vérification)
  otpDoc.attempts += 1;

  // 3. Vérifier le nombre de tentatives
  if (otpDoc.attempts > MAX_ATTEMPTS) {
    otpDoc.locked = true;
    await otpDoc.save();
    throw Object.assign(new Error('Trop de tentatives. Veuillez demander un nouveau code.'), { statusCode: 429 });
  }

  // 4. Comparer le code soumis avec le hash
  const isValid = await bcrypt.compare(code.trim(), otpDoc.codeHash);

  if (!isValid) {
    await otpDoc.save(); // Sauvegarder le compteur de tentatives
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    throw Object.assign(
      new Error(`Code incorrect. ${remaining > 0 ? `${remaining} tentative(s) restante(s).` : 'Compte bloqué.'}`),
      { statusCode: 400 }
    );
  }

  // 5. Marquer comme vérifié (invalider pour usage futur)
  otpDoc.verified = true;
  await otpDoc.save();

  // 6. Émettre un verifiedToken JWT (usage unique, 15 min)
  const verifiedToken = jwt.sign(
    {
      identifier: normalizedId,
      identifierType: otpDoc.identifierType,
      purpose,
      metadata: otpDoc.metadata,
      otpId: otpDoc._id.toString(),
    },
    getVerifiedTokenSecret(),
    { expiresIn: VERIFIED_TOKEN_EXPIRY }
  );

  console.log(`[OTPService] OTP vérifié → ${normalizedId} (purpose: ${purpose}, IP: ${ipAddress})`);

  return {
    verifiedToken,
    identifier: normalizedId,
    identifierType: otpDoc.identifierType,
    metadata: otpDoc.metadata,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DECODE VERIFIED TOKEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Décode et valide un verifiedToken.
 * Utilisé par finalizeGuestCard pour s'assurer que l'OTP a bien été vérifié.
 *
 * @param {string} token
 * @returns {Object} payload décodé
 */
const decodeVerifiedToken = (token) => {
  try {
    const payload = jwt.verify(token, getVerifiedTokenSecret());
    return payload;
  } catch (err) {
    throw Object.assign(new Error('Session expirée. Veuillez recommencer.'), { statusCode: 401 });
  }
};

module.exports = { sendOtp, verifyOtp, decodeVerifiedToken };
