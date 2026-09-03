/**
 * otpController.js — Contrôleur OTP (très léger)
 *
 * Ce contrôleur ne contient aucune logique métier.
 * Il :
 *  1. Valide les inputs (format email, longueur code...)
 *  2. Appelle otpService
 *  3. Retourne la réponse HTTP
 *
 * Endpoints couverts :
 *  POST /api/otp/send            → Envoyer un OTP
 *  POST /api/otp/verify          → Vérifier un OTP → verifiedToken
 *  POST /api/otp/finalize-card   → Créer compte + carte + Wallet pass
 */

const otpService = require('../services/otp/otpService');
const User = require('../models/User');
const Client = require('../models/Client');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const walletService = require('../services/walletService');
const asyncHandler = require('../utils/asyncHandler');

// Helpers pour trouver le commerce (réutilise la logique existante)
const Commerce = require('../models/Commerce');
const QRCode = require('../models/QRCode');

const findCommerceByCode = async (code) => {
  const upperCode = code.toUpperCase();
  let commerce = await Commerce.findOne({ merchantCode: upperCode });
  if (commerce) return commerce;
  const qrDoc = await QRCode.findOne({ code: upperCode }).select('commerce');
  if (!qrDoc) return null;
  return Commerce.findById(qrDoc.commerce);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/otp/send
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie un OTP.
 * Body: { identifier, identifierType?, purpose, metadata? }
 */
exports.sendOtp = asyncHandler(async (req, res) => {
  const { identifier, identifierType = 'email', purpose, metadata = {} } = req.body;

  // Validation
  if (!identifier || !purpose) {
    return res.status(400).json({ success: false, message: 'identifier et purpose sont requis.' });
  }

  if (!['guest_card', 'login'].includes(purpose)) {
    return res.status(400).json({ success: false, message: 'Purpose invalide.' });
  }

  if (identifierType === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      return res.status(400).json({ success: false, message: "Format d'email invalide." });
    }
  }

  // Si purpose = guest_card, vérifier que le commerçant existe et est actif
  if (purpose === 'guest_card') {
    const merchantCode = metadata?.merchantCode;
    if (!merchantCode) {
      return res.status(400).json({ success: false, message: 'merchantCode requis pour guest_card.' });
    }
    const commerce = await findCommerceByCode(merchantCode);
    if (!commerce || commerce.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Commerce introuvable ou inactif.' });
    }
    // Stocker l'ID réel du commerce dans metadata pour finalizeCard
    metadata.commerceId = commerce._id.toString();
    metadata.commerceName = commerce.name;
  }

  const ipAddress = req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const result = await otpService.sendOtp({
    identifier,
    identifierType,
    purpose,
    metadata,
    ipAddress,
    userAgent,
  });

  return res.json({
    success: true,
    message: `Code envoyé à ${identifier}. Valide ${result.expiresInMinutes} minutes.`,
    data: {
      expiresInMinutes: result.expiresInMinutes,
      expiresAt: result.expiresAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/otp/verify
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie un OTP et retourne un verifiedToken JWT.
 * Body: { identifier, code, purpose }
 */
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, code, purpose } = req.body;

  if (!identifier || !code || !purpose) {
    return res.status(400).json({ success: false, message: 'identifier, code et purpose sont requis.' });
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ success: false, message: 'Le code doit être composé de 6 chiffres.' });
  }

  const ipAddress = req.ip || req.connection?.remoteAddress;

  const result = await otpService.verifyOtp({ identifier, code, purpose, ipAddress });

  return res.json({
    success: true,
    message: 'Code vérifié avec succès.',
    data: {
      verifiedToken: result.verifiedToken,
      identifier: result.identifier,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/otp/finalize-card
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finalise la création de la carte de fidélité après vérification OTP.
 * - Crée le compte client s'il n'existe pas (sans mot de passe)
 * - Crée un LoyaltyAccount pour le commerçant
 * - Génère le Google Wallet pass
 * - Retourne l'URL d'ajout Wallet + le JWT de session client
 *
 * Body: { verifiedToken, firstName, lastName }
 */
exports.finalizeCard = asyncHandler(async (req, res) => {
  const { verifiedToken, firstName, lastName } = req.body;

  if (!verifiedToken) {
    return res.status(400).json({ success: false, message: 'verifiedToken est requis.' });
  }

  // 1. Décoder et valider le verifiedToken
  const payload = otpService.decodeVerifiedToken(verifiedToken);

  if (payload.purpose !== 'guest_card') {
    return res.status(400).json({ success: false, message: 'Token invalide pour cette opération.' });
  }

  const { identifier, metadata } = payload;
  const { commerceId, merchantCode } = metadata || {};

  if (!commerceId) {
    return res.status(400).json({ success: false, message: 'Contexte commerçant manquant.' });
  }

  // 2. Charger le commerce
  const commerce = await Commerce.findById(commerceId);
  if (!commerce || commerce.status !== 'active') {
    return res.status(404).json({ success: false, message: 'Commerce introuvable ou inactif.' });
  }

  // 3. Trouver ou créer le compte client (sans mot de passe)
  let user = await User.findOne({ email: identifier });
  let isNewUser = false;

  if (!user) {
    // Si pas de nom fourni (nouveau flow), extraire du nom d'email
    const fallbackName = identifier.split('@')[0];
    
    user = await User.create({
      email: identifier,
      firstName: (firstName || fallbackName).trim(),
      lastName: (lastName || 'Client').trim(),
      role: 'client',
      authMethod: 'otp',
    });
    isNewUser = true;
    console.log(`[OTPController] Nouveau client créé : ${identifier}`);
  }

  // 4. Trouver ou créer le profil Client lié au User
  let clientProfile = await Client.findOne({ user: user._id });
  if (!clientProfile) {
    try {
      clientProfile = await Client.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        user: user._id,
      });
    } catch (err) {
      // Si le client existe déjà par email (race condition), on le récupère
      clientProfile = await Client.findOne({ email: identifier });
    }
  }

  // 5. Trouver ou créer le LoyaltyAccount (carte de fidélité)
  let loyaltyAccount = await LoyaltyAccount.findOne({
    client: clientProfile._id,
    commerce: commerce._id,
  });

  let isNewCard = false;
  if (!loyaltyAccount) {
    loyaltyAccount = await LoyaltyAccount.create({
      client: clientProfile._id,
      commerce: commerce._id,
      points: 0,
      stamps: 0,
      cashbackBalance: 0,
      acquisitionSource: 'qr_scan',
    });
    isNewCard = true;
    console.log(`[OTPController] Nouvelle carte créée pour ${identifier} chez ${commerce.name}`);
  }

  // 6. Générer le Google Wallet pass
  let walletUrl = null;
  let walletObjectId = null;
  try {
    const walletResult = await walletService.generateWalletPass(
      clientProfile,
      commerce,
      loyaltyAccount,
      'google'
    );
    walletUrl = walletResult.passUrl;
    walletObjectId = walletResult.objectId;

    if (walletObjectId && !loyaltyAccount.walletObjectId) {
      loyaltyAccount.walletObjectId = walletObjectId;
      await loyaltyAccount.save();
    }
  } catch (walletErr) {
    console.warn(`[OTPController] Wallet génération échouée (non bloquant) :`, walletErr.message);
  }

  // 7. Émettre le JWT de session client
  const jwt = require('jsonwebtoken');
  const sessionToken = jwt.sign(
    { id: user._id, email: user.email, role: 'client', authMethod: 'otp' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  return res.status(isNewUser ? 201 : 200).json({
    success: true,
    data: {
      isNewUser,
      isNewCard,
      sessionToken,
      walletUrl,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      commerce: {
        name: commerce.name,
        category: commerce.category,
      },
      loyaltyAccount: {
        id: loyaltyAccount._id,
        points: loyaltyAccount.points,
        stamps: loyaltyAccount.stamps,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/otp/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Connexion client via OTP (verifiedToken déjà obtenu).
 * Retourne le JWT de session + les données du profil.
 * Body: { verifiedToken }
 */
exports.loginWithOtp = asyncHandler(async (req, res) => {
  const { verifiedToken } = req.body;

  if (!verifiedToken) {
    return res.status(400).json({ success: false, message: 'verifiedToken requis.' });
  }

  const payload = otpService.decodeVerifiedToken(verifiedToken);

  if (payload.purpose !== 'login') {
    return res.status(400).json({ success: false, message: 'Token invalide pour cette opération.' });
  }

  const { identifier } = payload;

  // Trouver le compte client
  const user = await User.findOne({ email: identifier, role: 'client' });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Aucun compte trouvé avec cet email. Scannez un QR Code pour créer votre compte.",
    });
  }

  // Émettre le JWT de session
  const jwt = require('jsonwebtoken');
  const sessionToken = jwt.sign(
    { id: user._id, email: user.email, role: 'client', authMethod: 'otp' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  console.log(`[OTPController] Connexion OTP réussie : ${identifier}`);

  return res.json({
    success: true,
    data: {
      token: sessionToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    },
  });
});
