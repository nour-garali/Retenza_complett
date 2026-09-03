const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Endpoints API du Chatbot pour le Dashboard Commerçant
router.get('/blocks', chatbotController.getBlockedClients);
router.get('/conversation/:email', chatbotController.getConversation);
router.post('/unblock', chatbotController.unblockClient);

// Nouveaux endpoints pour la Modération, les Tickets, les Signalements et les Métriques
router.get('/audit-logs', chatbotController.getAuditLogs);
router.get('/support-tickets', chatbotController.getSupportTickets);
router.patch('/support-tickets/:id/read', chatbotController.markSupportTicketRead);
router.patch('/support-tickets/:id', chatbotController.updateSupportTicketStatus);
router.get('/language-feedbacks', chatbotController.getLanguageFeedbacks);
router.post('/message-feedback', chatbotController.saveMessageFeedback);
router.get('/message-feedbacks', chatbotController.getMessageFeedbacks);
router.get('/metrics', chatbotController.getChatbotMetrics);

// Endpoints Session & Escalade Support Client
router.post('/verify-session', chatbotController.verifySession);
router.post('/support-tickets', chatbotController.createSupportTicket);
router.get('/client-status', chatbotController.getClientStatus);
router.post('/save-warning', chatbotController.saveWarning);
router.post('/reply', chatbotController.replyToClient);
router.post('/support-message', chatbotController.sendSupportMessage);
router.get('/support-sessions/:session_id', chatbotController.getSupportSession);

// Streaming IA
router.post('/stream', chatbotController.streamChat);

module.exports = router;
