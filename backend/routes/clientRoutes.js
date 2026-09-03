const express = require('express');
const { body } = require('express-validator');
const {
  registerAfterQRScan,
  getClientsByCommerce,
  getClientById,
  getSuggestions,
  searchCommerces,
  getFavorites,
  addFavorite,
  removeFavorite,
  getFAQ,
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  getNotifications,
  markNotificationRead,
  createTestNotification,
  getSettings,
  updateSettings,
  getDashboard,
  getBalances,
  redeemReward,
  updateProfile,
  deactivateAccount,
  deleteAccount,
  getPurchases,

  getWalletPass,
} = require('../controllers/clientController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/clients/register-qr:
 *   post:
 *     summary: Register client after QR code scan
 *     description: Links a new client to a commerce after scanning its QR code
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, qrCode]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Marie
 *               lastName:
 *                 type: string
 *                 example: Martin
 *               email:
 *                 type: string
 *                 example: marie@example.com
 *               phone:
 *                 type: string
 *                 example: "+33698765432"
 *               qrCode:
 *                 type: string
 *                 example: RC-A1B2C3D4
 *               password:
 *                 type: string
 *                 example: Password123!
 *                 description: Optional - creates a user account if provided
 *     responses:
 *       201:
 *         description: Client registered and linked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Client registered and linked to commerce
 *               data:
 *                 client:
 *                   firstName: Marie
 *                   lastName: Martin
 *                   email: marie@example.com
 */
router.post(
  '/register-qr',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('qrCode').trim().notEmpty(),
    body('phone').optional().trim(),
    body('password').optional().isLength({ min: 6 }),
  ],
  validate,
  registerAfterQRScan
);

/**
 * @swagger
 * /api/clients/commerce/{commerceId}:
 *   get:
 *     summary: List clients for a commerce
 *     tags: [Client]
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
 *         description: Client list
 */
router.get(
  '/commerce/:commerceId',
  protect,
  authorize('merchant', 'admin'),
  getClientsByCommerce
);



// ─── Suggestions & Recherche de commerces ──────────────────────────

/**
 * @swagger
 * /api/clients/commerces/suggestions:
 *   get:
 *     summary: Consulter suggestions commerces
 *     description: Récupère une liste de commerces suggérés (actifs) pour le client.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de suggestions récupérée avec succès
 */
router.get('/commerces/suggestions', protect, getSuggestions);

/**
 * @swagger
 * /api/clients/commerces/search:
 *   get:
 *     summary: Rechercher un commerçant
 *     description: Permet de rechercher des commerces par nom ou catégorie.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         example: Cafe
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 */
router.get('/commerces/search', protect, searchCommerces);

// ─── Favoris ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/clients/favorites:
 *   get:
 *     summary: Liste des commerces favoris
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des favoris du client
 */
router.get('/favorites', protect, getFavorites);

/**
 * @swagger
 * /api/clients/favorites/{commerceId}:
 *   post:
 *     summary: Ajouter aux favoris
 *     description: Ajoute un commerce à la liste des favoris du client.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ajouté aux favoris
 */
router.post('/favorites/:commerceId', protect, addFavorite);

/**
 * @swagger
 * /api/clients/favorites/{commerceId}:
 *   delete:
 *     summary: Retirer des favoris
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retiré des favoris
 */
router.delete('/favorites/:commerceId', protect, removeFavorite);

// ─── Support & FAQ ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/clients/support/faq:
 *   get:
 *     summary: Consulter la FAQ
 *     description: Récupère la liste des questions fréquemment posées.
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: Liste FAQ
 */
router.get('/support/faq', getFAQ);

/**
 * @swagger
 * /api/clients/support/tickets:
 *   get:
 *     summary: Suivre les demandes de support
 *     description: Liste toutes les demandes de support soumises par le client.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tickets de support
 */
router.get('/support/tickets', protect, getSupportTickets);

/**
 * @swagger
 * /api/clients/support/tickets:
 *   post:
 *     summary: Envoyer une demande de support
 *     description: Crée un nouveau ticket de support auprès de l'administration.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Problème de connexion Apple Wallet"
 *               message:
 *                 type: string
 *                 example: "Je n'arrive pas à télécharger ma carte sur mon iPhone."
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               commerceId:
 *                 type: string
 *                 description: Optionnel - Commerce lié au problème
 *     responses:
 *       201:
 *         description: Demande envoyée
 */
router.post(
  '/support/tickets',
  protect,
  [body('subject').trim().notEmpty(), body('message').trim().notEmpty()],
  validate,
  createSupportTicket
);

/**
 * @swagger
 * /api/clients/support/tickets/{id}:
 *   get:
 *     summary: Détail d'une demande de support
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du ticket
 */
router.get('/support/tickets/:id', protect, getSupportTicketById);

// ─── Notifications ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/clients/notifications:
 *   get:
 *     summary: Consulter les notifications
 *     description: Récupère la liste des notifications reçues par le client.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get('/notifications', protect, getNotifications);

/**
 * @swagger
 * /api/clients/notifications/{id}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification mise à jour
 */
router.patch('/notifications/:id/read', protect, markNotificationRead);

/**
 * @swagger
 * /api/clients/notifications/test:
 *   post:
 *     summary: Déclencher une notification de test (Simulation)
 *     description: Permet de s'envoyer une notification push fictive pour tester l'intégration.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Offre Spéciale !"
 *               message:
 *                 type: string
 *                 example: "-20% sur tout le magasin ce week-end."
 *               type:
 *                 type: string
 *                 enum: [loyalty, support, promotion, system]
 *                 example: promotion
 *     responses:
 *       201:
 *         description: Notification créée
 */
router.post('/notifications/test', protect, createTestNotification);

// ─── Paramètres ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/clients/settings:
 *   get:
 *     summary: Consulter les paramètres
 *     description: Récupère les préférences de notification, langue, et confidentialité du client.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paramètres actuels du compte
 */
router.get('/settings', protect, getSettings);

/**
 * @swagger
 * /api/clients/settings:
 *   put:
 *     summary: Gérer les paramètres (Modifier préférences)
 *     description: Modifie les préférences de notification (email, push), la langue ou les options de confidentialité.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email: { type: boolean }
 *                   push: { type: boolean }
 *               language:
 *                 type: string
 *                 example: fr
 *               privacy:
 *                 type: object
 *                 properties:
 *                   dataSharing: { type: boolean }
 *     responses:
 *       200:
 *         description: Paramètres mis à jour
 */
router.put('/settings', protect, updateSettings);



router.get('/wallet-pass', protect, authorize('client'), getWalletPass);

// ─── Dashboard & Fidélité ──────────────────────────────────────────

/**
 * @swagger
 * /api/clients/dashboard:
 *   get:
 *     summary: Consulter le dashboard client
 *     description: Synthétise le nombre de cartes actives, les totaux de points accumulés et l'historique des 5 dernières transactions.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du dashboard client
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @swagger
 * /api/clients/loyalty/balances:
 *   get:
 *     summary: Consulter le solde
 *     description: Liste les soldes de points, tampons et cashback du client pour tous les commerces associés.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des soldes par commerce
 */
router.get('/loyalty/balances', protect, getBalances);

/**
 * @swagger
 * /api/clients/loyalty/redeem:
 *   post:
 *     summary: Utiliser une récompense
 *     description: Permet de consommer ses points/tampons pour obtenir une récompense (déduction directe).
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commerceId, programType, amount]
 *             properties:
 *               commerceId:
 *                 type: string
 *               programType:
 *                 type: string
 *                 enum: [points, stamps, cashback]
 *               amount:
 *                 type: number
 *                 description: Quantité à déduire (ex. 10 tampons ou 100 points)
 *               description:
 *                 type: string
 *                 example: "Café gratuit"
 *     responses:
 *       201:
 *         description: Récompense réclamée avec succès
 */
router.post('/loyalty/redeem', protect, redeemReward);

// ─── Gérer le compte (Profil, Désactivation, Suppression) ──────────

/**
 * @swagger
 * /api/clients/profile:
 *   put:
 *     summary: Modifier le profil (Gérer le compte)
 *     description: Permet au client de modifier ses données personnelles (prénom, nom, téléphone).
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/clients/profile/deactivate:
 *   post:
 *     summary: Désactiver compte
 *     description: Désactive le compte utilisateur client (n'efface pas les données mais bloque les connexions).
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte désactivé
 */
router.post('/profile/deactivate', protect, deactivateAccount);

/**
 * @swagger
 * /api/clients/profile:
 *   delete:
 *     summary: Supprimer compte (Droit à l'oubli / GDPR)
 *     description: Supprime définitivement le compte utilisateur et toutes les fiches clients liées de la base de données.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé définitivement
 */
router.delete('/profile', protect, deleteAccount);

// ─── Historique d'achats ───────────────────────────────────────────

/**
 * @swagger
 * /api/clients/purchases:
 *   get:
 *     summary: Consulter historique achats
 *     description: Récupère la liste de tous les achats validés ou en attente du client dans les commerces.
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de l'historique d'achats
 */
router.get('/purchases', protect, getPurchases);

// Should be at the bottom to prevent conflict with other static routes like /dashboard
router.get('/:id', protect, getClientById);

module.exports = router;
