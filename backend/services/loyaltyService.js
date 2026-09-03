const Commerce = require('../models/Commerce');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { getOrCreateAccount, applyTransaction, calculateReward } = require('../utils/loyaltyHelper');

const updateCustomerLoyalty = async (clientId, commerceId, purchaseAmount, performedBy) => {
  const commerce = await Commerce.findById(commerceId);
  if (!commerce) throw new Error('Commerce not found');

  const programType = commerce.loyaltyProgram.type;
  const rewardAmount = calculateReward(commerce, programType, purchaseAmount);
  
  if (rewardAmount <= 0) {
    return { success: true, rewardAmount: 0 };
  }

  const account = await getOrCreateAccount(clientId, commerceId);
  const newBalance = applyTransaction(account, programType, 'earn', rewardAmount);
  
  account.lastVisitAt = new Date();
  await account.save();

  // Trigger OTA (Over-The-Air) update for Google Wallet / Apple Wallet passes
  const walletService = require('./walletService');
  try {
    await walletService.updateWalletPass(account);
  } catch (err) {
    console.error('[LoyaltyService] Failed to trigger OTA Wallet update:', err.message);
  }

  const transaction = await LoyaltyTransaction.create({
    client: clientId,
    commerce: commerceId,
    type: 'earn',
    amount: rewardAmount,
    programType: programType,
    description: 'Reward for purchase of ' + purchaseAmount,
    performedBy: performedBy
  });

  return {
    success: true,
    rewardAmount,
    newBalance,
    transaction,
    account
  };
};

module.exports = {
  updateCustomerLoyalty
};
