const mongoose = require('mongoose');
require('dotenv').config();
const QRCode = require('./models/QRCode');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retenza').then(async () => {
  const bad = await QRCode.find({ url: /localhost/ });
  console.log('QR codes avec localhost URL:', bad.length);
  bad.forEach(q => console.log(' -', q.code, '|', q.url));
  
  if (bad.length > 0) {
    await QRCode.deleteMany({ url: /localhost/ });
    console.log('Supprimes. Seront recrees avec la bonne URL lors du prochain scan.');
  }
  
  await mongoose.disconnect();
  console.log('Done.');
}).catch(e => { console.error(e); process.exit(1); });
