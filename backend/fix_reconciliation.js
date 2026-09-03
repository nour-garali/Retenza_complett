require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const { reconcileGuestCards } = require('./services/reconciliationService');
  const GuestLoyaltyCard = require('./models/GuestLoyaltyCard');
  const User = require('./models/User');

  console.log('Reverting merged cards...');
  await GuestLoyaltyCard.updateMany({ status: 'merged' }, { $set: { status: 'active' } });

  console.log('Reconciling all clients...');
  const users = await User.find({ role: 'client' });
  for (let u of users) {
    await reconcileGuestCards({ retenzaUserId: u._id, email: u.email, phone: u.phone });
  }

  console.log('Done!');
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
