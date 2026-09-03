const express = require('express');
const { body } = require('express-validator');
const {
  listIncidents,
  getIncident,
  createIncident,
  updateIncident,
  addIncidentComment,
  confirmIncidentResolution,
  getLoyaltyProgram,
  configurePoints,
  configureStamps,
  configureCashback,
  generateQRCode,
  listClients,
  deleteClient,
  updateClientPoints,
  getClientRewards,
  listPurchases,
  addPurchase,
  validatePurchase,
  assignPoints,
  assignStamps,
  assignCashback,
  completeOnboarding,
} = require('../controllers/merchantController');
const { getDashboardStats } = require('../controllers/dashboardController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('merchant'));

// ─── Onboarding (première connexion) ───────────────────────────────────
router.put('/onboarding', completeOnboarding);

// ─── Dashboard ─────────────────────────────────────────────────────

router.get('/dashboard', getDashboardStats);

// ─── Incidents ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/merchant/incidents:
 *   get:
 *     summary: Consulter les incidents
 *     description: Use case commerçant - Consulter les incidents
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [reported, investigating, resolved, dismissed] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des incidents du commerce
 */
router.get('/incidents', listIncidents);

/**
 * @swagger
 * /api/merchant/incidents:
 *   post:
 *     summary: Créer un incident
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Problème technique"
 *             description: "L'application ne charge pas les clients"
 *             type: technical
 *             priority: medium
 *     responses:
 *       201:
 *         description: Incident créé
 */
router.post(
  '/incidents',
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('type').optional().isIn(['technical', 'fraud', 'abuse', 'billing', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validate,
  createIncident
);

/**
 * @swagger
 * /api/merchant/incidents/{id}:
 *   get:
 *     summary: Consulter un incident et les réponses admin
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détail incident avec réponses
 */
router.get('/incidents/:id', getIncident);

/**
 * @swagger
 * /api/merchant/incidents/{id}:
 *   put:
 *     summary: Modifier un incident
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             title: "Problème technique - mis à jour"
 *             description: "Détails supplémentaires"
 *             priority: high
 *     responses:
 *       200:
 *         description: Incident modifié
 */
router.put('/incidents/:id', updateIncident);

/**
 * @swagger
 * /api/merchant/incidents/{id}/comments:
 *   post:
 *     summary: Ajouter un commentaire à un incident
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             message: "Le problème persiste après redémarrage."
 *     responses:
 *       200:
 *         description: Commentaire ajouté
 */
router.post(
  '/incidents/:id/comments',
  [body('message').trim().notEmpty()],
  validate,
  addIncidentComment
);

/**
 * @swagger
 * /api/merchant/incidents/{id}/confirm:
 *   patch:
 *     summary: Confirmer la résolution d'un incident
 *     tags: [Commerçant - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Résolution confirmée
 */
router.patch('/incidents/:id/confirm', confirmIncidentResolution);

// ─── Programme de fidélité ─────────────────────────────────────────

/**
 * @swagger
 * /api/merchant/loyalty:
 *   get:
 *     summary: Consulter le programme de fidélité
 *     description: Use case commerçant - Gérer le programme de fidélité
 *     tags: [Commerçant - Fidélité]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Programme et QR code
 */
router.get('/loyalty', getLoyaltyProgram);

/**
 * @swagger
 * /api/merchant/loyalty/points:
 *   put:
 *     summary: Configurer le système de points
 *     description: Génère automatiquement le QR code si absent
 *     tags: [Commerçant - Fidélité]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             pointsPerEuro: 2
 *             rewardDescription: "2 points par euro dépensé"
 *     responses:
 *       200:
 *         description: Système points configuré
 */
router.put(
  '/loyalty/points',
  [body('pointsPerEuro').optional().isFloat({ min: 0 })],
  validate,
  configurePoints
);

/**
 * @swagger
 * /api/merchant/loyalty/stamps:
 *   put:
 *     summary: Configurer le système de tampons
 *     tags: [Commerçant - Fidélité]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             stampsRequired: 10
 *             rewardDescription: "Café offert après 10 tampons"
 *     responses:
 *       200:
 *         description: Système tampons configuré
 */
router.put(
  '/loyalty/stamps',
  [body('stampsRequired').optional().isInt({ min: 1 })],
  validate,
  configureStamps
);

/**
 * @swagger
 * /api/merchant/loyalty/cashback:
 *   put:
 *     summary: Configurer le système cashback
 *     tags: [Commerçant - Fidélité]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             cashbackPercentage: 5
 *             rewardDescription: "5% de cashback sur chaque achat"
 *     responses:
 *       200:
 *         description: Cashback configuré
 */
router.put(
  '/loyalty/cashback',
  [body('cashbackPercentage').optional().isFloat({ min: 0, max: 100 })],
  validate,
  configureCashback
);

/**
 * @swagger
 * /api/merchant/qrcode:
 *   post:
 *     summary: Générer le QR code du commerce
 *     tags: [Commerçant - Fidélité]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code généré ou existant
 */
router.post('/qrcode', generateQRCode);

// ─── Clients ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/merchant/clients:
 *   get:
 *     summary: Consulter les clients
 *     description: Use case commerçant - Gérer les clients
 *     tags: [Commerçant - Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des clients
 */
router.get('/clients', listClients);
router.delete('/clients/:id', deleteClient);
router.put('/clients/:id/points', updateClientPoints);

/**
 * @swagger
 * /api/merchant/clients/{clientId}/rewards:
 *   get:
 *     summary: Consulter les récompenses d'un client
 *     tags: [Commerçant - Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Récompenses du client
 */
router.get('/clients/:clientId/rewards', getClientRewards);

// ─── Achats ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/merchant/purchases:
 *   get:
 *     summary: Consulter les achats
 *     description: Use case commerçant - Gérer les achats
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, validated, cancelled] }
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des achats
 */
router.get('/purchases', listPurchases);

/**
 * @swagger
 * /api/merchant/purchases:
 *   post:
 *     summary: Ajouter un achat
 *     description: Option autoAssign pour attribuer automatiquement points/tampons/cashback
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             clientId: "65f1a2b3c4d5e6f7a8b9c0d2"
 *             amount: 25.50
 *             description: "Déjeuner"
 *             autoAssign: true
 *     responses:
 *       201:
 *         description: Achat ajouté
 */
router.post(
  '/purchases',
  [
    body('clientId').notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('autoAssign').optional().isBoolean(),
  ],
  validate,
  addPurchase
);

/**
 * @swagger
 * /api/merchant/purchases/{id}/validate:
 *   patch:
 *     summary: Valider un achat
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Achat validé
 */
router.patch('/purchases/:id/validate', validatePurchase);

/**
 * @swagger
 * /api/merchant/purchases/{id}/assign-points:
 *   post:
 *     summary: Attribuer des points pour un achat
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             amount: 50
 *             description: "Points bonus"
 *     responses:
 *       200:
 *         description: Points attribués
 */
router.post('/purchases/:id/assign-points', assignPoints);

/**
 * @swagger
 * /api/merchant/purchases/{id}/assign-stamps:
 *   post:
 *     summary: Attribuer des tampons pour un achat
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tampons attribués
 */
router.post('/purchases/:id/assign-stamps', assignStamps);

/**
 * @swagger
 * /api/merchant/purchases/{id}/assign-cashback:
 *   post:
 *     summary: Attribuer du cashback pour un achat
 *     tags: [Commerçant - Achats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cashback attribué
 */
router.post('/purchases/:id/assign-cashback', assignCashback);

module.exports = router;
