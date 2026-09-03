'use strict';

/**
 * scripts/fix_fraud_clients_coherence.js
 * ───────────────────────────────────────
 * 1. Change les emails de test bizarres vers des emails réalistes et identiques aux noms:
 *    - fraud.device.user@gmail.com  → marc.dupont@gmail.com (Marc Dupont)
 *    - suspicious.shopper@yahoo.fr  → karim.benali@yahoo.fr (Karim Benali)
 *
 * 2. Normalise les champs RFM et les segments GMM dans analyses_ia:
 *    - score_r / score_f / score_m
 *    - recency_score / frequency_score / monetary_score
 *    - segment_gmm: "VIP", "Régulier", etc.
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));

(async () => {
    console.log('============================================================');
    console.log('🔧 HARMONISATION & COHÉRENCE CLIENTS (EMAILS + SCORES RFM)');
    console.log('============================================================\n');

    try {
        const db = await connectDB();

        const MAPPINGS = [
            {
                oldEmail: 'fraud.device.user@gmail.com',
                newEmail: 'marc.dupont@gmail.com',
                nom: 'Marc Dupont',
                segment_gmm: 'Régulier',
                churn_score: 0.22,
                churn_risk_label: 'Faible',
                score_global_sa: 0.68,
                recency: 5,
                frequency: 15,
                monetary: 96.23,
                score_r: 0.75,
                score_f: 0.72,
                score_m: 0.58,
                recency_score: 0.75,
                frequency_score: 0.72,
                monetary_score: 0.58,
                trust_score: 0.10,
                is_fraud_blocked: true,
                fraud_block_reason: "Score de confiance critique (0.10 < 0.30) - Empreinte d'appareil partagée"
            },
            {
                oldEmail: 'suspicious.shopper@yahoo.fr',
                newEmail: 'karim.benali@yahoo.fr',
                nom: 'Karim Benali',
                segment_gmm: 'VIP',
                churn_score: 0.18,
                churn_risk_label: 'Faible',
                score_global_sa: 0.85,
                recency: 5,
                frequency: 22,
                monetary: 72.02,
                score_r: 0.82,
                score_f: 0.91,
                score_m: 0.88,
                recency_score: 0.82,
                frequency_score: 0.91,
                monetary_score: 0.88,
                trust_score: 0.00,
                is_fraud_blocked: true,
                fraud_block_reason: "Score de confiance critique (0.00 < 0.30) - Achats récurrents suspects le même jour"
            }
        ];

        const collections = ['clients', 'analyses_ia', 'commandes', 'transactions', 'chatbot_status', 'points_fidelite'];

        for (const item of MAPPINGS) {
            console.log(`📌 Traitement de ${item.nom} : ${item.oldEmail} → ${item.newEmail}`);

            for (const colName of collections) {
                // Update email field
                await db.collection(colName).updateMany(
                    { email: item.oldEmail },
                    { $set: { email: item.newEmail } }
                );
                await db.collection(colName).updateMany(
                    { client_email: item.oldEmail },
                    { $set: { client_email: item.newEmail } }
                );
                await db.collection(colName).updateMany(
                    { client_db_id: item.oldEmail },
                    { $set: { client_db_id: item.newEmail } }
                );
            }

            // Update clients collection details
            await db.collection('clients').updateOne(
                { email: item.newEmail, commerce_id: 'commerce_local' },
                {
                    $set: {
                        nom: item.nom,
                        email: item.newEmail,
                        trust_score: item.trust_score,
                        is_fraud_blocked: item.is_fraud_blocked,
                        fraud_block_reason: item.fraud_block_reason
                    }
                },
                { upsert: true }
            );

            // Update analyses_ia with complete RFM scores and segment_gmm
            await db.collection('analyses_ia').updateOne(
                { email: item.newEmail, commerce_id: 'commerce_local' },
                {
                    $set: {
                        client_db_id: item.newEmail,
                        email: item.newEmail,
                        nom: item.nom,
                        commerce_id: 'commerce_local',
                        segment_gmm: item.segment_gmm,
                        churn_score: item.churn_score,
                        churn_risk_label: item.churn_risk_label,
                        score_global_sa: item.score_global_sa,
                        recency: item.recency,
                        frequency: item.frequency,
                        monetary: item.monetary,
                        score_r: item.score_r,
                        score_f: item.score_f,
                        score_m: item.score_m,
                        recency_score: item.recency_score,
                        frequency_score: item.frequency_score,
                        monetary_score: item.monetary_score,
                        trust_score: item.trust_score,
                        is_fraud_blocked: item.is_fraud_blocked,
                        fraud_block_reason: item.fraud_block_reason,
                        updated_at: new Date().toISOString()
                    }
                },
                { upsert: true }
            );

            console.log(`   ✅ Mis à jour dans la base avec l'email ${item.newEmail}`);
        }

        // Check if there are any other clients in analyses_ia missing recency_score, frequency_score, monetary_score
        console.log('\n📌 Harmonisation globale des champs recency_score/frequency_score/monetary_score dans analyses_ia...');
        const allAnalyses = await db.collection('analyses_ia').find({}).toArray();
        let fixedCount = 0;
        for (const doc of allAnalyses) {
            const updates = {};
            if (doc.recency_score === undefined && doc.score_r !== undefined) {
                updates.recency_score = doc.score_r;
            }
            if (doc.frequency_score === undefined && doc.score_f !== undefined) {
                updates.frequency_score = doc.score_f;
            }
            if (doc.monetary_score === undefined && doc.score_m !== undefined) {
                updates.monetary_score = doc.score_m;
            }
            if (doc.score_r === undefined && doc.recency_score !== undefined) {
                updates.score_r = doc.recency_score;
            }
            if (doc.score_f === undefined && doc.frequency_score !== undefined) {
                updates.score_f = doc.frequency_score;
            }
            if (doc.score_m === undefined && doc.monetary_score !== undefined) {
                updates.score_m = doc.monetary_score;
            }

            if (Object.keys(updates).length > 0) {
                await db.collection('analyses_ia').updateOne({ _id: doc._id }, { $set: updates });
                fixedCount++;
            }
        }
        console.log(`   ✅ ${fixedCount} documents d'analyse RFM synchronisés.`);

        console.log('\n============================================================');
        console.log('✅ MODIFICATIONS APPLIQUÉES EN BASE MONGO !');
        console.log('============================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    }
})();
