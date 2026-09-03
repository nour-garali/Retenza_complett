'use strict';

/**
 * scripts/seed_realistic_fraud_clients.js
 * ─────────────────────────────────────────
 * Met à jour les clients fraud/test de commerce_local avec :
 *   - Un vrai historique de commandes sur 12 mois (cohérent avec leur profil)
 *   - Un vrai RFM calculable par le pipeline Python
 *   - Des données demographics propres (nom sans parenthèses)
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().substring(0, 10);
}

(async () => {
    console.log('============================================================');
    console.log('🔧 ENRICHISSEMENT DES CLIENTS FRAUD AVEC HISTORIQUE RÉALISTE');
    console.log('============================================================\n');

    try {
        const db = await connectDB();
        const COMMERCE_ID = 'commerce_local';

        // ── 1. Nettoyer les anciennes commandes de ces clients ──
        const emailsToFix = ['fraud.device.user@gmail.com', 'suspicious.shopper@yahoo.fr'];
        await db.collection('commandes').deleteMany({
            email: { $in: emailsToFix },
            commerce_id: COMMERCE_ID
        });
        await db.collection('transactions').deleteMany({
            client_email: { $in: emailsToFix },
            commerce_id: COMMERCE_ID
        });

        console.log('🗑️  Anciennes commandes de test supprimées.');

        // ── 2. Injecter un historique réaliste pour Marc Dupont ──
        // Profil : Client régulier (fréquent, panier moyen 55 DT), mais 1 commande suspecte récente
        const marcCommandes = [
            // Historique sur 10 mois — régulier toutes les 2-3 semaines
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 48.50, date: daysAgo(300) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 62.00, date: daysAgo(278) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 53.00, date: daysAgo(257) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 71.50, date: daysAgo(236) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 45.00, date: daysAgo(214) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 58.00, date: daysAgo(193) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 66.50, date: daysAgo(171) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 49.00, date: daysAgo(150) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 55.00, date: daysAgo(128) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 72.00, date: daysAgo(107) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 44.50, date: daysAgo(85) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 60.00, date: daysAgo(64) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 57.50, date: daysAgo(42) },
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 51.00, date: daysAgo(21) },
            // Commande suspecte récente : panier hors-norme (ce qui a déclenché l'alerte fraude)
            { commerce_id: COMMERCE_ID, client_email: 'fraud.device.user@gmail.com', email: 'fraud.device.user@gmail.com', montant: 650.00, date: daysAgo(5) },
        ];

        // ── 3. Injecter un historique réaliste pour Karim Benali ──
        // Profil : Client VIP fréquent (achat presque chaque semaine, panier 70-90 DT), comportement suspect récent
        const karimCommandes = [
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 78.00, date: daysAgo(290) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 85.00, date: daysAgo(272) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 92.50, date: daysAgo(254) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 74.00, date: daysAgo(237) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 88.00, date: daysAgo(219) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 96.00, date: daysAgo(201) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 81.50, date: daysAgo(183) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 77.00, date: daysAgo(165) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 89.00, date: daysAgo(147) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 95.50, date: daysAgo(129) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 83.00, date: daysAgo(110) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 76.50, date: daysAgo(91) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 90.00, date: daysAgo(73) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 87.50, date: daysAgo(55) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 82.00, date: daysAgo(36) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 79.00, date: daysAgo(18) },
            // Achats suspects : 6 commandes en 1 jour (ce qui a déclenché l'alerte fraude)
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 35.00, date: daysAgo(5) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 40.00, date: daysAgo(5) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 30.00, date: daysAgo(5) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 45.00, date: daysAgo(5) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 50.00, date: daysAgo(5) },
            { commerce_id: COMMERCE_ID, client_email: 'suspicious.shopper@yahoo.fr', email: 'suspicious.shopper@yahoo.fr', montant: 30.00, date: daysAgo(5) },
        ];

        await db.collection('commandes').insertMany([...marcCommandes, ...karimCommandes]);
        console.log(`✅ ${marcCommandes.length} commandes insérées pour Marc Dupont`);
        console.log(`✅ ${karimCommandes.length} commandes insérées pour Karim Benali`);

        // ── 4. Mettre à jour analyses_ia avec des valeurs RFM calculées manuellement ──
        // (en attendant que le pipeline Python officiel tourne)
        const now = new Date();

        // Marc Dupont : régulier, panier ~57 DT, 15 achats, dernière visite il y a 5 jours
        await db.collection('analyses_ia').updateOne(
            { email: 'fraud.device.user@gmail.com', commerce_id: COMMERCE_ID },
            {
                $set: {
                    nom: 'Marc Dupont',
                    recency: 5,
                    frequency: 15,
                    monetary: parseFloat((marcCommandes.reduce((s, c) => s + c.montant, 0) / marcCommandes.length).toFixed(2)),
                    score_global_sa: 0.68,
                    segment_gmm: 'Régulier',
                    churn_score: 0.22,
                    churn_risk_label: 'Faible',
                    score_r: 0.75,
                    score_f: 0.72,
                    score_m: 0.58,
                    updated_at: now.toISOString()
                }
            }
        );

        // Karim Benali : VIP très fréquent, panier ~78 DT, 22 achats, dernière visite il y a 5 jours
        const karimMonetary = parseFloat((karimCommandes.reduce((s, c) => s + c.montant, 0) / karimCommandes.length).toFixed(2));
        await db.collection('analyses_ia').updateOne(
            { email: 'suspicious.shopper@yahoo.fr', commerce_id: COMMERCE_ID },
            {
                $set: {
                    nom: 'Karim Benali',
                    recency: 5,
                    frequency: 22,
                    monetary: karimMonetary,
                    score_global_sa: 0.85,
                    segment_gmm: 'VIP',
                    churn_score: 0.18,
                    churn_risk_label: 'Faible',
                    score_r: 0.82,
                    score_f: 0.91,
                    score_m: 0.88,
                    updated_at: now.toISOString()
                }
            }
        );

        // ── 5. Mettre à jour la collection clients aussi ──
        await db.collection('clients').updateOne(
            { email: 'fraud.device.user@gmail.com', commerce_id: COMMERCE_ID },
            { $set: { nom: 'Marc Dupont' } }
        );
        await db.collection('clients').updateOne(
            { email: 'suspicious.shopper@yahoo.fr', commerce_id: COMMERCE_ID },
            { $set: { nom: 'Karim Benali' } }
        );

        console.log('\n✅ Analyses RFM mises à jour :');
        console.log('   Marc Dupont     → Segment: Régulier | Churn: 22% | Score: 0.68');
        console.log('   Karim Benali    → Segment: VIP       | Churn: 18% | Score: 0.85');

        console.log('\n============================================================');
        console.log('✅ CLIENTS ENRICHIS AVEC HISTORIQUE RÉALISTE !');
        console.log('⚠️  Pour des scores RFM officiels, lancez aussi le recalcul RFM');
        console.log('   depuis l\'interface → Dashboard → Recalculer RFM');
        console.log('============================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    }
})();
