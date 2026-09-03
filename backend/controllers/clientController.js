const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const QRCode = require('../models/QRCode');
const ScanHistory = require('../models/ScanHistory');
const User = require('../models/User');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const Notification = require('../models/Notification');
const SupportRequest = require('../models/SupportRequest');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Purchase = require('../models/Purchase');
const asyncHandler = require('../utils/asyncHandler');

exports.registerAfterQRScan = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, qrCode: qrCodeParam, password } = req.body;

  // Try to find QR by code field (could be RC-XXXXXX or merchantCode like M482931)
  let qr = await QRCode.findOne({ code: qrCodeParam, isActive: true }).populate('commerce');

  // If not found by code, try to find by merchantCode (new format)
  if (!qr) {
    const commerce = await Commerce.findOne({ merchantCode: qrCodeParam, status: 'active' });
    if (commerce) {
      qr = await QRCode.findOne({ commerce: commerce._id, isActive: true });
      if (!qr) {
        // Auto-create the QR entry if missing
        qr = await QRCode.create({
          commerce: commerce._id,
          code: commerce.merchantCode,
          url: `https://retenza.app/join/${commerce.merchantCode}`,
          isActive: true,
        });
      }
      qr = await QRCode.findById(qr._id).populate('commerce');
    }
  }

  if (!qr || !qr.isActive) {
    return res.status(404).json({ success: false, message: 'QR Code invalide ou introuvable dans Retenza.' });
  }

  const commerce = qr.commerce;
  if (!commerce || commerce.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Ce commerce n\'est plus actif sur Retenza.' });
  }

  let user = await User.findOne({ email });
  if (!user && password) {
    user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'client',
    });
  }

  let client = await Client.findOne({ email });

  if (!client) {
    client = await Client.create({
      firstName,
      lastName,
      email,
      phone,
      user: user?._id,
    });
  } else if (user && !client.user) {
    // Fix: link the User account if it was missing (older records or re-registration)
    client.user = user._id;
    await client.save();
  }

  let loyaltyAccount = await LoyaltyAccount.findOne({
    client: client._id,
    commerce: commerce._id,
  });

  if (loyaltyAccount) {
    loyaltyAccount.lastVisitAt = new Date();
    await loyaltyAccount.save();
  } else {
    loyaltyAccount = await LoyaltyAccount.create({
      client: client._id,
      commerce: commerce._id,
      qrCode: qr._id,
      acquisitionSource: 'qr_scan',
    });
  }

  await ScanHistory.findOneAndUpdate(
    { qrCode: qr._id, client: { $exists: false } },
    { $set: { client: client._id, converted: true } },
    { sort: { scannedAt: -1 } }
  );

  res.status(201).json({
    success: true,
    message: 'Client registered and linked to commerce',
    data: { client, commerce: { id: commerce._id, name: commerce.name } },
  });
});

exports.getClientsByCommerce = asyncHandler(async (req, res) => {
  const { commerceId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const commerce = await Commerce.findById(commerceId);
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (
    req.user.role === 'merchant' &&
    commerce.merchant.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [loyaltyAccounts, total] = await Promise.all([
    LoyaltyAccount.find({ commerce: commerceId })
      .populate('client')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoyaltyAccount.countDocuments({ commerce: commerceId }),
  ]);

  const clients = loyaltyAccounts.map(acc => acc.client).filter(c => c != null);

  res.json({
    success: true,
    data: {
      clients,
      pagination: { total, page: Number(page), limit: Number(limit) },
    },
  });
});

exports.getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('commerce', 'name category');

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  res.json({ success: true, data: { client } });
});

exports.getSuggestions = asyncHandler(async (req, res) => {
  const commerces = await Commerce.find({ status: 'active' }).limit(10);
  res.json({ success: true, data: { commerces } });
});

exports.searchCommerces = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
  const searchRegex = new RegExp(query, 'i');
  const commerces = await Commerce.find({
    status: 'active',
    $or: [{ name: searchRegex }, { category: searchRegex }],
  });
  res.json({ success: true, data: { commerces } });
});

exports.getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json({ success: true, data: { favorites: user.favorites || [] } });
});

exports.addFavorite = asyncHandler(async (req, res) => {
  const { commerceId } = req.params;
  const commerce = await Commerce.findById(commerceId);
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }
  const user = await User.findById(req.user._id);
  if (!user.favorites) user.favorites = [];
  if (user.favorites.includes(commerceId)) {
    return res.status(400).json({ success: false, message: 'Commerce already in favorites' });
  }
  user.favorites.push(commerceId);
  await user.save();
  res.json({ success: true, message: 'Commerce added to favorites', data: { favorites: user.favorites } });
});

exports.removeFavorite = asyncHandler(async (req, res) => {
  const { commerceId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user.favorites || !user.favorites.includes(commerceId)) {
    return res.status(400).json({ success: false, message: 'Commerce not in favorites' });
  }
  user.favorites = user.favorites.filter((fav) => fav.toString() !== commerceId);
  await user.save();
  res.json({ success: true, message: 'Commerce removed from favorites', data: { favorites: user.favorites } });
});

exports.getFAQ = asyncHandler(async (req, res) => {
  const faq = [
    {
      id: 'faq-1',
      question: 'Comment puis-je accumuler des points ?',
      answer: 'Présentez simplement votre QR code de fidélité au commerçant lors de votre achat pour qu\'il le scanne et attribue vos points.',
    },
    {
      id: 'faq-2',
      question: 'Comment utiliser mes récompenses ?',
      answer: 'Dès que vous atteignez le seuil requis (points ou tampons), vous pouvez demander au commerçant d\'appliquer votre récompense lors du passage en caisse.',
    },
    {
      id: 'faq-3',
      question: 'Puis-je lier ma carte à Apple Wallet ou Google Wallet ?',
      answer: 'Oui, depuis l\'application mobile, cliquez sur "Ajouter à Apple Wallet" ou "Ajouter à Google Wallet" pour télécharger votre pass.',
    },
    {
      id: 'faq-4',
      question: 'Mes données personnelles sont-elles sécurisées ?',
      answer: 'Oui, Retenza Connect respecte strictement le RGPD. Vous pouvez modifier vos préférences de confidentialité ou supprimer votre compte à tout moment.',
    },
  ];
  res.json({ success: true, data: { faq } });
});

exports.getSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportRequest.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { tickets } });
});

exports.createSupportTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority, commerceId } = req.body;
  const ticket = await SupportRequest.create({
    subject,
    message,
    priority: priority || 'medium',
    submittedBy: req.user._id,
    commerce: commerceId || undefined,
  });
  res.status(201).json({ success: true, message: 'Support ticket submitted successfully', data: { ticket } });
});

exports.getSupportTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportRequest.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Support ticket not found' });
  }
  if (ticket.submittedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
  }
  res.json({ success: true, data: { ticket } });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { notifications } });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: { notification } });
});

exports.createTestNotification = asyncHandler(async (req, res) => {
  const { title, message, type } = req.body;
  const notification = await Notification.create({
    recipient: req.user._id,
    title: title || 'Test Notification',
    message: message || 'This is a test notification for you.',
    type: type || 'system',
  });
  res.status(201).json({ success: true, data: { notification } });
});

exports.getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { settings: user.settings } });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const { notifications, language, privacy } = req.body;
  const user = await User.findById(req.user._id);
  if (notifications !== undefined) user.settings.notifications = notifications;
  if (language !== undefined) user.settings.language = language;
  if (privacy !== undefined) user.settings.privacy = privacy;
  await user.save();
  res.json({ success: true, message: 'Settings updated successfully', data: { settings: user.settings } });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const email = req.user.email;
  // Find the single client profile
  let client = await Client.findOne({ email });
  if (!client) {
    // Auto-create client profile for older test accounts or missed registrations
    client = await Client.create({
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone,
      user: req.user._id,
    });
  }
  
  // Find active loyalty accounts
  const loyaltyAccounts = await LoyaltyAccount.find({ client: client._id }).populate('commerce', 'name category logo');
  
  const totalPoints = loyaltyAccounts.reduce((sum, acc) => sum + (acc.points || 0), 0);
  const totalStamps = loyaltyAccounts.reduce((sum, acc) => sum + (acc.stamps || 0), 0);
  const totalCashback = loyaltyAccounts.reduce((sum, acc) => sum + (acc.cashbackBalance || 0), 0);
  
  // Last 5 transactions
  const lastTransactions = await LoyaltyTransaction.find({ client: client._id })
    .populate('commerce', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      client: {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
      },
      activeCardsCount: loyaltyAccounts.length,
      totals: {
        points: totalPoints,
        stamps: totalStamps,
        cashback: totalCashback,
      },
      loyaltyAccounts,
      lastTransactions,
    },
  });
});

exports.getBalances = asyncHandler(async (req, res) => {
  const email = req.user.email;
  const clientProfiles = await Client.find({ email });
  const clientIds = clientProfiles.map((p) => p._id);
  const loyaltyAccounts = await LoyaltyAccount.find({ client: { $in: clientIds } }).populate('commerce', 'name category logo');
  res.json({ success: true, data: { balances: loyaltyAccounts } });
});

exports.redeemReward = asyncHandler(async (req, res) => {
  const { commerceId, programType, amount, description } = req.body;
  const email = req.user.email;
  
  const clientProfile = await Client.findOne({ email, commerce: commerceId }).populate('commerce');
  if (!clientProfile) {
    return res.status(404).json({ success: false, message: 'No client profile found for this commerce' });
  }

  const loyaltyAccount = await LoyaltyAccount.findOne({ client: clientProfile._id, commerce: commerceId });
  if (!loyaltyAccount) {
    return res.status(404).json({ success: false, message: 'Loyalty account not found' });
  }

  let currentBalance = 0;
  if (programType === 'points') currentBalance = loyaltyAccount.points;
  else if (programType === 'stamps') currentBalance = loyaltyAccount.stamps;
  else if (programType === 'cashback') currentBalance = loyaltyAccount.cashbackBalance;

  if (currentBalance < amount) {
    return res.status(400).json({ success: false, message: 'Insufficient balance to redeem reward' });
  }

  // Deduct reward
  if (programType === 'points') {
    loyaltyAccount.points -= amount;
    loyaltyAccount.totalRedeemed += amount;
  } else if (programType === 'stamps') {
    loyaltyAccount.stamps -= amount;
    loyaltyAccount.totalRedeemed += amount;
  } else if (programType === 'cashback') {
    loyaltyAccount.cashbackBalance -= amount;
    loyaltyAccount.totalRedeemed += amount;
  }
  await loyaltyAccount.save();

  // Create loyalty transaction
  const transaction = await LoyaltyTransaction.create({
    client: clientProfile._id,
    commerce: commerceId,
    loyaltyAccount: loyaltyAccount._id,
    type: 'redeem',
    programType,
    amount,
    balanceAfter: currentBalance - amount,
    description: description || 'Redeemed reward',
    performedBy: req.user._id,
  });

  // Create a notification for the client
  await Notification.create({
    recipient: req.user._id,
    title: 'Récompense utilisée !',
    message: `Vous avez utilisé ${amount} ${programType} chez ${clientProfile.commerce.name || 'votre commerçant'}.`,
    type: 'loyalty',
  });

  res.status(201).json({ success: true, message: 'Reward redeemed successfully', data: { transaction } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  res.json({ success: true, message: 'Profile updated successfully', data: { user } });
});

exports.deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'Account deactivated successfully' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const email = req.user.email;
  // Delete all client records under this email
  await Client.deleteMany({ email });
  // Delete the User record
  await User.findByIdAndDelete(req.user._id);
  res.json({ success: true, message: 'Account and associated profiles deleted successfully (GDPR)' });
});

exports.getPurchases = asyncHandler(async (req, res) => {
  const email = req.user.email;
  const clientProfiles = await Client.find({ email });
  const clientIds = clientProfiles.map((p) => p._id);
  const purchases = await Purchase.find({ client: { $in: clientIds } })
    .populate('commerce', 'name category logo')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { purchases } });
});

exports.getWalletPass = asyncHandler(async (req, res) => {
  const { commerceId, platform } = req.query;
  console.log(`[Wallet Pass] 🎯 Request — commerceId: ${commerceId}, user: ${req.user._id}, email: ${req.user.email}`);

  if (!commerceId) {
    return res.status(400).json({ success: false, message: 'commerceId is required' });
  }

  // ── Find client ──────────────────────────────────────────────────────────
  let client = await Client.findOne({ user: req.user._id });
  if (!client && req.user.email) {
    client = await Client.findOne({ email: req.user.email });
    if (client) {
      client.user = req.user._id;
      await client.save();
      console.log(`[Wallet Pass] Fixed missing user link for client: ${client._id}`);
    }
  }
  if (!client) {
    console.log(`[Wallet Pass] ❌ Client not found for user: ${req.user._id}`);
    return res.status(404).json({ success: false, message: 'Client introuvable pour cet utilisateur' });
  }

  // ── Find loyalty account with commerce populated ─────────────────────────
  const loyaltyAccount = await LoyaltyAccount.findOne({
    client: client._id,
    commerce: commerceId,
  }).populate('commerce');

  if (!loyaltyAccount) {
    console.log(`[Wallet Pass] ❌ Loyalty account not found — client: ${client._id}, commerce: ${commerceId}`);
    return res.status(404).json({ success: false, message: 'Compte de fidélité introuvable pour ce commerce' });
  }

  const commerce = loyaltyAccount.commerce;
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce introuvable' });
  }

  // ── Call Google Wallet Service ────────────────────────────────────────────
  const walletService = require('../services/walletService');
  const pass = await walletService.generateWalletPass(client, commerce, loyaltyAccount, platform);

  // ── Save walletObjectId in MongoDB for future OTA updates ────────────────
  if (pass.objectId && !loyaltyAccount.walletObjectId) {
    await LoyaltyAccount.findByIdAndUpdate(loyaltyAccount._id, { walletObjectId: pass.objectId });
    console.log(`[Wallet Pass] 💾 Saved walletObjectId: ${pass.objectId}`);
  }

  // Also cache the walletClassId on the Commerce document
  if (!commerce.walletClassId) {
    await Commerce.findByIdAndUpdate(commerce._id, {
      walletClassId: walletService.buildClassId(commerce._id),
    });
    console.log(`[Wallet Pass] 💾 Saved walletClassId on Commerce: ${commerce._id}`);
  }

  console.log(`[Wallet Pass] ✅ Pass generated successfully for ${client.firstName} ${client.lastName}`);
  res.json(pass);
});

