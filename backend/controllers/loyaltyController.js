const LoyaltyAccount = require('../models/LoyaltyAccount');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Commerce = require('../models/Commerce');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreateAccount = async (clientId, commerceId) => {
  let account = await LoyaltyAccount.findOne({ client: clientId, commerce: commerceId });
  if (!account) {
    account = await LoyaltyAccount.create({ client: clientId, commerce: commerceId });
  }
  return account;
};

const applyTransaction = (account, programType, type, amount) => {
  const fieldMap = {
    points: 'points',
    stamps: 'stamps',
    cashback: 'cashbackBalance',
  };
  const field = fieldMap[programType];
  const delta = type === 'redeem' ? -Math.abs(amount) : Math.abs(amount);

  account[field] = Math.max(0, account[field] + delta);

  if (type === 'earn') account.totalEarned += Math.abs(amount);
  if (type === 'redeem') account.totalRedeemed += Math.abs(amount);

  return account[field];
};

exports.addTransaction = asyncHandler(async (req, res) => {
  const { clientId, commerceId, type, programType, amount, purchaseAmount, description } =
    req.body;

  const [client, commerce] = await Promise.all([
    Client.findById(clientId),
    Commerce.findById(commerceId),
  ]);

  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
  if (!commerce) return res.status(404).json({ success: false, message: 'Commerce not found' });

  if (
    req.user.role === 'merchant' &&
    commerce.merchant.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const account = await getOrCreateAccount(clientId, commerceId);
  let transactionAmount = amount;

  if (type === 'earn' && purchaseAmount && !amount) {
    const program = commerce.loyaltyProgram;
    if (programType === 'points') {
      transactionAmount = Math.floor(purchaseAmount * (program.pointsPerEuro || 1));
    } else if (programType === 'stamps') {
      transactionAmount = 1;
    } else if (programType === 'cashback') {
      transactionAmount = (purchaseAmount * (program.cashbackPercentage || 0)) / 100;
    }
  }

  if (!transactionAmount || transactionAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
  }

  const balanceAfter = applyTransaction(account, programType, type, transactionAmount);
  await account.save();

  // ── OTA: Update Google Wallet pass if client has one ─────────────────────
  if (account.walletObjectId) {
    try {
      const { updateLoyaltyObject } = require('../services/walletService');
      await updateLoyaltyObject(account._id, account, commerce);
      console.log(`[LoyaltyController] ✅ OTA wallet update sent for account: ${account._id}`);
    } catch (walletErr) {
      // Non-blocking — loyalty transaction succeeds even if wallet update fails
      console.warn(`[LoyaltyController] ⚠️ OTA wallet update failed (non-critical): ${walletErr.message}`);
    }
  }

  const transaction = await LoyaltyTransaction.create({
    client: clientId,
    commerce: commerceId,
    loyaltyAccount: account._id,
    type,
    programType,
    amount: transactionAmount,
    purchaseAmount: purchaseAmount || 0,
    balanceAfter,
    description,
    performedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Loyalty transaction recorded',
    data: { transaction, balance: account },
  });
});

exports.getBalance = asyncHandler(async (req, res) => {
  const { clientId, commerceId } = req.params;

  const account = await getOrCreateAccount(clientId, commerceId);
  const commerce = await Commerce.findById(commerceId).select('name loyaltyProgram');

  res.json({
    success: true,
    data: {
      balance: {
        points: account.points,
        stamps: account.stamps,
        cashbackBalance: account.cashbackBalance,
        totalEarned: account.totalEarned,
        totalRedeemed: account.totalRedeemed,
      },
      loyaltyProgram: commerce?.loyaltyProgram,
    },
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const { clientId, commerceId } = req.params;
  const { page = 1, limit = 20, programType } = req.query;

  const filter = { client: clientId, commerce: commerceId };
  if (programType) filter.programType = programType;

  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    LoyaltyTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoyaltyTransaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit) },
    },
  });
});

exports.updateLoyaltyProgram = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findById(req.params.commerceId);

  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (commerce.merchant.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  commerce.loyaltyProgram = { ...commerce.loyaltyProgram.toObject(), ...req.body };
  await commerce.save();

  res.json({
    success: true,
    message: 'Loyalty program updated',
    data: { loyaltyProgram: commerce.loyaltyProgram },
  });
});
