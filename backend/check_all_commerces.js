process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Commerce = require('./models/Commerce');
const LoyaltyAccount = require('./models/LoyaltyAccount');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retenza').then(async () => {
  try {
    const user = await User.findOne({ email: 'imen@gmail.com' });
    console.log('User role:', user ? user.role : 'NOT FOUND');
    
    // Find ALL commerces to see who the owner is
    const commerces = await Commerce.find().populate('owner');
    console.log('\nList of all Commerces:');
    commerces.forEach(c => {
      console.log(` - ${c.name} (Owner: ${c.owner ? c.owner.email : 'None'}) | ID: ${c._id}`);
    });
    
  } catch(e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
});
