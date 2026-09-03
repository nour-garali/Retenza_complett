/**
 * partnershipController.js
 *
 * Gère :
 *  - submitRequest    : soumission publique d'une demande de partenariat
 *  - activateAccount  : création du mot de passe + activation du compte
 *  - resendActivation : renvoi du lien d'activation (rate-limited)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const PartnershipRequest = require('../models/PartnershipRequest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/generateToken');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère un token d'activation aléatoire, retourne :
 * { rawToken, hashedToken, expiresAt }
 */
const generateActivationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { rawToken, hashedToken, expiresAt };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/partnership-requests/check-email?email=...  (public)
// Vérifie la disponibilité d'un email dès l'étape 1 du formulaire.
// Retourne toujours 200 avec un { available, code, message } structuré.
// Ne révèle jamais d'informations sensibles (pas de données utilisateur).
// ─────────────────────────────────────────────────────────────────────────────
exports.checkEmail = asyncHandler(async (req, res) => {
  const email = (req.query.email || '').toLowerCase().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json({ available: false, code: 'INVALID_EMAIL', message: 'Adresse email invalide.' });
  }

  // Règle 1 : Demande PENDING déjà en cours
  const pending = await PartnershipRequest.findOne({ contactEmail: email, status: 'PENDING' });
  if (pending) {
    return res.json({
      available: false,
      code: 'ALREADY_PENDING',
      message: 'Une demande de partenariat est déjà en cours pour cet email. Notre équipe l\'examine, veuillez patienter.',
    });
  }

  // Règle 2 : Demande APPROVED ou compte en attente d'activation
  const approved = await PartnershipRequest.findOne({ contactEmail: email, status: 'APPROVED' });
  const pendingUser = await User.findOne({ email, status: 'pending_activation' });
  if (approved || pendingUser) {
    return res.json({
      available: false,
      code: 'PENDING_ACTIVATION',
      message: 'Votre demande a déjà été approuvée. Consultez votre email pour activer votre compte.',
    });
  }

  // Règle 3 : Compte actif existant
  const activeUser = await User.findOne({ email, status: 'active' });
  if (activeUser) {
    return res.json({
      available: false,
      code: 'ALREADY_ACTIVE',
      message: 'Un compte Retenza est déjà actif pour cet email. Connectez-vous pour accéder à votre espace.',
    });
  }

  // Règle 4 : Demande REJECTED → email disponible pour une nouvelle demande
  return res.json({ available: true, code: 'OK', message: 'Email disponible.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/partnership-requests  (public, sans auth)
// ─────────────────────────────────────────────────────────────────────────────
exports.submitRequest = asyncHandler(async (req, res) => {
  const {
    businessName, category, address, city, phone, contactEmail, website,
    ownerFirstName, ownerLastName, ownerRole, ownerPhone,
    numberOfLocations, loyaltyProgramType, message,
  } = req.body;

  // 1. Vérifier email obligatoire
  if (!contactEmail || !businessName || !ownerFirstName || !ownerLastName || !category) {
    return res.status(400).json({
      success: false,
      message: 'Champs obligatoires manquants (businessName, category, contactEmail, ownerFirstName, ownerLastName).',
    });
  }

  const emailLower = contactEmail.toLowerCase().trim();

  // ── Règle 1 : Demande PENDING déjà en cours → bloquer ─────────────────────
  const existingPending = await PartnershipRequest.findOne({
    contactEmail: emailLower,
    status: 'PENDING',
  });
  if (existingPending) {
    return res.status(409).json({
      success: false,
      code: 'ALREADY_PENDING',
      message: 'Une demande de partenariat est déjà en cours pour cet email. Notre équipe l\'examine. Veuillez patienter.',
    });
  }

  // ── Règle 2 : Demande APPROVED ou compte PENDING_ACTIVATION → proposer renvoi activation ──
  const existingApproved = await PartnershipRequest.findOne({
    contactEmail: emailLower,
    status: 'APPROVED',
  });
  const existingPendingUser = await User.findOne({
    email: emailLower,
    status: 'pending_activation',
  });
  if (existingApproved || existingPendingUser) {
    return res.status(409).json({
      success: false,
      code: 'PENDING_ACTIVATION',
      message: 'Votre demande a déjà été approuvée. Consultez votre boîte email pour activer votre compte. Vous pouvez demander un renvoi du lien d\'activation si besoin.',
    });
  }

  // ── Règle 3 : Compte commerçant ACTIF → proposer connexion ────────────────
  const existingActiveUser = await User.findOne({
    email: emailLower,
    status: 'active',
  });
  if (existingActiveUser) {
    return res.status(409).json({
      success: false,
      code: 'ALREADY_ACTIVE',
      message: 'Un compte commerçant Retenza est déjà actif pour cet email. Connectez-vous pour accéder à votre espace.',
    });
  }

  // ── Règle 4 : Demande REJECTED → autoriser, conserver l'historique ─────────
  // (aucune vérification supplémentaire — la demande REJECTED ne bloque pas)



  // 4. Créer la demande — statut PENDING, aucun User créé
  const request = await PartnershipRequest.create({
    businessName: businessName.trim(),
    category: category.trim(),
    address: address?.trim(),
    city: city?.trim(),
    phone: phone?.trim(),
    contactEmail: emailLower,
    website: website?.trim() || null,
    ownerFirstName: ownerFirstName.trim(),
    ownerLastName: ownerLastName.trim(),
    ownerRole: ownerRole?.trim() || 'Gérant',
    ownerPhone: ownerPhone?.trim(),
    numberOfLocations: numberOfLocations || 1,
    loyaltyProgramType: loyaltyProgramType || 'unknown',
    message: message?.trim() || '',
    status: 'PENDING',
  });

  // 5. Réponse — pas de token, pas de session, pas de redirection Dashboard
  res.status(201).json({
    success: true,
    message: 'Votre demande de partenariat a bien été envoyée. Elle est en cours de vérification.',
    data: {
      requestId: request._id,
      businessName: request.businessName,
      status: request.status,
      submittedAt: request.createdAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/activate-account  (public)
// Body : { token, password, confirmPassword }
// ─────────────────────────────────────────────────────────────────────────────
exports.activateAccount = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token et mot de passe requis.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas.' });
  }

  // 1. Hasher le token reçu pour le comparer à la base
  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  // 2. Trouver l'utilisateur avec ce token (select forcé car select:false)
  const user = await User.findOne({
    activationTokenHash: hashedToken,
  }).select('+activationTokenHash +password');

  if (!user) {
    return res.status(400).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Ce lien d\'activation est invalide ou n\'existe plus.',
    });
  }

  // 3. Vérifier l'expiration
  if (user.activationTokenExpiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Ce lien d\'activation a expiré. Demandez un nouveau lien.',
    });
  }

  // 4. Vérifier que le compte est bien PENDING_ACTIVATION (pas déjà activé)
  if (user.status !== 'pending_activation') {
    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_ACTIVE',
        message: 'Votre compte est déjà activé. Connectez-vous.',
      });
    }
    return res.status(400).json({
      success: false,
      code: 'INVALID_STATUS',
      message: 'Ce compte ne peut pas être activé.',
    });
  }

  // 5. Tout est valide → activer le compte
  user.password = password;           // Le hook pre-save hashe automatiquement
  user.status = 'active';
  user.isActive = true;
  user.emailVerified = true;
  user.activationTokenHash = null;
  user.activationTokenExpiresAt = null;
  await user.save();

  // 6. Créer la session JWT (même mécanisme que le login)
  const jwtToken = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Compte activé avec succès. Bienvenue sur Retenza !',
    data: {
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        commerce: user.commerce,
        status: user.status,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-activation  (public, rate limited via express-rate-limit)
// Body : { email }
// ─────────────────────────────────────────────────────────────────────────────
exports.resendActivation = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Réponse générique pour éviter de révéler si un email existe
  const genericOk = () =>
    res.json({
      success: true,
      message: 'Si un compte en attente d\'activation existe pour cet email, un nouveau lien a été envoyé.',
    });

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requis.' });
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: 'merchant',
    status: 'pending_activation',
  }).select('+activationTokenHash');

  if (!user) return genericOk();

  // Trouver la PartnershipRequest associée pour le nom du commerce
  const PartnershipRequest = require('../models/PartnershipRequest');
  const request = await PartnershipRequest.findOne({ createdUser: user._id });
  const businessName = request?.businessName || 'votre commerce';

  // Générer un nouveau token (invalide l'ancien automatiquement)
  const { rawToken, hashedToken, expiresAt } = generateActivationToken();
  user.activationTokenHash = hashedToken;
  user.activationTokenExpiresAt = expiresAt;
  await user.save();

  // Envoyer le nouvel email
  try {
    const { sendResendActivationEmail } = require('../services/emailService');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    await sendResendActivationEmail({
      to: user.email,
      businessName,
      activationUrl: `${frontendUrl}/activate-account?token=${rawToken}`,
    });
  } catch (err) {
    console.error('[resendActivation] Erreur envoi email:', err.message);
  }

  return genericOk();
});

module.exports = exports;
