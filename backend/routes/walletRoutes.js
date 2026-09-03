const express = require('express');
const { getAppleWalletPass, getGoogleWalletPass } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/wallet/apple/{clientId}/{commerceId}:
 *   get:
 *     summary: Generate Apple Wallet pass data structure (mock)
 *     description: Returns a mock Apple Wallet .pkpass compatible JSON structure
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *         example: 65f1a2b3c4d5e6f7a8b9c0d2
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *         example: 65f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Apple Wallet pass data
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 appleWalletPass:
 *                   formatVersion: 1
 *                   passTypeIdentifier: pass.com.retenza.loyalty
 *                   organizationName: Café du Centre
 *                   storeCard:
 *                     primaryFields:
 *                       - key: balance
 *                         label: points
 *                         value: "150"
 */
router.get('/apple/:clientId/:commerceId', protect, getAppleWalletPass);

/**
 * @swagger
 * /api/wallet/google/{clientId}/{commerceId}:
 *   get:
 *     summary: Generate Google Wallet pass data structure (mock)
 *     description: Returns a mock Google Wallet JWT payload structure
 *     tags: [Wallet]
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
 *         description: Google Wallet pass data
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 googleWalletPass:
 *                   iss: retenza@retenza.com
 *                   aud: google
 *                   typ: savetowallet
 */
router.get('/google/:clientId/:commerceId', protect, getGoogleWalletPass);

module.exports = router;
