/**
 * otpRoutes.js — Routes OTP avec rate limiting
 *
 * Sécurité appliquée :
 * - sendLimiter   : max 3 envois / 15 min / IP (anti-spam)
 * - verifyLimiter : max 10 tentatives / 15 min / IP (anti-bruteforce)
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const otpController = require('../controllers/otpController');

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  keyGenerator: (req) => {
    // Limiter par IP + identifier (email) pour éviter l'abus par email unique
    const identifier = (req.body?.identifier || '').toLowerCase().trim();
    return `${ipKeyGenerator(req)}:${identifier}`;
  },
  message: {
    success: false,
    message: 'Trop de demandes de code. Veuillez patienter 15 minutes avant de réessayer.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    success: false,
    message: 'Trop de tentatives de vérification. Veuillez patienter 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const finalizeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez patienter.',
  },
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/otp/send
 * @desc   Envoyer un code OTP par email (ou phone en v2)
 * @access Public
 */
router.post('/send', sendLimiter, otpController.sendOtp);

/**
 * @route  POST /api/otp/verify
 * @desc   Vérifier le code OTP → retourne verifiedToken
 * @access Public
 */
router.post('/verify', verifyLimiter, otpController.verifyOtp);

/**
 * @route  POST /api/otp/finalize-card
 * @desc   Créer compte + carte + Wallet pass (requiert verifiedToken)
 * @access Public (sécurisé par verifiedToken)
 */
router.post('/finalize-card', finalizeLimiter, otpController.finalizeCard);

/**
 * @route  POST /api/otp/login
 * @desc   Connexion client via OTP (requiert verifiedToken)
 * @access Public (sécurisé par verifiedToken)
 */
router.post('/login', verifyLimiter, otpController.loginWithOtp);

module.exports = router;
