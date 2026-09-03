'use strict';
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config/db'));

(async () => {
    const db = await connectDB();
    const emails = ['marc.dupont@gmail.com', 'karim.benali@yahoo.fr'];
    
    console.log('\n=== VERIFICATION DES CLIENTS APRES CORRECTIF ===\n');
    for (const email of emails) {
        const c = await db.collection('clients').findOne({ email });
        const a = await db.collection('analyses_ia').findOne({ email });
        
        console.log(`👤 Client: ${c ? c.nom : 'INCONNU'} | Email: ${email}`);
        console.log(`   [clients]     nom: "${c?.nom}", trust_score: ${c?.trust_score}`);
        console.log(`   [analyses_ia] nom: "${a?.nom}", segment_gmm: "${a?.segment_gmm}", score_r: ${a?.score_r}, score_f: ${a?.score_f}, score_m: ${a?.score_m}`);
        console.log(`   [analyses_ia] recency_score: ${a?.recency_score}, frequency_score: ${a?.frequency_score}, monetary_score: ${a?.monetary_score}`);
        console.log(`   [analyses_ia] recency: ${a?.recency}, frequency: ${a?.frequency}, monetary: ${a?.monetary}`);
        console.log('─'.repeat(60));
    }

    process.exit(0);
})();
