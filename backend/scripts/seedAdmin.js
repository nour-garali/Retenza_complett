require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Fix relative paths
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@retenza.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.password = password;
    await existing.save();
    console.log('✅ Admin user password updated:', email);
    process.exit(0);
  }

  await User.create({
    email,
    password,
    firstName: 'Admin',
    lastName: 'Retenza',
    role: 'admin',
  });

  console.log('✅ Admin user created:', email);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
