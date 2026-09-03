const express = require('express');
const { body } = require('express-validator');
const {
  addTransaction,
  getBalance,
  getHistory,
  updateLoyaltyProgram,
} = require('../controllers/loyaltyController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/loyalty/transactions:
 *   post:
 *     summary: Add a loyalty transaction (earn, redeem, or adjustment)
 *     description: Supports points, stamps, and cashback program types
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, commerceId, type, programType]
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: 65f1a2b3c4d5e6f7a8b9c0d2
 *               commerceId:
 *                 type: string
 *                 example: 65f1a2b3c4d5e6f7a8b9c0d1
 *               type:
 *                 type: string
 *                 enum: [earn, redeem, adjustment]
 *                 example: earn
 *               programType:
 *                 type: string
 *                 enum: [points, stamps, cashback]
 *                 example: points
 *               amount:
 *                 type: number
 *                 example: 10
 *                 description: Direct amount (optional if purchaseAmount provided for earn)
 *               purchaseAmount:
 *                 type: number
 *                 example: 25.50
 *                 description: Purchase amount in euros (auto-calculates reward for earn)
 *               description:
 *                 type: string
 *                 example: Coffee purchase
 *     responses:
 *       201:
 *         description: Transaction recorded
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 transaction:
 *                   type: earn
 *                   programType: points
 *                   amount: 25
 *                   balanceAfter: 175
 */
router.post(
  '/transactions',
  protect,
  authorize('merchant', 'admin'),
  [
    body('clientId').notEmpty(),
    body('commerceId').notEmpty(),
    body('type').isIn(['earn', 'redeem', 'adjustment']),
    body('programType').isIn(['points', 'stamps', 'cashback']),
    body('amount').optional().isFloat({ min: 0 }),
    body('purchaseAmount').optional().isFloat({ min: 0 }),
  ],
  validate,
  addTransaction
);

/**
 * @swagger
 * /api/loyalty/balance/{clientId}/{commerceId}:
 *   get:
 *     summary: Get loyalty balance for a client at a commerce
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Loyalty balance
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 balance:
 *                   points: 150
 *                   stamps: 3
 *                   cashbackBalance: 12.5
 *                   totalEarned: 500
 *                   totalRedeemed: 100
 */
router.get('/balance/:clientId/:commerceId', protect, getBalance);

/**
 * @swagger
 * /api/loyalty/history/{clientId}/{commerceId}:
 *   get:
 *     summary: Get loyalty transaction history
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: programType
 *         schema: { type: string, enum: [points, stamps, cashback] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get('/history/:clientId/:commerceId', protect, getHistory);

/**
 * @swagger
 * /api/loyalty/program/{commerceId}:
 *   put:
 *     summary: Configure loyalty program (points, stamps, or cashback)
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [points, stamps, cashback]
 *                 example: stamps
 *               pointsPerEuro:
 *                 type: number
 *                 example: 1
 *               stampsRequired:
 *                 type: number
 *                 example: 10
 *               cashbackPercentage:
 *                 type: number
 *                 example: 5
 *               rewardDescription:
 *                 type: string
 *                 example: Free coffee after 10 stamps
 *     responses:
 *       200:
 *         description: Program updated
 */
router.put(
  '/program/:commerceId',
  protect,
  authorize('merchant'),
  [
    body('type').optional().isIn(['points', 'stamps', 'cashback']),
    body('pointsPerEuro').optional().isFloat({ min: 0 }),
    body('stampsRequired').optional().isInt({ min: 1 }),
    body('cashbackPercentage').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  updateLoyaltyProgram
);

module.exports = router;
