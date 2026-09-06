const asyncHandler = require('../middlewares/asyncHandler');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const GuestLoyaltyCard = require('../models/GuestLoyaltyCard');
const Client = require('../models/Client');

exports.globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json({ success: true, data: [] });
  }

  const commerceId = req.user.commerce;
  if (!commerceId) {
    return res.json({ success: true, data: [] });
  }

  const searchRegex = new RegExp(q.trim(), 'i');
  const results = [];

  // 1. Search Clients
  const loyaltyAccounts = await LoyaltyAccount.find({ commerce: commerceId }).select('client');
  const clientIds = loyaltyAccounts.map(acc => acc.client);

  const clients = await Client.find({
    _id: { $in: clientIds },
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ]
  }).limit(5);

  clients.forEach(client => {
    results.push({
      id: client._id.toString(),
      type: 'Client',
      title: `${client.firstName} ${client.lastName}`,
      subtitle: client.email || client.phone,
      url: `/merchant/clients-ia` 
    });
  });

  // 2. Search Guest Loyalty Cards
  const guestCards = await GuestLoyaltyCard.find({
    commerce: commerceId,
    $or: [
      { guestName: searchRegex },
      { guestEmail: searchRegex },
      { guestPhone: searchRegex }
    ]
  }).limit(5);

  guestCards.forEach(card => {
    results.push({
      id: card._id.toString(),
      type: 'Client (Invité)',
      title: card.guestName || 'Client sans nom',
      subtitle: card.guestEmail || card.guestPhone,
      url: `/merchant/clients-ia`
    });
  });

  res.json({
    success: true,
    data: results
  });
});
