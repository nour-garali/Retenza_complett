const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/stats/{commerceId}:
 *   get:
 *     summary: Get merchant dashboard statistics
 *     description: Returns total clients, new clients (7/30 days), loyalty stats, and retention rate
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *         example: 65f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 clients:
 *                   total: 245
 *                   newLast7Days: 12
 *                   newLast30Days: 48
 *                 loyalty:
 *                   totalPoints: 15420
 *                   totalStamps: 890
 *                   totalCashback: 320.5
 *                   activeAccounts: 200
 *                 qrScans:
 *                   total: 500
 *                   converted: 245
 *                   conversionRate: "49%"
 *                 retentionRate: "80.41%"
 */
router.get(
  '/stats/:commerceId',
  protect,
  authorize('merchant', 'admin'),
  getDashboardStats
);

module.exports = router;
