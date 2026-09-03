'use strict';

/**
 * scripts/seed_coherent_real_clients.js
 * ──────────────────────────────────────
 * Injecte des signaux de fraude cohérents sur des VRAIS clients existants
 * de la base de données (commerce_local_1 & commerce_local), puis déclenche
 * le recalcul dynamique du trust_score via fraudController.js.
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));
const { recalculateAllTrustScoresForCommerce } = require(path.join(rootDir, 'controllers/fraudController'));

(async () => {
    console.log('============================================================');
    console.log('🧪 INJECTION & RECALCUL SUR CLIENTS RÉELS DE LA BASE MONGODB');
    console.log('============================================================\n');

    try {
        const db = await connectDB();
        const todayStr = new Date().toISOString().substring(0, 10);

        // 1. Mettre à jour les vrais clients de commerce_local_1 avec des signaux de fraude
        console.log('📌 1. Mettre à jour de véritables clients dans "clients"...');

        // Client 1: Youssef Trabelsi (Appareil partagé + Panier Hors-Normes)
        await db.collection('clients').updateOne(
            { email: 'youssef.trabelsi@example.com', commerce_id: 'commerce_local_1' },
            {
                $set: {
                    device_id_creation: 'DEV_SHARED_TUNIS_99',
                    ip_creation_compte: '197.3.44.12',
                    trust_score: 1.0,
                    is_fraud_blocked: false
                }
            }
        );

        // Client 2: Fatma Khlifi (Même appareil + Même IP -> Alerte Multi-comptes + Fréquence d'achats)
        await db.collection('clients').updateOne(
            { email: 'fatma.khlifi@example.com', commerce_id: 'commerce_local_1' },
            {
                $set: {
                    device_id_creation: 'DEV_SHARED_TUNIS_99', // Même appareil que Youssef Trabelsi !
                    ip_creation_compte: '197.3.44.12',         // Même IP !
                    trust_score: 1.0,
                    is_fraud_blocked: false
                }
            }
        );

        // Client 3: Yassine Ayari (Alias + Domaine jetable)
        await db.collection('clients').updateOne(
            { email: 'yassine.ayari@example.com', commerce_id: 'commerce_local_1' },
            {
                $set: {
                    email: 'yassine.ayari+test@mailinator.com', // Converti en email jetable + alias
                    device_id_creation: 'DEV_SHARED_TUNIS_99',
                    trust_score: 1.0,
                    is_fraud_blocked: false
                }
            }
        );

        // 2. Assurer la présence dans chatbot_status pour Ghofrane Khadar
        console.log('📌 2. Mise à jour de "chatbot_status" pour modération chatbot...');
        await db.collection('chatbot_status').updateOne(
            { email: 'ghofrane.khadhar@gmail.com', commerce_id: 'commerce_local_1' },
            {
                $set: {
                    email: 'ghofrane.khadhar@gmail.com',
                    commerce_id: 'commerce_local_1',
                    warnings: 3,
                    is_blocked: true,
                    blocked_at: new Date().toISOString(),
                    block_reason: "Avertissements répétés (INSULTE : Propos vulgaires)"
                }
            },
            { upsert: true }
        );

        // 3. Injecter des commandes suspectes réelles pour commerce_local_1
        console.log('📌 3. Injection de commandes suspectes réelles dans "commandes"...');
        const testEmails = ['youssef.trabelsi@example.com', 'fatma.khlifi@example.com', 'yassine.ayari+test@mailinator.com'];
        await db.collection('commandes').deleteMany({ email: { $in: testEmails }, commerce_id: 'commerce_local_1' });

        const newCommandes = [
            // Commandes normales pour panier moyen
            { commerce_id: 'commerce_local_1', email: 'salim.gharbi@example.com', montant: 45, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'leila.cherif@example.com', montant: 55, date: todayStr },

            // 6 achats en 1 journée pour Fatma Khlifi (Déclenche Fréquence Suspecte)
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 30, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 40, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 35, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 50, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 45, date: todayStr },
            { commerce_id: 'commerce_local_1', email: 'fatma.khlifi@example.com', montant: 60, date: todayStr },

            // Panier hors-normes 750 DT pour Youssef Trabelsi (> 3x panier moyen)
            { commerce_id: 'commerce_local_1', email: 'youssef.trabelsi@example.com', montant: 750, date: todayStr }
        ];

        await db.collection('commandes').insertMany(newCommandes);

        // 4. Exécuter le recalcul dynamique officiel du Moteur Anti-Fraude !
        console.log('\n⚙️ 4. Lancement du recalcul officiel du Moteur Anti-Fraude pour commerce_local_1...');
        const updatedScores1 = await recalculateAllTrustScoresForCommerce('commerce_local_1');
        console.log(`✅ Recalcul terminé : ${updatedScores1.length} clients analysés.`);

        console.log('\n⚙️ 5. Lancement du recalcul officiel du Moteur Anti-Fraude pour commerce_local...');
        const updatedScores2 = await recalculateAllTrustScoresForCommerce('commerce_local');
        console.log(`✅ Recalcul terminé : ${updatedScores2.length} clients analysés.`);

        console.log('\n============================================================');
        console.log('✅ DONNÉES COHÉRENTES RÉELLES APPLIQUÉES EN BASE !');
        console.log('============================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur injection cohérente :', err);
        process.exit(1);
    }
})();
