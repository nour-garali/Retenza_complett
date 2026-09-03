const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const ScanHistory = require('../models/ScanHistory');
const GuestLoyaltyCard = require('../models/GuestLoyaltyCard');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const commerceId = req.params.commerceId || req.user.commerce;

  if (!commerceId) {
    return res.status(400).json({ success: false, message: 'Commerce ID is required' });
  }

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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    newClients7Days,
    newClients30Days,
    loyaltyStats,
    totalScans,
    convertedScans,
    recentTransactions,
    guestCardsTotal,
    guestCardsThisWeek,
  ] = await Promise.all([
    Client.countDocuments({ commerce: commerceId }),
    Client.countDocuments({ commerce: commerceId, createdAt: { $gte: sevenDaysAgo } }),
    Client.countDocuments({ commerce: commerceId, createdAt: { $gte: thirtyDaysAgo } }),
    LoyaltyAccount.aggregate([
      { $match: { commerce: commerce._id } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          totalStamps: { $sum: '$stamps' },
          totalCashback: { $sum: '$cashbackBalance' },
          totalEarned: { $sum: '$totalEarned' },
          totalRedeemed: { $sum: '$totalRedeemed' },
          activeAccounts: { $sum: 1 },
        },
      },
    ]),
    ScanHistory.countDocuments({ commerce: commerceId }),
    ScanHistory.countDocuments({ commerce: commerceId, converted: true }),
    LoyaltyTransaction.aggregate([
      { $match: { commerce: commerce._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    // Guest Loyalty Cards stats (Phase 3)
    GuestLoyaltyCard.countDocuments({ merchantId: commerceId, status: 'active' }),
    GuestLoyaltyCard.countDocuments({ merchantId: commerceId, status: 'active', createdAt: { $gte: sevenDaysAgo } }),
  ]);


  const loyalty = loyaltyStats[0] || {
    totalPoints: 0,
    totalStamps: 0,
    totalCashback: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    activeAccounts: 0,
  };

  const retentionRate =
    totalClients > 0
      ? Math.round(
          ((totalClients - newClients30Days) / totalClients) * 100 * 100
        ) / 100
      : 0;

  const conversionRate =
    totalScans > 0 ? Math.round((convertedScans / totalScans) * 100 * 100) / 100 : 0;

  res.json({
    success: true,
    data: {
      commerce: { id: commerce._id, name: commerce.name },
      clients: {
        total: totalClients,
        newLast7Days: newClients7Days,
        newLast30Days: newClients30Days,
      },
      loyalty: {
        ...loyalty,
        transactionsByType: recentTransactions,
      },
      qrScans: {
        total: totalScans,
        converted: convertedScans,
        conversionRate: `${conversionRate}%`,
      },
      // Guest Loyalty Cards — clients without Retenza app (Phase 3)
      guestCards: {
        total: guestCardsTotal,
        newThisWeek: guestCardsThisWeek,
      },
      retentionRate: `${retentionRate}%`,
    },
  });

});
