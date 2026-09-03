const mongoose = require('mongoose');

let dbConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    // Pour MongoDB Atlas, augmenter les timeouts et ajouter retry
    const options = {
      serverSelectionTimeoutMS: 60000, // 60s
      socketTimeoutMS: 120000, // 120s
      connectTimeoutMS: 60000,
      maxPoolSize: 15,
      minPoolSize: 3,
      retryWrites: true,
      authSource: 'admin',
      heartbeatFrequencyMS: 10000,
      retryReads: true,
      // Ajouter des options spécifiques pour Atlas
      ...(uri.includes('mongodb+srv') && {
        ssl: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
      }),
    };

    await mongoose.connect(uri, options);
    dbConnected = true;
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    dbConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('Could not connect') || error.message.includes('ReplicaSetNoPrimary')) {
      console.error('\n🔧 Critical Issues to Check:');
      console.error('1. ⚠️  MongoDB Atlas Cluster Status - Check if cluster is having issues');
      console.error('   Go to: Databases > Clusters > Check status of "retenza-connect"');
      console.error('2. ⚠️  Network Access - Verify IP 102.156.54.119 is whitelisted');
      console.error('3. ⚠️  Credentials - Verify admin user password is correct');
      console.error('4. ⚠️  Region - Check if cluster region (Frankfurt) is accessible from Tunisia\n');
    }
    
    throw error;
  }
};

module.exports = connectDB;
module.exports.isConnected = () => dbConnected;
