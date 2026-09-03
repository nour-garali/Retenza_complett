const express  = require('express');
const router   = express.Router();
const {
    getRFMData,
    getClientTransactions,
    recalculateRFM,
    sendCampaignEmail,
    getClientCampaignHistory,
    sendGroupCampaign,
    triggerSmartAutomation,
    getAutomationStatus,
    getCommerces,
    getGlobalComparison,
    getReturnRate,
    getRecommendations,
    optOutRGPD,
    optInRGPD,
    getCommerceSettings,
    updateCommerceSettings,
    triggerShopAnniversary,
    getFraudAlerts,
    getRGPDPortalToken,
    getRGPDPortalData,
    updateRGPDPortalData,
    exportClientsCSV,
    exportCampaignsCSV,
    exportGlobalCSV,
    exportDashboardCSV,
    exportAccountingCSV,
    trackCampaignOpen,
    getAdvancedCampaignStats,
    getCampaignRecommendationsAI,
    addCommande,
    updateClientLocation
} = require('../controllers/rfmController');

const {
    getReferralStats,
    getClientReferralDetail,
    declareReferral
} = require('../controllers/referralController');
const {
    getMultiAccountAlerts,
    recalculateTrustScoresHandler,
    getTrustScoresHandler,
    unblockClientFraudHandler,
    checkFraudBlock
} = require('../controllers/fraudController');
const lowTraffic  = require('../controllers/lowTrafficController');
const {
    analyzeSentiment,
    getSentimentHistory,
    prefillClientHistory,
} = require('../controllers/sentimentController');

// GET  /api/commerces               → Liste de tous les commerce_id disponibles
router.get('/commerces', getCommerces);

// GET  /api/referrals/stats        → Statistiques globales du parrainage
router.get('/referrals/stats', getReferralStats);

// GET  /api/referrals/client/:email → Infos parrainage & paliers d'un client
router.get('/referrals/client/:email', getClientReferralDetail);

// POST /api/referrals/declare       → Enregistrer un parrainage
router.post('/referrals/declare', declareReferral);

// GET  /api/global-comparison       → Comparaison globale de toutes les boutiques
router.get('/global-comparison', getGlobalComparison);

// GET  /api/kpis/return-rate        → Taux de retour client (Tr) d'une boutique
router.get('/kpis/return-rate', getReturnRate);

// GET  /api/data                  → Liste de tous les clients RFM
router.get('/data', getRFMData);

// GET  /api/transactions/:id   → Historique des achats d'un client
router.get('/transactions/:id', getClientTransactions);

// PATCH /api/clients/:id/location → Mise à jour de la position GPS d'un client (GeoJSON Point)
router.patch('/clients/:id/location', updateClientLocation);

// POST /api/recalculate           → Relancer le pipeline Python RFM
router.post('/recalculate', recalculateRFM);

// POST /api/campaigns/send        → Envoyer un e-mail de campagne marketing
router.post('/campaigns/send', sendCampaignEmail);

// GET  /api/campaigns/history/:email → Historique des campagnes envoyées à un client
router.get('/campaigns/history/:email', getClientCampaignHistory);

// POST /api/campaigns/send-group  → Envoyer un e-mail à tout un groupe
router.post('/campaigns/send-group', sendGroupCampaign);

// POST /api/campaigns/trigger-automation → Déclencher l'IA d'automatisation (répond immédiatement)
router.post('/campaigns/trigger-automation', triggerSmartAutomation);

// GET  /api/campaigns/automation-status  → Statut de l'automatisation en cours (polling)
router.get('/campaigns/automation-status', getAutomationStatus);

// GET  /api/campaigns/track/open/:trackingId → Pixel transparent de tracking d'ouverture
router.get('/campaigns/track/open/:trackingId', trackCampaignOpen);

// GET  /api/campaigns/advanced-stats → Statistiques avancées & attribution CA
router.get('/campaigns/advanced-stats', getAdvancedCampaignStats);

// GET  /api/campaigns/recommendations-ai → Recommandation stratégique IA de campagne
router.get('/campaigns/recommendations-ai', getCampaignRecommendationsAI);

// POST /api/commandes/add → Enregistrer une commande (🔒 vérifie checkFraudBlock anti-fraude)
router.post('/commandes/add', checkFraudBlock, addCommande);

// GET  /api/recommendations              → Recommandations IA rule-based pour une boutique
router.get('/recommendations', getRecommendations);

// POST /api/rgpd/opt-out                 → Désactiver le ciblage marketing pour un client (RGPD)
router.post('/rgpd/opt-out', optOutRGPD);

// POST /api/rgpd/opt-in                  → Réactiver le ciblage marketing pour un client (RGPD)
router.post('/rgpd/opt-in', optInRGPD);

// GET  /api/commerces/settings           → Récupérer les paramètres d'un commerce
router.get('/commerces/settings', getCommerceSettings);

// POST /api/commerces/settings          → Enregistrer les paramètres d'un commerce (🔒 super_admin ou merchant_admin du commerce concerné)
router.post('/commerces/settings', updateCommerceSettings);

// POST /api/campaigns/trigger-shop-anniversary → Déclencher manuellement la campagne anniversaire boutique
router.post('/campaigns/trigger-shop-anniversary', triggerShopAnniversary);

// Heures creuses : configuration, heatmap, historique et test manuel
router.get('/low-traffic/settings', lowTraffic.getSettings);
router.post('/low-traffic/settings', lowTraffic.saveSettings);
router.get('/low-traffic/snapshot', lowTraffic.getSnapshot);
router.get('/low-traffic/history', lowTraffic.getHistory);
router.post('/low-traffic/trigger', lowTraffic.trigger);

// ============================================================
// 🔒 SÉCURITÉ & FRAUDE, EXPORTS CSV, PORTAIL RGPD LIBRE-SERVICE
// ============================================================
// GET /api/security/fraud-alerts → 🔒 super_admin ou merchant_admin du commerce concerné uniquement
router.get('/security/fraud-alerts', getFraudAlerts);

// GET /api/security/multi-accounts → 🔒 Détection de comptes multiples (device, IP, alias email, domaines jetables)
router.get('/security/multi-accounts', getMultiAccountAlerts);

// POST /api/security/recalculate-trust-score → 🔒 Recalcul et stockage du trust_score (0.0 → 1.0)
router.post('/security/recalculate-trust-score', recalculateTrustScoresHandler);

// GET /api/security/trust-scores → 🔒 Liste des scores de confiance des clients (triés par score croissant)
router.get('/security/trust-scores', getTrustScoresHandler);

// POST /api/security/unblock-client → 🔒 Déblocage manuel d'un client par un administrateur
router.post('/security/unblock-client', unblockClientFraudHandler);

router.get('/rgpd/portal-token', getRGPDPortalToken);
router.get('/rgpd/portal-data', getRGPDPortalData);
router.post('/rgpd/portal-data', updateRGPDPortalData);

router.get('/settings/advanced', getCommerceSettings);
router.post('/settings/advanced', updateCommerceSettings);

// Nouvelles routes pour les coûts marketing (qui utilisent la même logique mais peuvent être appelées spécifiquement)
router.get('/settings/marketing-costs', getCommerceSettings);
router.post('/settings/marketing-costs', updateCommerceSettings);

router.get('/export/clients', exportClientsCSV);
router.get('/export/campaigns', exportCampaignsCSV);
router.get('/export/global', exportGlobalCSV);
router.get('/export/dashboard', exportDashboardCSV);
router.get('/export/accounting', exportAccountingCSV);

// ============================================================
// 🧠 ANALYSE DE SENTIMENT — Avis Clients (Google / Facebook)
// ============================================================
router.post('/sentiment/analyze', analyzeSentiment);
router.get('/sentiment/history', getSentimentHistory);
router.get('/sentiment/prefill-history', prefillClientHistory);

// ============================================================
// 🌐 COLLECTE AUTOMATIQUE + FILE DE VALIDATION MANUELLE
// ============================================================
const {
    getQueue,
    validateQueueItem,
    rejectQueueItem,
    searchClients,
    triggerCollectNow,
    updateSuggestion,
} = require('../controllers/reviewCollectorController');

// GET  /api/sentiment/queue               → liste avis en attente
router.get('/sentiment/queue', getQueue);
// POST /api/sentiment/queue/:id/valider   → confirme client + analyse Groq + alerte VIP
router.post('/sentiment/queue/:id/valider', validateQueueItem);
// POST /api/sentiment/queue/:id/rejeter   → client inconnu + analyse Standard
router.post('/sentiment/queue/:id/rejeter', rejectQueueItem);
// POST /api/sentiment/queue/:id/corriger  → met à jour la suggestion client sans valider
router.post('/sentiment/queue/:id/corriger', updateSuggestion);
// GET  /api/sentiment/clients-search      → recherche clients pour correction manuelle
router.get('/sentiment/clients-search', searchClients);
// POST /api/sentiment/collect-now         → déclenche collecte manuelle (debug/test)
router.post('/sentiment/collect-now', triggerCollectNow);

module.exports = router;

