'use strict';
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config/db'));

(async () => {
    const db = await connectDB();
    const COMMERCE_ID = 'commerce_local';

    const campaigns = await db.collection('campagnes_envoyees').find({ commerce_id: COMMERCE_ID }).toArray();
    const commandes = await db.collection('commandes').find({ commerce_id: COMMERCE_ID }).toArray();
    const transactions = await db.collection('transactions').find({ commerce_id: COMMERCE_ID }).toArray();

    const purchases = [];
    [...commandes, ...transactions].forEach(doc => {
        const rawEmail = doc.client_email || doc.email;
        const pDate = doc.date_commande || doc.date || doc.date_transaction || doc.date_creation;
        if (rawEmail && pDate) {
            purchases.push({
                emailLower: rawEmail.toLowerCase().trim(),
                date: new Date(pDate),
                amount: parseFloat(doc.montant_total || doc.montant || 0)
            });
        }
    });

    console.log(`Total purchases found for ${COMMERCE_ID}: ${purchases.length}`);
    console.log("Sample purchases:", purchases.slice(0, 5));

    for (const days of [7, 14, 30]) {
        const windowMs = days * 24 * 60 * 60 * 1000;
        let convertedCount = 0;
        let attributedRevenue = 0;

        purchases.forEach(p => {
            const txTime = p.date.getTime();
            const clientCamps = campaigns.filter(c => c.client_email && c.client_email.toLowerCase().trim() === p.emailLower);
            
            let matched = false;
            clientCamps.forEach(c => {
                const cTime = new Date(c.sent_at).getTime();
                if (cTime <= txTime && (txTime - cTime) <= windowMs) {
                    matched = true;
                }
            });
            if (matched) {
                convertedCount++;
                attributedRevenue += p.amount;
            }
        });

        console.log(`\nWindow ${days} days: Converted purchases = ${convertedCount}, Attributed Revenue = ${attributedRevenue} DT`);
    }

    process.exit(0);
})();
