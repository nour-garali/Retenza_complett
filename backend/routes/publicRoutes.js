const express = require('express');
const {
  getPublicMerchant,
  recordScan,
  createGuestCard,
  generateWalletPassForGuest,
  manualReconcile,
  lookupCardByPublicId,
} = require('../controllers/publicController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Simple in-memory rate limiter (production: use express-rate-limit with Redis store)
const rateLimiter = (maxRequests, windowMs) => {
  const store = new Map(); // key: IP, value: { count, resetAt }

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count++;
    return next();
  };
};

// Rate limit configs
const scanLimit   = rateLimiter(10, 60 * 1000);       // 10 scans/min per IP
const merchantLimit = rateLimiter(60, 60 * 1000);      // 60 lookups/min per IP
const createLimit = rateLimiter(5, 60 * 1000);         // 5 card creations/min per IP
const walletLimit = rateLimiter(10, 60 * 1000);        // 10 wallet passes/min per IP

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — No JWT authentication required
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/public/merchant/{code}:
 *   get:
 *     summary: Get public merchant profile by QR code
 *     description: Returns the public-facing profile of a merchant. No authentication required. Used by the QR landing page.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string, example: ABC123 }
 *     responses:
 *       200:
 *         description: Merchant public profile
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 name: Café du Coin
 *                 category: Restauration
 *                 primaryColor: "#6F4E37"
 *                 loyaltyProgram:
 *                   type: stamps
 *                   totalStamps: 10
 *                   reward: 1 café offert
 *       404:
 *         description: Merchant not found
 */
router.get('/merchant/:code', merchantLimit, getPublicMerchant);

/**
 * GET /api/public/merchant/:code/check-email?email=xxx
 * Vérifie si un email est déjà associé à une carte de fidélité chez ce commerçant.
 */
router.get('/merchant/:code/check-email', merchantLimit, async (req, res) => {
  try {
    const { code } = req.params;
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'email requis' });
    }
    const Commerce = require('../models/Commerce');
    const User = require('../models/User');
    const Client = require('../models/Client');
    const LoyaltyAccount = require('../models/LoyaltyAccount');

    const commerce = await Commerce.findOne({ merchantPublicId: code, status: 'active' });
    if (!commerce) return res.json({ success: true, registered: false });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ success: true, registered: false });

    const clientProfile = await Client.findOne({ user: user._id });
    if (!clientProfile) return res.json({ success: true, registered: false });

    const loyaltyAccount = await LoyaltyAccount.findOne({
      client: clientProfile._id,
      commerce: commerce._id,
    });

    return res.json({ success: true, registered: !!loyaltyAccount });
  } catch (err) {
    console.error('[check-email]', err);
    return res.json({ success: true, registered: false });
  }
});

/**
 * @swagger
 * /api/public/merchant/{code}/scan:
 *   post:
 *     summary: Record a QR code scan (statistics)
 *     description: Fire-and-forget scan recording. Deduplicated per IP per hour.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userAgent: { type: string }
 *               source:
 *                 type: string
 *                 enum: [qr_camera, link, app]
 *     responses:
 *       200:
 *         description: Scan recorded or deduplicated
 */
router.post('/merchant/:code/scan', scanLimit, recordScan);

/**
 * @swagger
 * /api/public/loyalty-card/create:
 *   post:
 *     summary: Create a Guest Loyalty Card
 *     description: Creates a loyalty card for a visitor without a Retenza account. Returns the existing card if one is found.
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchantCode, firstName, lastName, email, phone]
 *             properties:
 *               merchantCode: { type: string, example: ABC123 }
 *               firstName: { type: string, example: Marie }
 *               lastName: { type: string, example: Dupont }
 *               email: { type: string, example: marie@exemple.com }
 *               phone: { type: string, example: "+33612345678" }
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 cardPublicId: RTC-A1B2-C3D4
 *                 isNewCard: true
 *                 message: Votre carte a été créée avec succès !
 *       200:
 *         description: Existing card returned (no duplicate created)
 *       400:
 *         description: Validation error
 *       404:
 *         description: Merchant not found or inactive
 */
router.post('/loyalty-card/create', createLimit, createGuestCard);

/**
 * @swagger
 * /api/public/loyalty-card/wallet-pass:
 *   post:
 *     summary: Generate a Wallet pass on demand (Lazy Pass Generation)
 *     description: Generates a Google or Apple Wallet pass only when the user explicitly requests it. Follows the Lazy Pass Generation architecture.
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardPublicId, provider]
 *             properties:
 *               cardPublicId: { type: string, example: RTC-A1B2-C3D4 }
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *     responses:
 *       200:
 *         description: Wallet pass URL generated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 provider: google
 *                 addUrl: "https://pay.google.com/gp/v/save/..."
 *       404:
 *         description: Card not found
 */
router.post('/loyalty-card/wallet-pass', walletLimit, generateWalletPassForGuest);

/**
 * @swagger
 * /api/public/loyalty-card/lookup/{cardPublicId}:
 *   get:
 *     summary: Look up a Guest Loyalty Card by its public ID
 *     description: |
 *       Used by the Retenza Flutter app after scanning the QR code embedded
 *       in a Google Wallet or Apple Wallet pass.
 *       Returns only non-sensitive data (first name + merchant info) to let
 *       the user confirm "Yes, this is my card" before triggering reconciliation.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: cardPublicId
 *         required: true
 *         schema:
 *           type: string
 *           example: RTC-A1B2-C3D4
 *     responses:
 *       200:
 *         description: Card found
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 cardPublicId: RTC-A1B2-C3D4
 *                 status: active
 *                 firstName: Marie
 *                 merchant:
 *                   name: Café du Coin
 *                   brandColor: "#6F4E37"
 *                   publicCode: ABC123
 *       404:
 *         description: Card not found
 */
router.get('/loyalty-card/lookup/:cardPublicId', merchantLimit, lookupCardByPublicId);

/**
 * @swagger
 * /api/public/loyalty-card/reconcile:
 *   post:
 *     summary: Manually reconcile Guest Loyalty Cards with Retenza account
 *     description: Finds all active guest cards matching the authenticated user's email/phone and links them. Idempotent — safe to call multiple times.
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reconciliation result
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 mergedCount: 2
 *                 message: 2 carte(s) de fidélité importée(s) dans votre compte Retenza !
 *                 mergedCards:
 *                   - cardPublicId: RTC-A1B2-C3D4
 *                     merchantPublicCode: ABC123
 *       401:
 *         description: Not authenticated
 */
router.post('/loyalty-card/reconcile', protect, rateLimiter(5, 60 * 1000), manualReconcile);

module.exports = router;
