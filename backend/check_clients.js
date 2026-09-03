process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Commerce = require('./models/Commerce');
const LoyaltyAccount = require('./models/LoyaltyAccount');
const Client = require('./models/Client');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retenza').then(async () => {
  try {
    const user = await User.findOne({ email: 'imen@gmail.com' });
    if (!user) {
      console.log('User imen@gmail.com not found');
      return;
    }
    console.log('User found:', user._id);
    
    const commerce = await Commerce.findOne({ merchant: user._id });
    if (!commerce) {
      console.log('No commerce found for this user');
      return;
    }
    console.log('Commerce found:', commerce.name, '| ID:', commerce._id);
    
    const loyaltyAccounts = await LoyaltyAccount.find({ commerce: commerce._id }).populate('client');
    console.log('Found ' + loyaltyAccounts.length + ' clients for this commerce:');
    
    loyaltyAccounts.forEach(acc => {
      console.log(' - Client:', acc.client.firstName, acc.client.lastName, '(', acc.client.email, ') | Points:', acc.pointsBalance);
    });
    
  } catch(e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
});
