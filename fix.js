const fs = require('fs');
const file = 'backend/controllers/clientController.js';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('exports.getDashboard = asyncHandler(async (req, res) => {');
const endIdx = content.indexOf('exports.redeemReward = asyncHandler(async (req, res) => {');

const correctCode = `exports.getDashboard = asyncHandler(async (req, res) => {
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

`;

content = content.substring(0, startIdx) + correctCode + content.substring(endIdx);
fs.writeFileSync(file, content);
console.log('Fixed');
