require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Commerce = require('../models/Commerce');

async function run() {
  const uri = 'mongodb://admin:Retenza%402026@ac-aoxmuz8-shard-00-00.t5ekkqr.mongodb.net:27017,ac-aoxmuz8-shard-00-01.t5ekkqr.mongodb.net:27017,ac-aoxmuz8-shard-00-02.t5ekkqr.mongodb.net:27017/retenza_connect?ssl=true&replicaSet=atlas-e5c5yr-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  console.log(`Période du mois: ${startOfMonth.toISOString()} au ${startOfNextMonth.toISOString()}`);

  const allPurchases = await Purchase.countDocuments();
  console.log(`Total achats en base (tout confondu): ${allPurchases}`);

  const purchasesThisMonth = await Purchase.countDocuments({
    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
  });
  console.log(`Achats ce mois-ci (tout statut): ${purchasesThisMonth}`);

  const validatedThisMonth = await Purchase.aggregate([
    {
      $match: {
        status: 'validated',
        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
      }
    },
    {
      $group: {
        _id: '$commerce',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  console.log('--- Achats Validés par Commerce (Mois en cours) ---');
  if (validatedThisMonth.length === 0) {
    console.log("Aucun achat validé ce mois-ci pour aucun commerce.");
  }

  for (const stat of validatedThisMonth) {
    const commerce = await Commerce.findById(stat._id);
    console.log(`Commerce: ${commerce?.name || stat._id} | Achats: ${stat.count} | CA Total: ${stat.totalAmount} DT/€`);
  }

  process.exit(0);
}

run().catch(console.error);
