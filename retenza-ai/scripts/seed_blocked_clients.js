'use strict';

/**
 * scripts/seed_blocked_clients.js
 * ────────────────────────────────
 * Script utilitaire pour injecter des clients de test bloqués pour motif anti-fraude
 * afin de tester l'interface utilisateur (http://localhost:3000/administration/securite).
 *
 * Utilisation :
 *   node scripts/seed_blocked_clients.js
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));

(async () => {
    console.log('============================================================');
    console.log('🧪 INJECTION DE CLIENTS TEST BLOQUÉS POUR TEST DE L\'INTERFACE');
    console.log('============================================================\n');

    try {
        const db = await connectDB();
        const COMMERCE_IDS = ['commerce_local', 'commerce_local_1'];

        const testClients = [
            {
                email: 'fraud.device.user@gmail.com',
                nom: 'Marc Dupont (Comptes multiples)',
                commerce_id: 'commerce_local',
                trust_score: 0.10,
                is_fraud_blocked: true,
                fraud_block_reason: "Score de confiance critique (0.10 < 0.30) - Signaux : Empreinte d'appareil partagée (DEV_8829) avec 3 autres comptes ; Adresse IP de création partagée",
                trust_score_updated_at: new Date().toISOString()
            },
            {
                email: 'promo.abuser+test1@mailinator.com',
                nom: 'Sophie Martin (Alias + Domaine Jetable)',
                commerce_id: 'commerce_local',
                trust_score: 0.20,
                is_fraud_blocked: true,
                fraud_block_reason: "Score de confiance critique (0.20 < 0.30) - Signaux : Alias d'email (+) détecté ; Domaine d'email jetable (mailinator.com)",
                trust_score_updated_at: new Date().toISOString()
            },
            {
                email: 'suspicious.shopper@yahoo.fr',
                nom: 'Karim Benali (Achats récurrents + Panier)',
                commerce_id: 'commerce_local',
                trust_score: 0.00,
                is_fraud_blocked: true,
                fraud_block_reason: "Score de confiance critique (0.00 < 0.30) - Signaux : 12 achats effectués le même jour ; Panier hors-normes (450 DT > 3.0x Panier Moyen) ; Compte Chatbot SAV bloqué",
                trust_score_updated_at: new Date().toISOString()
            }
        ];

        const emailsToClean = testClients.map(c => c.email);

        // 1. Nettoyage si déjà présents
        await db.collection('clients').deleteMany({ email: { $in: emailsToClean } });
        await db.collection('analyses_ia').deleteMany({ email: { $in: emailsToClean } });
        await db.collection('commandes').deleteMany({ email: { $in: emailsToClean } });

        // 2. Insertion dans clients et analyses_ia pour visibilité globale
        await db.collection('clients').insertMany(testClients);

        const analysesDocs = testClients.map(c => ({
            client_db_id: c.email,
            email: c.email,
            nom: c.nom,
            commerce_id: c.commerce_id,
            trust_score: c.trust_score,
            is_fraud_blocked: c.is_fraud_blocked,
            fraud_block_reason: c.fraud_block_reason,
            score_global_sa: 0.15,
            recency: 5,
            frequency: 1,
            monetary: 450
        }));
        await db.collection('analyses_ia').insertMany(analysesDocs);

        // 3. Insertion de commandes suspectes pour alimenter "Transactions & Volumes Suspects"
        const todayStr = new Date().toISOString().substring(0, 10);
        const testCommandes = [
            // Baseline standard (pour établir un panier moyen réaliste)
            { commerce_id: 'commerce_local', email: 'normal.client@gmail.com', montant: 50, date: todayStr },
            { commerce_id: 'commerce_local', email: 'normal.client2@gmail.com', montant: 40, date: todayStr },
            
            // 6 achats le même jour -> Déclenche l'alerte Fréquence/Volume Suspect (> 5 achats/jour)
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 35, date: todayStr },
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 40, date: todayStr },
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 30, date: todayStr },
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 45, date: todayStr },
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 50, date: todayStr },
            { commerce_id: 'commerce_local', email: 'suspicious.shopper@yahoo.fr', montant: 30, date: todayStr },

            // Panier Hors-Normes (> 3x le panier moyen)
            { commerce_id: 'commerce_local', email: 'fraud.device.user@gmail.com', montant: 650, date: todayStr }
        ];

        await db.collection('commandes').insertMany(testCommandes);

        console.log('✅ 3 clients de test bloqués injectés avec succès dans MongoDB');
        console.log('✅ Commandes suspectes de test injectées pour "Transactions & Volumes Suspects"');
        testClients.forEach(c => {
            console.log(`   - 👤 ${c.nom} (${c.email}) | Score: ${c.trust_score.toFixed(2)} | Bloqué: ${c.is_fraud_blocked}`);
        });

        console.log('\n============================================================');
        console.log('👉 Allez maintenant sur http://localhost:3000/administration/securite');
        console.log('👉 Cliquez sur "Rafraîchir" pour voir les 3 clients bloqués et tester le bouton "Débloquer" !');
        console.log('============================================================');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur lors de l\'injection :', err);
        process.exit(1);
    }
})();
