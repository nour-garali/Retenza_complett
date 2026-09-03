const express = require('express');
const {
  generateQRCode,
  getQRCode,
  getQRCodeByCode,
  trackScan,
  getScanHistory,
} = require('../controllers/qrCodeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/qrcodes/generate/{commerceId}:
 *   post:
 *     summary: Generate unique QR code for a commerce
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *         example: 65f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       201:
 *         description: QR code generated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 qrCode:
 *                   code: RC-A1B2C3D4
 *                   url: http://localhost:3000/api/qrcodes/scan/RC-A1B2C3D4
 *                   scanCount: 0
 */
router.post(
  '/generate/:commerceId',
  protect,
  authorize('merchant', 'admin'),
  generateQRCode
);

/**
 * @swagger
 * /api/qrcodes/commerce/{commerceId}:
 *   get:
 *     summary: Get QR code for a commerce
 *     tags: [QR Code]
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: QR code details
 */
router.get('/commerce/:commerceId', getQRCode);

/**
 * @swagger
 * /api/qrcodes/code/{code}:
 *   get:
 *     summary: Get QR code info by code string
 *     tags: [QR Code]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         example: RC-A1B2C3D4
 *     responses:
 *       200:
 *         description: QR code with commerce info
 */
router.get('/code/:code', getQRCodeByCode);

/**
 * @swagger
 * /api/qrcodes/scan/{code}:
 *   post:
 *     summary: Track QR code scan (records date and time)
 *     tags: [QR Code]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         example: RC-A1B2C3D4
 *     responses:
 *       200:
 *         description: Scan recorded
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Scan recorded successfully
 *               data:
 *                 scan:
 *                   scannedAt: "2026-06-24T10:30:00.000Z"
 *                 commerce:
 *                   name: Café du Centre
 *                 qrCode:
 *                   scanCount: 42
 */
router.post('/scan/:code', trackScan);

/**
 * @swagger
 * /api/qrcodes/history/{commerceId}:
 *   get:
 *     summary: Get scan history for a commerce
 *     tags: [QR Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Scan history list
 */
router.get(
  '/history/:commerceId',
  protect,
  authorize('merchant', 'admin'),
  getScanHistory
);

module.exports = router;
