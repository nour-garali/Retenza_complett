'use strict';
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config/db'));

(async () => {
    const db = await connectDB();
    const emails = ['fraud.device.user@gmail.com', 'suspicious.shopper@yahoo.fr'];
    
    console.log('\n=== analyses_ia ===');
    for (const email of emails) {
        const doc = await db.collection('analyses_ia').findOne({ email });
        if (doc) {
            console.log(`\n👤 ${doc.nom} (${doc.email})`);
            console.log(`   commerce_id   : ${doc.commerce_id}`);
            console.log(`   segment_gmm   : ${doc.segment_gmm}`);
            console.log(`   score_global_sa: ${doc.score_global_sa}`);
            console.log(`   churn_score   : ${doc.churn_score}`);
            console.log(`   churn_risk_label: ${doc.churn_risk_label}`);
            console.log(`   recency       : ${doc.recency}`);
            console.log(`   frequency     : ${doc.frequency}`);
            console.log(`   monetary      : ${doc.monetary}`);
            console.log(`   score_r / f / m: ${doc.score_r} / ${doc.score_f} / ${doc.score_m}`);
        } else {
            console.log(`❌ Introuvable : ${email}`);
        }
    }

    console.log('\n=== Nombre de commandes ===');
    for (const email of emails) {
        const count = await db.collection('commandes').countDocuments({ email });
        console.log(`   ${email} : ${count} commandes`);
    }

    process.exit(0);
})();
