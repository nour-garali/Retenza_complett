require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

let dbConnected = false;

connectDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ MongoDB successfully connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed');
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    console.warn('\n🔧 Troubleshooting steps:');
    console.warn('1. Check MongoDB Atlas Network Access - is your IP whitelisted?');
    console.warn('2. Verify credentials: admin / Retenza@2026');
    console.warn('3. Check if cluster is active (not paused)');
    console.warn('4. Test connection string in MongoDB Compass\n');
  });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'RetenzaConnect API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  })
);

app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`RetenzaConnect API running on http://0.0.0.0:${PORT} (accessible on all network interfaces)`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  if (!dbConnected) {
    console.warn('⚠️  Database not connected - API will not work until MongoDB is accessible');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process first:`);
    console.error(`  Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
    process.exit(1);
  }
  throw err;
});
module.exports = app;
