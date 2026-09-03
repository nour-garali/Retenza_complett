const { v4: uuidv4 } = require('uuid');
const Commerce = require('../models/Commerce');
const Client = require('../models/Client');
const Incident = require('../models/Incident');
const QRCode = require('../models/QRCode');
const Purchase = require('../models/Purchase');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { getMerchantCommerce } = require('../utils/merchantHelper');
const { getOrCreateAccount, applyTransaction, calculateReward } = require('../utils/loyaltyHelper');
const asyncHandler = require('../utils/asyncHandler');

const generateUniqueCode = () => `RC-${uuidv4().split('-')[0].toUpperCase()}`;

const ensureQRCode = async (commerceId) => {
  // Always look for existing QR code
  let qrCode = await QRCode.findOne({ commerce: commerceId });
  if (qrCode) {
    // Migrate old /join/ URLs to new /m/ format (Phase 3 migration)
    if (qrCode.url && qrCode.url.includes('/join/')) {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3001';
      qrCode.url = `${frontendBase}/m/${qrCode.code}`;
      await qrCode.save();
    }
    return qrCode;
  }

  // Get merchantCode from Commerce to use as QR value
  const commerce = await Commerce.findById(commerceId).select('merchantCode');
  const code = commerce?.merchantCode || `RC-${uuidv4().split('-')[0].toUpperCase()}`;

  // Phase 3: QR now points to the public guest landing page
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3001';
  const qrUrl = `${frontendBase}/m/${code}`;

  qrCode = await QRCode.create({
    commerce: commerceId,
    code,
    url: qrUrl,
  });

  return qrCode;
};

const recordLoyaltyReward = async ({
  clientId,
  commerceId,
  programType,
  amount,
  purchaseAmount,
  description,
  performedBy,
}) => {
  const account = await getOrCreateAccount(clientId, commerceId);
  const balanceAfter = applyTransaction(account, programType, 'earn', amount);
  await account.save();

  const transaction = await LoyaltyTransaction.create({
    client: clientId,
    commerce: commerceId,
    loyaltyAccount: account._id,
    type: 'earn',
    programType,
    amount,
    purchaseAmount: purchaseAmount || 0,
    balanceAfter,
    description,
    performedBy,
  });

  return { account, transaction };
};

// ─── Incidents ─────────────────────────────────────────────────────

exports.listIncidents = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { commerce: commerce._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [incidents, total] = await Promise.all([
    Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Incident.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { incidents, pagination: { total, page: Number(page), limit: Number(limit) } },
  });
});

exports.getIncident = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const incident = await Incident.findOne({ _id: req.params.id, commerce: commerce._id })
    .populate('adminResponses.author', 'firstName lastName role')
    .populate('merchantComments.author', 'firstName lastName');

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  res.json({ success: true, data: { incident, responses: incident.adminResponses } });
});

exports.createIncident = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { title, description, type, priority } = req.body;

  const incident = await Incident.create({
    title,
    description,
    type,
    priority,
    reportedBy: req.user._id,
    commerce: commerce._id,
  });

  res.status(201).json({ success: true, message: 'Incident created', data: { incident } });
});

exports.updateIncident = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const incident = await Incident.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  if (!['reported', 'investigating'].includes(incident.status)) {
    return res.status(400).json({ success: false, message: 'Incident cannot be modified' });
  }

  const { title, description, type, priority } = req.body;
  if (title) incident.title = title;
  if (description) incident.description = description;
  if (type) incident.type = type;
  if (priority) incident.priority = priority;
  await incident.save();

  res.json({ success: true, message: 'Incident updated', data: { incident } });
});

exports.addIncidentComment = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const incident = await Incident.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  incident.merchantComments.push({ message: req.body.message, author: req.user._id });
  await incident.save();

  res.json({ success: true, message: 'Comment added', data: { incident } });
});

exports.confirmIncidentResolution = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const incident = await Incident.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  if (incident.status !== 'resolved') {
    return res.status(400).json({
      success: false,
      message: 'Incident must be resolved by admin before confirmation',
    });
  }

  incident.resolutionConfirmedByMerchant = true;
  incident.resolutionConfirmedAt = new Date();
  await incident.save();

  res.json({ success: true, message: 'Resolution confirmed', data: { incident } });
});

// ─── Programme de fidélité ─────────────────────────────────────────

exports.getLoyaltyProgram = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const qrCode = await QRCode.findOne({ commerce: commerce._id });

  res.json({
    success: true,
    data: { loyaltyProgram: commerce.loyaltyProgram, qrCode },
  });
});

exports.configurePoints = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { pointsPerEuro, rewardDescription } = req.body;

  commerce.loyaltyProgram = {
    ...commerce.loyaltyProgram.toObject(),
    type: 'points',
    pointsPerEuro: pointsPerEuro ?? commerce.loyaltyProgram.pointsPerEuro,
    rewardDescription: rewardDescription ?? commerce.loyaltyProgram.rewardDescription,
  };
  await commerce.save();

  const qrCode = await ensureQRCode(commerce._id);

  res.json({
    success: true,
    message: 'Points system configured',
    data: { loyaltyProgram: commerce.loyaltyProgram, qrCode },
  });
});

exports.configureStamps = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { stampsRequired, rewardDescription } = req.body;

  commerce.loyaltyProgram = {
    ...commerce.loyaltyProgram.toObject(),
    type: 'stamps',
    stampsRequired: stampsRequired ?? commerce.loyaltyProgram.stampsRequired,
    rewardDescription: rewardDescription ?? commerce.loyaltyProgram.rewardDescription,
  };
  await commerce.save();

  const qrCode = await ensureQRCode(commerce._id);

  res.json({
    success: true,
    message: 'Stamp system configured',
    data: { loyaltyProgram: commerce.loyaltyProgram, qrCode },
  });
});

exports.configureCashback = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { cashbackPercentage, rewardDescription } = req.body;

  commerce.loyaltyProgram = {
    ...commerce.loyaltyProgram.toObject(),
    type: 'cashback',
    cashbackPercentage: cashbackPercentage ?? commerce.loyaltyProgram.cashbackPercentage,
    rewardDescription: rewardDescription ?? commerce.loyaltyProgram.rewardDescription,
  };
  await commerce.save();

  const qrCode = await ensureQRCode(commerce._id);

  res.json({
    success: true,
    message: 'Cashback system configured',
    data: { loyaltyProgram: commerce.loyaltyProgram, qrCode },
  });
});

exports.generateQRCode = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const qrCode = await ensureQRCode(commerce._id);

  res.json({
    success: true,
    message: 'QR code ready',
    data: { qrCode },
  });
});

// ─── Clients ───────────────────────────────────────────────────────

exports.listClients = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Fetch from LoyaltyAccount instead of Client directly
  const [loyaltyAccounts, total] = await Promise.all([
    LoyaltyAccount.find({ commerce: commerce._id })
      .populate('client')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoyaltyAccount.countDocuments({ commerce: commerce._id }),
  ]);

  // Extract client objects, adding loyalty data if useful
  const clients = loyaltyAccounts.map(account => {
    return {
      ...account.client.toObject(),
      loyaltyPoints: account.points,
      loyaltyStamps: account.stamps,
      loyaltyCashback: account.cashbackBalance,
      joinedAt: account.createdAt,
      lastVisitAt: account.lastVisitAt
    };
  });

  res.json({
    success: true,
    data: { clients, pagination: { total, page: Number(page), limit: Number(limit) } },
  });
});

exports.getClientRewards = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const client = await Client.findOne({ _id: req.params.clientId, commerce: commerce._id });

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const account = await getOrCreateAccount(client._id, commerce._id);

  res.json({
    success: true,
    data: {
      client,
      rewards: {
        points: account.points,
        stamps: account.stamps,
        cashbackBalance: account.cashbackBalance,
        totalEarned: account.totalEarned,
        totalRedeemed: account.totalRedeemed,
      },
      loyaltyProgram: commerce.loyaltyProgram,
    },
  });
});

// ─── Achats ────────────────────────────────────────────────────────

exports.listPurchases = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { status, clientId, page = 1, limit = 20 } = req.query;
  const filter = { commerce: commerce._id };
  if (status) filter.status = status;
  if (clientId) filter.client = clientId;

  const skip = (Number(page) - 1) * Number(limit);
  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate('client', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Purchase.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { purchases, pagination: { total, page: Number(page), limit: Number(limit) } },
  });
});

exports.addPurchase = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const { clientId, amount, description, autoAssign } = req.body;

  const client = await Client.findOne({ _id: clientId, commerce: commerce._id });
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const purchase = await Purchase.create({
    client: clientId,
    commerce: commerce._id,
    amount,
    description,
    performedBy: req.user._id,
  });

  if (autoAssign) {
    const programType = commerce.loyaltyProgram.type;
    const rewardAmount = calculateReward(commerce, programType, amount);

    if (rewardAmount > 0) {
      await recordLoyaltyReward({
        clientId,
        commerceId: commerce._id,
        programType,
        amount: rewardAmount,
        purchaseAmount: amount,
        description: description || 'Purchase reward',
        performedBy: req.user._id,
      });

      purchase.rewards = {
        points: programType === 'points' ? rewardAmount : 0,
        stamps: programType === 'stamps' ? rewardAmount : 0,
        cashback: programType === 'cashback' ? rewardAmount : 0,
        assigned: true,
      };
      purchase.status = 'validated';
      purchase.validatedAt = new Date();
      await purchase.save();
    }
  }

  const populated = await Purchase.findById(purchase._id).populate(
    'client',
    'firstName lastName email'
  );

  res.status(201).json({
    success: true,
    message: 'Purchase added',
    data: { purchase: populated },
  });
});

exports.validatePurchase = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const purchase = await Purchase.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!purchase) {
    return res.status(404).json({ success: false, message: 'Purchase not found' });
  }

  if (purchase.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Purchase already processed' });
  }

  purchase.status = 'validated';
  purchase.validatedAt = new Date();
  await purchase.save();

  res.json({ success: true, message: 'Purchase validated', data: { purchase } });
});

const assignRewardHandler = (programType, rewardField) =>
  asyncHandler(async (req, res) => {
    const commerce = await getMerchantCommerce(req.user._id);
    const purchase = await Purchase.findOne({ _id: req.params.id, commerce: commerce._id });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const amount =
      req.body.amount ?? calculateReward(commerce, programType, purchase.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid reward amount' });
    }

    const { account, transaction } = await recordLoyaltyReward({
      clientId: purchase.client,
      commerceId: commerce._id,
      programType,
      amount,
      purchaseAmount: purchase.amount,
      description: req.body.description || `${programType} reward for purchase`,
      performedBy: req.user._id,
    });

    purchase.rewards[rewardField] = amount;
    purchase.rewards.assigned = true;
    if (purchase.status === 'pending') {
      purchase.status = 'validated';
      purchase.validatedAt = new Date();
    }
    await purchase.save();

    res.json({
      success: true,
      message: `${programType} assigned`,
      data: { purchase, balance: account, transaction },
    });
  });

exports.assignPoints = assignRewardHandler('points', 'points');
exports.assignStamps = assignRewardHandler('stamps', 'stamps');
exports.assignCashback = assignRewardHandler('cashback', 'cashback');
exports.deleteClient = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const clientId = req.params.id;

  const loyaltyAccount = await LoyaltyAccount.findOneAndDelete({
    commerce: commerce._id,
    client: clientId
  });

  if (!loyaltyAccount) {
    return res.status(404).json({ success: false, message: 'Client not found in your loyalty program' });
  }

  res.json({ success: true, message: 'Client removed from your loyalty program' });
});

exports.updateClientPoints = asyncHandler(async (req, res) => {
  const commerce = await getMerchantCommerce(req.user._id);
  const clientId = req.params.id;
  const { points } = req.body;

  if (points === undefined || points < 0) {
    return res.status(400).json({ success: false, message: 'Invalid points value' });
  }

  const loyaltyAccount = await LoyaltyAccount.findOneAndUpdate(
    { commerce: commerce._id, client: clientId },
    { points: points },
    { new: true }
  );

  if (!loyaltyAccount) {
    return res.status(404).json({ success: false, message: 'Client not found in your loyalty program' });
  }

  res.json({ success: true, message: 'Points updated successfully', data: { points: loyaltyAccount.points } });
});

// -----------------------------------------------------------------------------
// PUT /api/merchant/onboarding
// Sauvegarde la configuration initiale du commerce + marque l'onboarding termin�
// -----------------------------------------------------------------------------
exports.completeOnboarding = asyncHandler(async (req, res) => {
  const {
    // Profil commerce
    description, services, logoUrl,
    // Contact
    address, city, postalCode, phone, website,
    // Horaires
    openingHours,
    // Programme fid�lit�
    loyaltyType, pointsPerEuro, stampsRequired, cashbackPercentage,
    rewardName, rewardDescription, rewardThreshold, amountPerPoints,
  } = req.body;

  const commerce = await getMerchantCommerce(req.user._id);
  if (!commerce) return res.status(404).json({ success: false, message: 'Commerce introuvable.' });

  // Mise à jour du commerce
  if (description !== undefined)   commerce.description = description;
  if (services !== undefined)      commerce.services = services;
  if (logoUrl !== undefined)       commerce.logo = logoUrl;
  if (openingHours !== undefined)  commerce.openingHours = openingHours;

  // Contact
  if (address !== undefined)  commerce.contact.address = address;
  if (city !== undefined)     commerce.contact.city = city;
  if (postalCode !== undefined) commerce.contact.postalCode = postalCode;
  if (phone !== undefined)    commerce.contact.phone = phone;
  if (website !== undefined)  commerce.website = website;

  // Programme fid�lit�
  if (loyaltyType !== undefined) {
    commerce.loyaltyProgram.type = loyaltyType;
    if (loyaltyType === 'points') {
      if (pointsPerEuro !== undefined)   commerce.loyaltyProgram.pointsPerEuro = pointsPerEuro;
      if (amountPerPoints !== undefined) commerce.loyaltyProgram.amountPerPoints = amountPerPoints;
      if (rewardThreshold !== undefined) commerce.loyaltyProgram.rewardThreshold = rewardThreshold;
    }
    if (loyaltyType === 'stamps') {
      if (stampsRequired !== undefined)  commerce.loyaltyProgram.stampsRequired = stampsRequired;
    }
    if (loyaltyType === 'cashback') {
      if (cashbackPercentage !== undefined) commerce.loyaltyProgram.cashbackPercentage = cashbackPercentage;
    }
    if (rewardName !== undefined)        commerce.loyaltyProgram.rewardName = rewardName;
    if (rewardDescription !== undefined) commerce.loyaltyProgram.rewardDescription = rewardDescription;
  }

  await commerce.save();

  // Marquer l'onboarding comme termin�
  await require('../models/User').findByIdAndUpdate(req.user._id, { isOnboardingComplete: true });

  res.json({ success: true, message: 'Configuration initiale enregistr�e.', data: { commerce } });
});
