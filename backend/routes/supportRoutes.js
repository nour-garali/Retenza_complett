const express = require('express');
const { body } = require('express-validator');
const { createSupportRequest } = require('../controllers/supportController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/support:
 *   post:
 *     summary: Soumettre une demande de support (commerçant)
 *     description: Permet aux commerçants de créer une demande visible par l'admin
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             subject: "Problème avec le QR code"
 *             message: "Mon QR code ne génère plus de scans depuis hier."
 *             priority: high
 *     responses:
 *       201:
 *         description: Demande créée
 */
router.post(
  '/',
  protect,
  authorize('merchant'),
  [
    body('subject').trim().notEmpty(),
    body('message').trim().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  createSupportRequest
);

module.exports = router;
