'use strict';

/**
 * scripts/seed_realistic_6_clients.js
 * ─────────────────────────────────────
 * Injecte 6 cas clients réalistes avec des distributions de problèmes distinctes :
 *   - Clients avec 1 seul problème (ex: seulement Chatbot, seulement Email jetable, seulement Fréquence)
 *   - Clients avec 2 problèmes (ex: Appareil + IP, ou Appareil + Panier)
 *   - Clients avec 3 problèmes (ex: Chatbot + Fréquence + Panier)
 *
 * Utilise de véritables clients de la base MongoDB de la plateforme (commerce_local_1).
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));
const { recalculateAllTrustScoresForCommerce } = require(path.join(rootDir, 'controllers/fraudController'));

(async () => {
    console.log('============================================================');
    console.log('🧪 INJECTION DES 6 CAS CLIENTS RÉALISTES & VARIÉS (MONGODB)');
    console.log('============================================================\n');

    try {
        const db = await connectDB();
        const COMMERCE_ID = 'commerce_local_1';
        const todayStr = new Date().toISOString().substring(0, 10);

        // 1. Réinitialiser les attributs de fraude des clients concernés
        const testEmails = [
            'leila.cherif@example.com',
            'yassine.ayari+test@mailinator.com',
            'yassine.hammami@example.com',
            'youssef.trabelsi@example.com',
            'fatma.khlifi@example.com',
            'salim.gharbi@example.com',
            'ghofrane.khadhar@gmail.com'
        ];

        // Nettoyage de leurs anciennes commandes de test
        await db.collection('commandes').deleteMany({ email: { $in: testEmails }, commerce_id: COMMERCE_ID });
        await db.collection('chatbot_status').deleteMany({ email: { $in: testEmails }, commerce_id: COMMERCE_ID });

        console.log('📌 1. Configuration des signaux distincts par client...');

        // ── CAS 1 : 1 seul problème ➔ Chatbot Bloqué uniquement (Pas bloqué anti-fraude)
        await db.collection('clients').updateOne(
            { email: 'leila.cherif@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: null, ip_creation_compte: null } }
        );
        await db.collection('chatbot_status').insertOne({
            email: 'leila.cherif@example.com',
            commerce_id: COMMERCE_ID,
            warnings: 3,
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            block_reason: 'Avertissements répétés (INSULTE : Mots irrespectueux envers le conseiller SAV)'
        });

        // ── CAS 2 : 1 seul problème ➔ Fréquence d'achats uniquement (Pas bloqué anti-fraude)
        await db.collection('clients').updateOne(
            { email: 'yassine.ayari@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: null, ip_creation_compte: null } }
        );

        // ── CAS 3 : 1 seul problème ➔ Fréquence d'achats excessive uniquement (Pas bloqué anti-fraude)
        await db.collection('clients').updateOne(
            { email: 'yassine.hammami@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: null, ip_creation_compte: null } }
        );

        // ── CAS 4 : 2 problèmes ➔ Appareil partagé + IP partagée
        await db.collection('clients').updateOne(
            { email: 'youssef.trabelsi@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: 'DEV_SMART_TUNIS_99', ip_creation_compte: '197.3.44.12' } }
        );

        // ── CAS 5 : 2 problèmes ➔ Même Appareil partagé + Panier Hors-Normes (850 DT) ➔ Bloquée anti-fraude
        await db.collection('clients').updateOne(
            { email: 'fatma.khlifi@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: 'DEV_SMART_TUNIS_99', ip_creation_compte: '197.3.44.12' } }
        );

        // ── CAS 6 : 3 problèmes ➔ Chatbot bloqué + 8 achats/jour + Panier Hors-Normes (620 DT) + Appareil ➔ Bloqué anti-fraude (0.10)
        await db.collection('clients').updateOne(
            { email: 'salim.gharbi@example.com', commerce_id: COMMERCE_ID },
            { $set: { device_id_creation: 'DEV_SMART_TUNIS_99', ip_creation_compte: null } }
        );
        await db.collection('chatbot_status').insertOne({
            email: 'salim.gharbi@example.com',
            commerce_id: COMMERCE_ID,
            warnings: 3,
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            block_reason: 'Avertissements répétés (SPAM : Messages répétitifs hors sujet)'
        });

        // ── CAS 7 : Vrai client réél (Mohamed Trabelsi) bloqué Anti-Fraude UNIQUEMENT pour Multi-Comptes / Appareil & IP
        await db.collection('clients').updateOne(
            { email: 'mohamed.trabelsi@example.com', commerce_id: COMMERCE_ID },
            { 
                $set: { 
                    email: 'mohamed.trabelsi@example.com', 
                    device_id_creation: 'DEV_BOT_IDENTITY_01', 
                    ip_creation_compte: '197.3.99.100' 
                } 
            }
        );

        // ── CAS 8 : Vrai client réél (Ines Trabelsi) bloquée Anti-Fraude UNIQUEMENT pour Multi-Comptes / Appareil & IP
        await db.collection('clients').updateOne(
            { email: 'ines.trabelsi@example.com', commerce_id: COMMERCE_ID },
            { 
                $set: { 
                    email: 'ines.trabelsi@example.com', 
                    device_id_creation: 'DEV_BOT_IDENTITY_01', // Même appareil que Mohamed !
                    ip_creation_compte: '197.3.99.100'        // Même IP que Mohamed !
                } 
            }
        );

        // Autre client Chatbot Bloqué supplémentaire
        await db.collection('chatbot_status').insertOne({
            email: 'ghofrane.khadhar@gmail.com',
            commerce_id: COMMERCE_ID,
            warnings: 3,
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            block_reason: 'Avertissements répétés (INSULTE : Propos vulgaires)'
        });

        // 2. Commandes pour baseline et alertes
        console.log('📌 2. Injection des commandes de test ciblées...');
        const commandes = [
            // Baseline pour panier moyen (~45 DT)
            { commerce_id: COMMERCE_ID, email: 'ines.riahi@example.com', montant: 45, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'sonia.chaabane@example.com', montant: 50, date: todayStr },

            // Cas 3 : Yassine Hammami (7 achats le même jour)
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 30, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 35, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 40, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 25, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 50, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 30, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'yassine.hammami@example.com', montant: 45, date: todayStr },

            // Cas 5 : Fatma Khlifi (Panier Hors-Normes 850 DT)
            { commerce_id: COMMERCE_ID, email: 'fatma.khlifi@example.com', montant: 850, date: todayStr },

            // Cas 6 : Salim Gharbi (8 achats le même jour + Panier 620 DT)
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 620, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 40, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 35, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 30, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 25, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 45, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 50, date: todayStr },
            { commerce_id: COMMERCE_ID, email: 'salim.gharbi@example.com', montant: 35, date: todayStr }
        ];

        await db.collection('commandes').insertMany(commandes);

        // 3. Lancer le recalcul dynamique du moteur anti-fraude
        console.log('\n⚙️ 3. Exécution du recalcul dynamique des Trust Scores...');
        const updated = await recalculateAllTrustScoresForCommerce(COMMERCE_ID);
        console.log(`✅ Recalcul terminé.`);

        console.log('\n============================================================');
        console.log('✅ 6 CAS CLIENTS RÉALISTES & DIVERSIFIÉS APPLIQUÉS !');
        console.log('============================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    }
})();
