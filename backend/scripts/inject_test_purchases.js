require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Commerce = require('../models/Commerce');
const User = require('../models/User');
const Client = require('../models/Client');

async function run() {
  console.log("Tentative de connexion à MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:Retenza%402026@retenza-connect.t5ekkqr.mongodb.net/retenza_connect?retryWrites=true&w=majority&appName=retenza-connect');
  console.log("Connecté à MongoDB avec succès.");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  // Récupérer le nom du commerce depuis les arguments (ex: node inject_test_purchases.js "cozyy")
  const targetCommerceName = process.argv[2] || 'Mon Commerce';

  // Chercher le commerce cible
  let commerce = await Commerce.findOne({ name: { $regex: new RegExp(`^${targetCommerceName}$`, 'i') } });
  
  if (!commerce) {
    console.log(`❌ Le commerce "${targetCommerceName}" n'a pas été trouvé dans la base.`);
    
    // Afficher la liste des commerces existants pour aider l'utilisateur
    const allCommerces = await Commerce.find().select('name _id').lean();
    console.log("Commerces disponibles en base :");
    allCommerces.forEach(c => console.log(` - ${c.name} (ID: ${c._id})`));
    
    process.exit(1);
  }
  
  console.log(`✅ Commerce ciblé : ${commerce.name} (${commerce._id})`);

  // Vérifier le nombre d'achats validés ce mois-ci pour ce commerce
  const validatedThisMonth = await Purchase.aggregate([
    {
      $match: {
        commerce: commerce._id,
        status: 'validated',
        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const count = validatedThisMonth.length > 0 ? validatedThisMonth[0].count : 0;
  const totalAmount = validatedThisMonth.length > 0 ? validatedThisMonth[0].totalAmount : 0;

  console.log(`--- ACHATS CE MOIS-CI ---`);
  console.log(`Nombre d'achats validés : ${count}`);
  console.log(`Montant total cumulé    : ${totalAmount} DT/€`);
  console.log(`-------------------------`);

  if (count > 0) {
    console.log("Des données existent déjà. Le bug vient probablement de la requête dans billingController.js ou de la récupération frontend. Aucune donnée factice n'a été ajoutée.");
    process.exit(0);
  }

  console.log("Aucun achat validé ce mois-ci. Injection de données de test en cours...");

  // Création/Récupération d'un client fictif pour l'association
  let client = await Client.findOne({ email: 'test.client@retenza.dev' });
  if (!client) {
    client = await Client.findOne(); // Prendre n'importe quel client si possible
    if (!client) {
      client = await Client.create({
        firstName: "Test",
        lastName: "Client",
        email: "test.client@retenza.dev",
        phone: "12345678"
      });
    }
  }
  
  let merchantUser = await User.findOne({ commerce: commerce._id, role: 'merchant' });
  const performedBy = merchantUser ? merchantUser._id : commerce.merchant;

  // Création de 15 achats répartis sur le mois
  const purchasesToInsert = [];
  let currentTotal = 0;
  const targetTotal = 1200; // on vise ~1200 DT
  const numPurchases = 15;

  for (let i = 0; i < numPurchases; i++) {
    const day = Math.floor(Math.random() * now.getDate()) + 1; // Un jour aléatoire entre le 1er et aujourd'hui
    const date = new Date(now.getFullYear(), now.getMonth(), day, 12, 30, 0);
    
    let amount = Math.floor(Math.random() * 52) + 8; // Entre 8 et 60
    
    // Ajuster le dernier pour s'approcher de targetTotal si besoin
    if (i === numPurchases - 1) {
      amount = Math.max(8, targetTotal - currentTotal);
    }
    currentTotal += amount;

    purchasesToInsert.push({
      client: client._id,
      commerce: commerce._id,
      amount: amount,
      description: "Achat de test (généré)",
      status: 'validated',
      createdAt: date,
      validatedAt: date,
      performedBy: performedBy
    });
  }

  await Purchase.insertMany(purchasesToInsert);
  console.log(`✅ ${purchasesToInsert.length} achats validés injectés avec succès ! (Total: ${currentTotal} DT/€)`);
  
  process.exit(0);
}

run().catch(err => {
  console.error("Erreur d'exécution :", err);
  process.exit(1);
});
