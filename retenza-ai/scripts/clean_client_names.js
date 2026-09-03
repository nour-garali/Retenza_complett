'use strict';
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config/db'));

// Noms propres à corriger dans les deux collections
const ADDITIONAL_FIXES = {
    'fraud.device.user@gmail.com':   'Marc Dupont',
    'suspicious.shopper@yahoo.fr':   'Karim Benali',
    'jaja':                           null, // email invalide → sera ignoré
};

(async () => {
    const db = await connectDB();

    // 1. Trouver tous les clients avec des noms qui contiennent des parenthèses ou ...
    const badClients = await db.collection('clients').find({}).toArray();
    const badAnalyses = await db.collection('analyses_ia').find({}).toArray();

    let fixed = 0;

    for (const c of badClients) {
        const nom = c.nom || '';
        if (nom.includes('(') || nom.includes('...') || nom === 'jaja') {
            const cleanName = nom.replace(/\s*\(.*?\)/g, '').trim();
            if (cleanName && cleanName !== nom) {
                console.log(`[clients] ${c.email} : "${nom}" → "${cleanName}"`);
                await db.collection('clients').updateOne({ _id: c._id }, { $set: { nom: cleanName } });
                fixed++;
            }
        }
    }

    for (const a of badAnalyses) {
        const nom = a.nom || '';
        if (nom.includes('(') || nom.includes('...') || nom === 'jaja') {
            const cleanName = nom.replace(/\s*\(.*?\)/g, '').trim();
            if (cleanName && cleanName !== nom) {
                console.log(`[analyses_ia] ${a.email} : "${nom}" → "${cleanName}"`);
                await db.collection('analyses_ia').updateOne({ _id: a._id }, { $set: { nom: cleanName } });
                fixed++;
            }
        }
    }

    console.log(`\n✅ ${fixed} noms nettoyés des parenthèses et descriptions.`);
    process.exit(0);
})();
