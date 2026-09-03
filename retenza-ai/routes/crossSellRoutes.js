/**
 * crossSellRoutes.js
 * ──────────────────
 * Routes REST pour le module de recommandation Cross-Sell / Up-Sell.
 * Toute la logique métier est dans crossSellController.js (pas de logique ici).
 *
 * Préfixe : /api/recommendations  (enregistré dans server.js)
 *
 * Endpoints :
 *   GET  /api/recommendations/rules          → Liste des règles actives (dashboard admin)
 *   GET  /api/recommendations/:productId     → Produits associés à un produit donné
 *   POST /api/recommendations/recalculate    → Recalcul manuel des associations MBA
 *   POST /api/recommendations/trigger-push   → Webhook de test du push post-caisse
 */

'use strict';

const express = require('express');
const router  = express.Router();

const {
    getProductRecommendations,
    recalculateAssociations,
    getAssociationRules,
    triggerCrossSellPushEndpoint,
} = require('../controllers/crossSellController');

// GET  /api/recommendations/rules → Liste toutes les règles actives (admin dashboard)
// ⚠️  Cette route DOIT être déclarée AVANT /:productId pour éviter le conflit de paramètres
router.get('/rules', getAssociationRules);

// POST /api/recommendations/recalculate → Recalcul manuel du MBA
router.post('/recalculate', recalculateAssociations);

// POST /api/recommendations/trigger-push → Webhook de test du push post-caisse
router.post('/trigger-push', triggerCrossSellPushEndpoint);

// GET  /api/recommendations/:productId → Recommandations pour un produit donné
router.get('/:productId', getProductRecommendations);

module.exports = router;
