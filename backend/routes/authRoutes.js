const express = require('express');
const { body } = require('express-validator');
const {
  registerMerchant,
  registerClient,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { activateAccount, resendActivation } = require('../controllers/partnershipController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register/merchant:
 *   post:
 *     summary: Register a new merchant account
 *     description: Creates a merchant user and an associated commerce profile
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, commerceName, category]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@cafe.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               phone:
 *                 type: string
 *                 example: "+33612345678"
 *               commerceName:
 *                 type: string
 *                 example: Café du Centre
 *               category:
 *                 type: string
 *                 example: Restaurant
 *     responses:
 *       201:
 *         description: Merchant registered successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Merchant registered successfully
 *               data:
 *                 user:
 *                   id: "65f1a2b3c4d5e6f7a8b9c0d1"
 *                   email: merchant@cafe.com
 *                   role: merchant
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       409:
 *         description: Email already registered
 */
/**
 * @deprecated Utiliser POST /api/partnership-requests à la place.
 * Cette route est conservée temporairement pour rétrocompatibilité uniquement.
 * Elle ne doit PLUS être utilisée par l'interface publique.
 */
router.post(
  '/register/merchant',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('commerceName').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validate,
  registerMerchant
);

/**
 * @swagger
 * /api/auth/register/client:
 *   post:
 *     summary: Register a new client account
 *     description: Creates a client user account (without commerce link)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               firstName:
 *                 type: string
 *                 example: Marie
 *               lastName:
 *                 type: string
 *                 example: Martin
 *               phone:
 *                 type: string
 *                 example: "+33698765432"
 *     responses:
 *       201:
 *         description: Client registered successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Client registered successfully
 *               data:
 *                 user:
 *                   role: client
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
router.post(
  '/register/client',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validate,
  registerClient
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@cafe.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     description: Generates a reset token (mock email delivery in development)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@cafe.com
 *     responses:
 *       200:
 *         description: Reset token generated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password reset token generated.
 *               data:
 *                 resetToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn: "1h"
 */
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset-token-from-forgot-password"
 *               newPassword:
 *                 type: string
 *                 example: NewPassword456!
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
  '/reset-password',
  [body('token').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  resetPassword
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   email: merchant@cafe.com
 *                   role: merchant
 */
router.get('/me', protect, getMe);

// ─── Activation de compte (nouveau workflow partenariat) ────────────────────────
// POST /api/auth/activate-account
// Public — token reçu par email, permet de créer le mot de passe
router.post(
  '/activate-account',
  [
    body('token').trim().notEmpty().withMessage('Token requis'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
    body('confirmPassword').notEmpty(),
  ],
  validate,
  activateAccount
);

// POST /api/auth/resend-activation
// Public — renvoie un email d'activation, réponse générique (anti-enumeration)
router.post(
  '/resend-activation',
  [body('email').isEmail().normalizeEmail()],
  validate,
  resendActivation
);

module.exports = router;
