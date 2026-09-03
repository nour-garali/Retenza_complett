const express = require('express');
const { body } = require('express-validator');
const { createIncident } = require('../controllers/supportController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     summary: Signaler un incident
 *     description: Permet de signaler un incident (commerçant ou client)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Fraude suspectée"
 *             description: "Un client utilise plusieurs comptes pour cumuler des points."
 *             type: fraud
 *             priority: high
 *     responses:
 *       201:
 *         description: Incident signalé
 */
router.post(
  '/',
  protect,
  authorize('merchant', 'client'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('type').optional().isIn(['technical', 'fraud', 'abuse', 'billing', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('commerceId').optional().notEmpty(),
  ],
  validate,
  createIncident
);

module.exports = router;
