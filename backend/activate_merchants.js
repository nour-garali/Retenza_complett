require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Commerce = require('./models/Commerce');
  const result = await Commerce.updateMany(
    { status: 'pending' },
    { $set: { status: 'active' } }
  );
  console.log('Updated', result.modifiedCount, 'commerce(s) to active');
  
  const all = await Commerce.find({}, 'name merchantCode status').lean();
  console.log('\nAll commerces:');
  all.forEach(c => console.log(' -', c.name, '| code:', c.merchantCode, '| status:', c.status));
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
