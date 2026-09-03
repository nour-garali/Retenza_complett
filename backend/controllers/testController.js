const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const Incident = require('../models/Incident');
const SupportRequest = require('../models/SupportRequest');

exports.runAllE2ETests = async (req, res) => {
  const report = [];
  let adminToken = '';
  let merchantToken = '';
  let clientToken = '';
  let commerceId = '';
  let clientId = '';
  let qrCodeStr = '';
  let supportTicketId = '';
  let incidentId = '';

  const timestamp = Date.now();
  const merchantEmail = `merchant_test_${timestamp}@example.com`;
  const clientEmail = `client_test_${timestamp}@example.com`;
  const baseUrl = `http://localhost:${process.env.PORT || 3000}/api`;

  const addLog = (step, status, details = '') => {
    report.push({ step, status, details });
  };

  try {
    // Vérifier la connexion MongoDB
    if (mongoose.connection.readyState !== 1) {
      addLog('Database Connection', 'FAILED', 'MongoDB is not connected');
      throw new Error('Test aborted - Database connection failed');
    }

    // ==========================================
    // 1. ADMIN ACTIONS
    // ==========================================
    try {
      const resAdminLogin = await axios.post(`${baseUrl}/auth/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@retenza.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
      });
      adminToken = resAdminLogin.data.data.token;
      addLog('Admin Login', 'SUCCESS', 'Admin authenticated');
    } catch (err) {
      addLog('Admin Login', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    try {
      await axios.get(`${baseUrl}/admin/statistics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      addLog('Admin Stats', 'SUCCESS', 'Fetched global stats');
    } catch (err) {
      addLog('Admin Stats', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      await axios.get(`${baseUrl}/admin/commerces`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      addLog('Admin List Commerces', 'SUCCESS', 'Fetched all commerces');
    } catch (err) {
      addLog('Admin List Commerces', 'FAILED', err.response?.data?.message || err.message);
    }

    // ==========================================
    // 2. MERCHANT SETUP
    // ==========================================
    try {
      const resReg = await axios.post(`${baseUrl}/auth/register/merchant`, {
        email: merchantEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Merchant',
        commerceName: `Commerce Test ${timestamp}`,
        category: 'Restaurant',
      });
      merchantToken = resReg.data.data.token;
      addLog('Merchant Registration', 'SUCCESS', `Created ${merchantEmail}`);
    } catch (err) {
      addLog('Merchant Registration', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    try {
      const resMe = await axios.get(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });
      commerceId = resMe.data.data.user.commerce;
      
      // Admin activates commerce manually for the test
      await Commerce.findByIdAndUpdate(commerceId, { status: 'active' });
      addLog('Commerce Activation', 'SUCCESS', `Commerce ${commerceId} activated`);
    } catch (err) {
      addLog('Commerce Activation', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    try {
      await axios.put(`${baseUrl}/merchant/loyalty/points`, {
        pointsRate: 10,
        rewardValue: 5,
        minimumPoints: 100,
        isActive: true,
      }, { headers: { Authorization: `Bearer ${merchantToken}` } });
      addLog('Merchant Configure Points', 'SUCCESS', 'Points loyalty configured');
    } catch (err) {
      addLog('Merchant Configure Points', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      const resQr = await axios.post(`${baseUrl}/merchant/qrcode`, {}, { headers: { Authorization: `Bearer ${merchantToken}` } });
      qrCodeStr = resQr.data.data.qrCode.code;
      addLog('Merchant QR Code', 'SUCCESS', `Generated QR: ${qrCodeStr}`);
    } catch (err) {
      addLog('Merchant QR Code', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    // ==========================================
    // 3. CLIENT ACQUISITION
    // ==========================================
    try {
      const resClientReg = await axios.post(`${baseUrl}/clients/register-qr`, {
        firstName: 'Test',
        lastName: 'Client',
        email: clientEmail,
        password: 'Password123!',
        qrCode: qrCodeStr,
      });
      clientId = resClientReg.data.data.client._id;
      addLog('Client QR Scan & Register', 'SUCCESS', `Registered Client ID: ${clientId}`);
    } catch (err) {
      addLog('Client QR Scan & Register', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    try {
      const resClientLogin = await axios.post(`${baseUrl}/auth/login`, {
        email: clientEmail,
        password: 'Password123!',
      });
      clientToken = resClientLogin.data.data.token;
      addLog('Client Login', 'SUCCESS', 'Client authenticated');
    } catch (err) {
      addLog('Client Login', 'FAILED', err.response?.data?.message || err.message);
      throw new Error('Test aborted');
    }

    // ==========================================
    // 4. CLIENT EXPLORATION
    // ==========================================
    try {
      await axios.get(`${baseUrl}/clients/commerces/suggestions`, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Suggestions', 'SUCCESS', 'Fetched suggestions');
    } catch (err) {
      addLog('Client Suggestions', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      await axios.get(`${baseUrl}/clients/commerces/search?query=Restau`, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Search', 'SUCCESS', 'Searched commerces');
    } catch (err) {
      addLog('Client Search', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      // commerceId peut être un objet depuis Commerce Activation, extraire l'ID
      const favCommerceId = commerceId._id || commerceId;
      await axios.post(`${baseUrl}/clients/favorites/${favCommerceId}`, {}, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Add Favorite', 'SUCCESS', 'Added to favorites');
    } catch (err) {
      addLog('Client Add Favorite', 'FAILED', err.response?.data?.message || err.message);
    }

    // ==========================================
    // 5. INCIDENTS (MERCHANT <-> ADMIN)
    // ==========================================
    try {
      const resInc = await axios.post(`${baseUrl}/merchant/incidents`, {
        title: 'TPE Ne fonctionne pas avec les QR Codes.',
        description: 'Le terminal de paiement refuse de scanner les codes QR depuis ce matin.',
        type: 'technical',
        priority: 'high',
      }, { headers: { Authorization: `Bearer ${merchantToken}` } });
      incidentId = resInc.data.data.incident._id;
      addLog('Merchant Create Incident', 'SUCCESS', `Created Incident ID: ${incidentId}`);
    } catch (err) {
      addLog('Merchant Create Incident', 'FAILED', err.response?.data?.message || err.message);
    }

    if (incidentId) {
      try {
        await axios.patch(`${baseUrl}/admin/incidents/${incidentId}/status`, {
          status: 'investigating',
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        addLog('Admin Update Incident', 'SUCCESS', 'Incident marked investigating');
      } catch (err) {
        addLog('Admin Update Incident', 'FAILED', err.response?.data?.message || err.message);
      }
    }

    // ==========================================
    // 6. SUPPORT (CLIENT <-> ADMIN)
    // ==========================================
    try {
      const resSupp = await axios.post(`${baseUrl}/clients/support/tickets`, {
        subject: 'Bug sur iPhone',
        message: 'L\'application se ferme quand je scanne.',
        priority: 'high',
      }, { headers: { Authorization: `Bearer ${clientToken}` } });
      supportTicketId = resSupp.data.data.ticket._id;
      addLog('Client Create Support Ticket', 'SUCCESS', `Created Ticket ID: ${supportTicketId}`);
    } catch (err) {
      addLog('Client Create Support Ticket', 'FAILED', err.response?.data?.message || err.message);
    }

    if (supportTicketId) {
      try {
        await axios.post(`${baseUrl}/admin/support/${supportTicketId}/respond`, {
          message: 'Nous allons corriger cela dans la prochaine mise à jour.',
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        addLog('Admin Answer Support Ticket', 'SUCCESS', 'Replied to client ticket');
      } catch (err) {
        addLog('Admin Answer Support Ticket', 'FAILED', err.response?.data?.message || err.message);
      }
    }

    // ==========================================
    // 7. PURCHASES & LOYALTY
    // ==========================================
    try {
      await axios.post(`${baseUrl}/merchant/purchases`, {
        clientId,
        amount: 50,
        autoAssign: true,
      }, { headers: { Authorization: `Bearer ${merchantToken}` } });
      addLog('Merchant Add Purchase', 'SUCCESS', 'Simulated 50€ purchase and auto-assigned points');
    } catch (err) {
      addLog('Merchant Add Purchase', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      await axios.get(`${baseUrl}/clients/dashboard`, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Dashboard', 'SUCCESS', 'Fetched client dashboard');
    } catch (err) {
      addLog('Client Dashboard', 'FAILED', err.response?.data?.message || err.message);
    }

    // ==========================================
    // 8. SETTINGS & NOTIFICATIONS
    // ==========================================
    try {
      await axios.post(`${baseUrl}/clients/notifications/test`, {
        title: 'Test Notification',
        message: 'This is a test',
        type: 'system',
      }, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Test Notification', 'SUCCESS', 'Generated test notification');
    } catch (err) {
      addLog('Client Test Notification', 'FAILED', err.response?.data?.message || err.message);
    }

    try {
      await axios.put(`${baseUrl}/clients/settings`, {
        language: 'en',
      }, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Update Settings', 'SUCCESS', 'Changed language to English');
    } catch (err) {
      addLog('Client Update Settings', 'FAILED', err.response?.data?.message || err.message);
    }

    // ==========================================
    // 9. CLEANUP / GDPR
    // ==========================================
    try {
      await axios.delete(`${baseUrl}/clients/profile`, { headers: { Authorization: `Bearer ${clientToken}` } });
      addLog('Client Profile Deletion', 'SUCCESS', 'GDPR Account deletion executed');
    } catch (err) {
      addLog('Client Profile Deletion', 'FAILED', err.response?.data?.message || err.message);
    }

  } catch (globalError) {
    addLog('TEST_RUNNER', 'STOPPED', globalError.message);
  } finally {
    // Ultimate Database Cleanup Fallback
    try {
      if (merchantEmail) await User.findOneAndDelete({ email: merchantEmail });
      if (commerceId) await Commerce.findByIdAndDelete(commerceId);
      if (incidentId) await Incident.findByIdAndDelete(incidentId);
      if (supportTicketId) await SupportRequest.findByIdAndDelete(supportTicketId);
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
    
    const isSuccess = report.every((r) => r.status === 'SUCCESS');
    res.json({
      success: isSuccess,
      message: isSuccess ? 'All Automated Tests Passed!' : 'Some tests failed. See report.',
      report,
    });
  }
};
