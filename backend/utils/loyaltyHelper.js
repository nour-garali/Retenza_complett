const LoyaltyAccount = require('../models/LoyaltyAccount');

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

const calculateReward = (commerce, programType, purchaseAmount) => {
  const program = commerce.loyaltyProgram;
  if (programType === 'points') {
    return Math.floor(purchaseAmount * (program.pointsPerEuro || 1));
  }
  if (programType === 'stamps') return 1;
  if (programType === 'cashback') {
    return (purchaseAmount * (program.cashbackPercentage || 0)) / 100;
  }
  return 0;
};

module.exports = { getOrCreateAccount, applyTransaction, calculateReward };
