const express = require('express');
const authRoutes = require('./authRoutes');
const commerceRoutes = require('./commerceRoutes');
const qrCodeRoutes = require('./qrCodeRoutes');
const clientRoutes = require('./clientRoutes');
const loyaltyRoutes = require('./loyaltyRoutes');
const walletRoutes = require('./walletRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const adminRoutes = require('./adminRoutes');
const supportRoutes = require('./supportRoutes');
const incidentRoutes = require('./incidentRoutes');
const merchantRoutes = require('./merchantRoutes');
const joinRoutes = require('./joinRoutes');
const testRoutes = require('./testRoutes');
const publicRoutes = require('./publicRoutes');
const otpRoutes = require('./otpRoutes');
const partnershipRoutes = require('./partnershipRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/commerces', commerceRoutes);
router.use('/qrcodes', qrCodeRoutes);
router.use('/clients', clientRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/wallet', walletRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);
router.use('/incidents', incidentRoutes);
router.use('/merchant', merchantRoutes);
router.use('/join', joinRoutes);
router.use('/tests', testRoutes);
router.use('/public', publicRoutes);
router.use('/otp', otpRoutes);
router.use('/partnership-requests', partnershipRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: RetenzaConnect API is running
 *               timestamp: "2026-06-24T10:00:00.000Z"
 */
router.get('/health', (_req, res) => {
  const mongoose = require('mongoose');
  const dbConnected = mongoose.connection.readyState === 1;

  res.json({
    success: true,
    message: 'RetenzaConnect API is running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
