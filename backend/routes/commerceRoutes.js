const express = require('express');
const { body } = require('express-validator');
const {
  createCommerce,
  getCommerces,
  getCommerceById,
  updateCommerce,
  uploadLogo,
  getMyCommerce,
} = require('../controllers/commerceController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/commerces:
 *   post:
 *     summary: Create a new commerce
 *     tags: [Commerce]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Boulangerie Artisanale
 *               description:
 *                 type: string
 *                 example: Pain frais chaque matin
 *               category:
 *                 type: string
 *                 example: Boulangerie
 *               contact:
 *                 type: object
 *                 properties:
 *                   email: { type: string, example: contact@boulangerie.fr }
 *                   phone: { type: string, example: "+33123456789" }
 *                   address: { type: string, example: "12 rue de la Paix" }
 *                   city: { type: string, example: Paris }
 *                   postalCode: { type: string, example: "75001" }
 *               openingHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day: { type: string, example: monday }
 *                     open: { type: string, example: "07:00" }
 *                     close: { type: string, example: "19:00" }
 *                     isClosed: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Commerce created
 */
router.post(
  '/',
  protect,
  authorize('merchant'),
  [body('name').trim().notEmpty(), body('category').trim().notEmpty()],
  validate,
  createCommerce
);

/**
 * @swagger
 * /api/commerces:
 *   get:
 *     summary: List all commerces
 *     tags: [Commerce]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         example: Restaurant
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, suspended, pending] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of commerces
 */
router.get('/', getCommerces);

/**
 * @swagger
 * /api/commerces/me:
 *   get:
 *     summary: Get merchant's own commerce
 *     tags: [Commerce]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Merchant commerce profile
 */
router.get('/me', protect, authorize('merchant'), getMyCommerce);

/**
 * @swagger
 * /api/commerces/{id}:
 *   get:
 *     summary: Get commerce details by ID
 *     tags: [Commerce]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 65f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Commerce details
 *       404:
 *         description: Commerce not found
 */
router.get('/:id', getCommerceById);

/**
 * @swagger
 * /api/commerces/{id}:
 *   put:
 *     summary: Update commerce profile
 *     tags: [Commerce]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Commerce'
 *           example:
 *             name: Café du Centre - Updated
 *             description: Best coffee in town
 *             category: Restaurant
 *             contact:
 *               phone: "+33612345678"
 *               address: "5 avenue Victor Hugo"
 *               city: Lyon
 *               postalCode: "69001"
 *             openingHours:
 *               - day: monday
 *                 open: "08:00"
 *                 close: "20:00"
 *                 isClosed: false
 *             loyaltyProgram:
 *               type: points
 *               pointsPerEuro: 2
 *     responses:
 *       200:
 *         description: Commerce updated
 */
router.put('/:id', protect, authorize('merchant', 'admin'), updateCommerce);

/**
 * @swagger
 * /api/commerces/{id}/logo:
 *   post:
 *     summary: Upload commerce logo
 *     tags: [Commerce]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 logo: /uploads/logo-123456.png
 */
router.post(
  '/:id/logo',
  protect,
  authorize('merchant'),
  upload.single('logo'),
  uploadLogo
);

module.exports = router;
