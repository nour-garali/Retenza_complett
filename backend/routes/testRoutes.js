const express = require('express');
const { runAllE2ETests } = require('../controllers/testController');
const User = require('../models/User');

const router = express.Router();

/**
 * @swagger
 * /api/tests/init-admin:
 *   post:
 *     summary: Initialize admin user for testing
 *     description: Creates the admin user if it doesn't exist
 *     tags: [Automated Tests]
 *     responses:
 *       200:
 *         description: Admin initialization result
 */
router.post('/init-admin', async (req, res) => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@retenza.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: true, message: 'Admin user already exists', email });
    }

    await User.create({
      email,
      password,
      firstName: 'Admin',
      lastName: 'Retenza',
      role: 'admin',
    });

    res.status(201).json({ success: true, message: 'Admin user created', email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/run-all:
 *   post:
 *     summary: Run all automated E2E tests
 *     description: Simulate a full user journey (merchant registration, commerce creation, client QR scan, purchase, and GDPR deletion) and return a complete test report.
 *     tags: [Automated Tests]
 *     responses:
 *       200:
 *         description: Test execution report
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "All Automated Tests Passed!"
 *               report: [
 *                 { step: "1. Register Merchant", status: "SUCCESS", details: "Created merchant..." }
 *               ]
 */
router.post('/run-all', runAllE2ETests);

module.exports = router;
