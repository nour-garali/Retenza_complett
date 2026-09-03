/**
 * seedHeuresCreusesData.js
 * ────────────────────────
 * Script de démonstration et de test pour le module "Heures Creuses Booster".
 * 
 * 1. Génère un jeu de données réaliste de transactions sur 30 jours (du lundi au dimanche, 9h-18h).
 * 2. Répartit de manière cohérente l'affluence :
 *    - Fortes affluences (Vert) : Midi (12h-14h) en semaine, Samedi après-midi.
 *    - Activité normale (Gris) : Matinées et fins d'après-midi.
 *    - Heures creuses réparties sur plusieurs jours (Rouge) : Lundi 15h, Mardi 14h, Mercredi 15h, Jeudi 14h.
 * 3. Recalcule immédiatement le snapshot (Carte de chaleur / Heatmap).
 * 4. Déclenche 2 campagnes de test pour peupler le tableau "Historique".
 * 
 * Usage :
 *   node scripts/seedHeuresCreusesData.js
 */

'use strict';

require('dotenv').config();
const connectDB = require('../config/db');
const { calculateSnapshot, runLowTrafficAutomation, DEFAULTS } = require('../controllers/lowTrafficController');

const COMMERCE_ID = 'commerce_local_1';

// Jour de la semaine (0 = Dim, 1 = Lun, 2 = Mar, 3 = Mer, 4 = Jeu, 5 = Ven, 6 = Sam)
// Configuration des volumes moyens de transactions par heure pour le seed
const PATTERNS_PAR_JOUR = {
  // Lundi (1) : creux à 15h
  1: { 9: 6, 10: 7, 11: 8, 12: 18, 13: 20, 14: 7, 15: 1, 16: 8, 17: 9 },
  // Mardi (2) : creux à 14h
  2: { 9: 7, 10: 8, 11: 9, 12: 19, 13: 22, 14: 1, 15: 8, 16: 7, 17: 8 },
  // Mercredi (3) : creux à 15h
  3: { 9: 8, 10: 9, 11: 10, 12: 21, 13: 23, 14: 8, 15: 1, 16: 9, 17: 9 },
  // Jeudi (4) : creux à 14h
  4: { 9: 6, 10: 7, 11: 8, 12: 20, 13: 22, 14: 1, 15: 7, 16: 8, 17: 8 },
  // Vendredi (5) : affluence constante
  5: { 9: 9, 10: 10, 11: 12, 12: 25, 13: 27, 14: 10, 15: 9, 16: 12, 17: 14 },
  // Samedi (6) : forte affluence l'après-midi
  6: { 9: 10, 10: 12, 11: 15, 12: 22, 13: 25, 14: 18, 15: 22, 16: 25, 17: 18 },
  // Dimanche (0) : activité modérée le matin, creux léger en fin d'aprem
  0: { 9: 8, 10: 9, 11: 10, 12: 14, 13: 12, 14: 6, 15: 6, 16: 1, 17: 5 }
};

async function main() {
  console.log('🚀 Démarrage du seed réaliste Heures Creuses...');
  const db = await connectDB();

  // 1. Nettoyage des anciennes transactions de test du commerce
  await db.collection('transactions').deleteMany({ commerce_id: COMMERCE_ID });
  console.log(`🗑️  Anciennes transactions purgées pour ${COMMERCE_ID}.`);

  // 2. Génération des transactions sur 30 jours passés
  const now = Date.now();
  const transactionsToInsert = [];

  for (let dayAgo = 0; dayAgo < 30; dayAgo++) {
    const date = new Date(now - dayAgo * 86400000);
    const weekday = date.getDay();
    const pattern = PATTERNS_PAR_JOUR[weekday] || PATTERNS_PAR_JOUR[1];

    for (let hour = 9; hour < 18; hour++) {
      const baseCount = pattern[hour] || 6;
      // Ajout de petite variation aléatoire (+/- 1)
      const count = Math.max(0, baseCount + Math.floor(Math.random() * 3) - 1);

      for (let i = 0; i < count; i++) {
        const txDate = new Date(date);
        txDate.setHours(hour, Math.floor(Math.random() * 59), Math.floor(Math.random() * 59));

        transactionsToInsert.push({
          commerce_id: COMMERCE_ID,
          date_transaction: txDate.toISOString(),
          montant: Number((15 + Math.random() * 35).toFixed(2)),
          source: 'seed_demo'
        });
      }
    }
  }

  const resInsert = await db.collection('transactions').insertMany(transactionsToInsert);
  console.log(`✅ ${resInsert.insertedCount} transactions insérées sur les 30 derniers jours.`);

  // 3. Charger / initialiser les settings avec geo_radius_km et BOGO support
  const settings = {
    ...DEFAULTS,
    enabled: true,
    commerce_id: COMMERCE_ID,
    threshold_percent: 40,
    geo_radius_km: 5,
    offer: {
      type: 'percent',
      discount_percent: 20,
      bogo: { buy: 2, get: 1 },
      promo_code_prefix: 'FLASH',
      validity_minutes: 120,
      lead_time_minutes: 30
    }
  };
  await db.collection('heures_creuses_settings').updateOne(
    { commerce_id: COMMERCE_ID },
    { $set: settings },
    { upsert: true }
  );

  // 4. Calculer le Snapshot (Heatmap)
  console.log('📊 Recalcul du Snapshot / Heatmap...');
  const snapshot = await calculateSnapshot(db, COMMERCE_ID, settings);
  
  const lowSlots = snapshot.slots.filter(s => s.is_low_traffic);
  console.log(`🔥 ${lowSlots.length} créneaux d'heures creuses détectés :`);
  const daysMap = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
  lowSlots.forEach(s => {
    console.log(`   👉 ${daysMap[s.weekday]} à ${s.start_hour}h00 : Moyenne ${s.average_orders} cmd/h (Global: ${s.global_average}, Écart: ${s.delta_percent}%)`);
  });

  // 5. Générer 2 exemples de campagnes envoyées dans l'historique
  console.log('📧 Génération de 2 campagnes de démonstration dans l’historique...');

  // Nettoyer anciennes campagnes de test
  await db.collection('campagnes_envoyees').deleteMany({ commerce_id: COMMERCE_ID, category: 'low_traffic' });

  // Déclencher une première campagne automatique forcée
  const resultAuto = await runLowTrafficAutomation(COMMERCE_ID, db, { force: true });
  console.log(`⚡ Campagne 1 déclenchée :`, resultAuto);

  // Insérer une 2ème campagne passée de démonstration pour enrichir le tableau d'historique
  const demoCampaignBatch = `LOW-DEMO-${Date.now()}`;
  const nowStr = new Date(Date.now() - 3600000 * 24).toISOString();
  await db.collection('campagnes_envoyees').insertMany([
    {
      commerce_id: COMMERCE_ID,
      client_email: 'client1@demo.local',
      client_nom: 'Marie Dupont',
      subject: '⚡ Offre Flash : -20% !',
      body: 'De 14:00 à 16:00, profitez de -20% avec le code FLASH14.',
      sent_at: nowStr,
      status: 'simulated',
      channel: 'fcm',
      campaign_batch_id: demoCampaignBatch,
      opened: true,
      open_count: 1,
      category: 'low_traffic',
      low_traffic: { weekday: 2, start_at: new Date(Date.now() - 3600000 * 24), end_at: new Date(Date.now() - 3600000 * 22), discount_percent: 20 }
    },
    {
      commerce_id: COMMERCE_ID,
      client_email: 'client2@demo.local',
      client_nom: 'Thomas Martin',
      subject: '⚡ Offre Flash : -20% !',
      body: 'De 14:00 à 16:00, profitez de -20% avec le code FLASH14.',
      sent_at: nowStr,
      status: 'simulated',
      channel: 'email',
      campaign_batch_id: demoCampaignBatch,
      opened: false,
      open_count: 0,
      category: 'low_traffic',
      low_traffic: { weekday: 2, start_at: new Date(Date.now() - 3600000 * 24), end_at: new Date(Date.now() - 3600000 * 22), discount_percent: 20 }
    }
  ]);

  console.log('✅ Script de seed Heures Creuses terminé avec succès !');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
