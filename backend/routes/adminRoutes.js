const express = require('express');
const { body } = require('express-validator');
const {
  listAllCommerces,
  inviteMerchant,
  listMerchants,
  updateMerchant,
  suspendMerchant,
  activateCommerce,
  suspendCommerce,
  deleteCommerce,
  listSupportRequests,
  getSupportRequest,
  respondToSupport,
  closeSupportRequest,
  listIncidents,
  getIncident,
  updateIncidentStatus,
  respondToIncident,
  getGlobalStatistics,
  listClients,
  listPartnershipRequests,
  getPartnershipRequest,
  approvePartnershipRequest,
  rejectPartnershipRequest,
  getAdminSettings,
  updateAdminSettings,
} = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

// ─── Gérer commerces ───────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/commerces:
 *   get:
 *     summary: Lister tous les commerces
 *     description: Use case admin - Gérer commerces
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, suspended, pending] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste des commerces
 */
router.get('/commerces', listAllCommerces);

/**
 * @swagger
 * /api/admin/merchants/invite:
 *   post:
 *     summary: Inviter un commerçant
 *     description: Crée un compte commerçant et un commerce en attente
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstName, lastName, commerceName, category]
 *             properties:
 *               email: { type: string, example: nouveau@cafe.com }
 *               firstName: { type: string, example: Pierre }
 *               lastName: { type: string, example: Martin }
 *               phone: { type: string, example: "+33612345678" }
 *               commerceName: { type: string, example: Café Nouveau }
 *               category: { type: string, example: Restaurant }
 *     responses:
 *       201:
 *         description: Commerçant invité
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Merchant invited successfully
 *               data:
 *                 invite:
 *                   tempPassword: "a1b2c3d4e5f6"
 */
router.post(
  '/merchants/invite',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('commerceName').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validate,
  inviteMerchant
);

/**
 * @swagger
 * /api/admin/merchants:
 *   get:
 *     summary: Lister tous les commerçants
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des commerçants
 */
router.get('/merchants', listMerchants);

/**
 * @swagger
 * /api/admin/merchants/{id}:
 *   put:
 *     summary: Modifier un commerçant
 *     description: Met à jour les informations du commerçant et son commerce
 *     tags: [Admin - Commerces]
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
 *             firstName: Pierre
 *             lastName: Dupont
 *             phone: "+33698765432"
 *             email: pierre@cafe.com
 *             commerceName: Café Dupont
 *             category: Restaurant
 *     responses:
 *       200:
 *         description: Commerçant modifié
 */
router.put(
  '/merchants/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
  ],
  validate,
  updateMerchant
);

/**
 * @swagger
 * /api/admin/merchants/{id}/suspend:
 *   patch:
 *     summary: Suspendre un commerçant
 *     description: Désactive le compte et suspend le commerce associé
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commerçant suspendu
 */
router.patch('/merchants/:id/suspend', suspendMerchant);

/**
 * @swagger
 * /api/admin/commerces/{id}/activate:
 *   patch:
 *     summary: Activer un commerce
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commerce activé
 */
router.patch('/commerces/:id/activate', activateCommerce);

/**
 * @swagger
 * /api/admin/commerces/{id}/suspend:
 *   patch:
 *     summary: Suspendre un commerce
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commerce suspendu
 */
router.patch('/commerces/:id/suspend', suspendCommerce);

/**
 * @swagger
 * /api/admin/commerces/{id}:
 *   delete:
 *     summary: Supprimer un commerce
 *     tags: [Admin - Commerces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commerce supprimé
 */
router.delete('/commerces/:id', deleteCommerce);

/**
 * @swagger
 * /api/admin/clients:
 *   get:
 *     summary: Lister tous les clients
 *     tags: [Admin - Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Liste des clients
 */
router.get('/clients', listClients);

// ─── Gérer support ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/support:
 *   get:
 *     summary: Consulter les demandes de support
 *     description: Use case admin - Gérer support
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, closed] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des demandes
 */
router.get('/support', listSupportRequests);

/**
 * @swagger
 * /api/admin/support/{id}:
 *   get:
 *     summary: Consulter une demande de support
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détail de la demande
 */
router.get('/support/:id', getSupportRequest);

/**
 * @swagger
 * /api/admin/support/{id}/respond:
 *   post:
 *     summary: Répondre à une demande de support
 *     tags: [Admin - Support]
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
 *             message: "Nous avons résolu votre problème. Merci de réessayer."
 *     responses:
 *       200:
 *         description: Réponse ajoutée
 */
router.post(
  '/support/:id/respond',
  [body('message').trim().notEmpty()],
  validate,
  respondToSupport
);

/**
 * @swagger
 * /api/admin/support/{id}/close:
 *   patch:
 *     summary: Clôturer une demande de support
 *     tags: [Admin - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Demande clôturée
 */
router.patch('/support/:id/close', closeSupportRequest);

// ─── Gérer les incidents ───────────────────────────────────────────

/**
 * @swagger
 * /api/admin/incidents:
 *   get:
 *     summary: Consulter les incidents
 *     description: Use case admin - Gérer les incidents
 *     tags: [Admin - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [reported, investigating, resolved, dismissed] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [technical, fraud, abuse, billing, other] }
 *     responses:
 *       200:
 *         description: Liste des incidents
 */
router.get('/incidents', listIncidents);

/**
 * @swagger
 * /api/admin/incidents/{id}:
 *   get:
 *     summary: Consulter un incident
 *     tags: [Admin - Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détail de l'incident
 */
router.get('/incidents/:id', getIncident);

/**
 * @swagger
 * /api/admin/incidents/{id}/status:
 *   patch:
 *     summary: Modifier le statut d'un incident
 *     tags: [Admin - Incidents]
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
 *             status: investigating
 *     responses:
 *       200:
 *         description: Statut modifié
 */
router.patch(
  '/incidents/:id/status',
  [body('status').isIn(['reported', 'investigating', 'resolved', 'dismissed'])],
  validate,
  updateIncidentStatus
);

/**
 * @swagger
 * /api/admin/incidents/{id}/respond:
 *   post:
 *     summary: Répondre au signalement
 *     tags: [Admin - Incidents]
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
 *             message: "Incident en cours d'investigation par notre équipe."
 *     responses:
 *       200:
 *         description: Réponse ajoutée
 */
router.post(
  '/incidents/:id/respond',
  [body('message').trim().notEmpty()],
  validate,
  respondToIncident
);

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Statistiques globales de la plateforme
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques plateforme
 */
router.get('/statistics', getGlobalStatistics);

// ─── Demandes de partenariat ──────────────────────────────────────────────────
router.get('/partnership-requests', listPartnershipRequests);
router.get('/partnership-requests/:id', getPartnershipRequest);
router.post('/partnership-requests/:id/approve', approvePartnershipRequest);
router.post('/partnership-requests/:id/reject', [
  require('express-validator').body('reason').optional().trim().isLength({ max: 500 }),
  require('../middleware/validate'),
  rejectPartnershipRequest,
]);

// ─── Paramètres Admin ──────────────────────────────────────────────────
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

module.exports = router;
