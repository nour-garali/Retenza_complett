// Charger .env.local si disponible (pour développement local avec MongoDB)
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const localEnvPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(localEnvPath)) {
  console.log('📝 Loading .env.local configuration...');
  dotenv.config({ path: localEnvPath });
}
