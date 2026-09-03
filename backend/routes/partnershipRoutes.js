/**
 * partnershipRoutes.js
 * Route publique pour soumettre une demande de partenariat.
 * Aucune authentification requise.
 */
const express = require('express');
const { body } = require('express-validator');
const { submitRequest, checkEmail } = require('../controllers/partnershipController');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/partnership-requests/check-email?email=...
// Vérifie la disponibilité d'un email à l'étape 1 (fail fast)
router.get('/check-email', checkEmail);

// POST /api/partnership-requests
router.post(
  '/',
  [
    body('businessName').trim().notEmpty().withMessage('Nom du commerce requis'),
    body('category').trim().notEmpty().withMessage('Catégorie requise'),
    body('contactEmail').isEmail().normalizeEmail().withMessage('Email professionnel invalide'),
    body('ownerFirstName').trim().notEmpty().withMessage('Prénom du responsable requis'),
    body('ownerLastName').trim().notEmpty().withMessage('Nom du responsable requis'),
    body('numberOfLocations').optional().isInt({ min: 1 }),
    body('loyaltyProgramType').optional().isIn(['points', 'stamps', 'cashback', 'unknown']),
    body('message').optional().isLength({ max: 1000 }),
  ],
  validate,
  submitRequest
);

module.exports = router;
