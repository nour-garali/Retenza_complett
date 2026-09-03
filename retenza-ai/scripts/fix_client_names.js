'use strict';

/**
 * scripts/fix_client_names.js
 * ────────────────────────────
 * 1. Inspecte les clients actuels dans analyses_ia & clients pour commerce_local_1 et commerce_local
 * 2. Met à jour les noms pour qu'ils soient réalistes et cohérents avec les emails
 */

const path = require('path');
const rootDir = path.join(__dirname, '..');
const connectDB = require(path.join(rootDir, 'config/db'));

// Map email → vrai nom cohérent
const NAME_MAP = {
    // Clients principaux (example.com)
    'youssef.trabelsi@example.com':          'Youssef Trabelsi',
    'fatma.khlifi@example.com':              'Fatma Khlifi',
    'yassine.ayari@example.com':             'Yassine Ayari',
    'yassine.ayari+test@mailinator.com':     'Yassine Ayari',
    'salim.gharbi@example.com':              'Salim Gharbi',
    'leila.cherif@example.com':              'Leila Cherif',
    'yassine.hammami@example.com':           'Yassine Hammami',
    'mohamed.trabelsi@example.com':          'Mohamed Trabelsi',
    'ines.trabelsi@example.com':             'Inès Trabelsi',
    'ines.riahi@example.com':                'Inès Riahi',
    'sonia.chaabane@example.com':            'Sonia Chaabane',
    'nour.miled@example.com':                'Nour Miled',
    'karim.mansouri@example.com':            'Karim Mansouri',
    'amira.ben_ali@example.com':             'Amira Ben Ali',
    'rania.jebali@example.com':              'Rania Jebali',
    'hatem.sfar@example.com':                'Hatem Sfar',
    'sirine.belhaj@example.com':             'Sirine Belhaj',
    'mariem.ghanem@example.com':             'Mariem Ghanem',
    'ahmed.ferchichi@example.com':           'Ahmed Ferchichi',
    'sarra.karray@example.com':              'Sarra Karray',
    'wafa.louati@example.com':               'Wafa Louati',
    'mourad.zouari@example.com':             'Mourad Zouari',
    'asma.jendoubi@example.com':             'Asma Jendoubi',
    'rim.nasri@example.com':                 'Rim Nasri',
    'khaled.boughanmi@example.com':          'Khaled Boughanmi',
    'dorra.hammami@example.com':             'Dorra Hammami',
    'tarek.mbarek@example.com':              'Tarek Mbarek',
    'faten.abid@example.com':                'Faten Abid',
    'anis.cherni@example.com':               'Anis Cherni',
    'olfa.belhassen@example.com':            'Olfa Belhassen',
    // Vrai utilisateur
    'ghofrane.khadhar@gmail.com':            'Ghofrane Khadhar',
    'ghofrane.khadarr@gmail.com':            'Ghofrane Khadhar',
};

// Génère un nom depuis l'email si pas dans le map
function nameFromEmail(email) {
    if (!email) return 'Client';
    const local = email.split('@')[0].replace(/[+_.-]/g, ' ').replace(/\s+/g, ' ').trim();
    return local.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

(async () => {
    console.log('============================================================');
    console.log('🔧 MISE À JOUR DES NOMS CLIENTS — RATENZA');
    console.log('============================================================\n');

    try {
        const db = await connectDB();
        const COMMERCE_IDS = ['commerce_local_1', 'commerce_local'];

        for (const commerceId of COMMERCE_IDS) {
            console.log(`\n📌 Traitement du commerce : "${commerceId}"`);
            console.log('─'.repeat(50));

            // ── 1. Mettre à jour la collection "clients" ──
            const clients = await db.collection('clients').find({ commerce_id: commerceId }).toArray();
            console.log(`   Clients trouvés : ${clients.length}`);

            let updatedClients = 0;
            for (const client of clients) {
                const email = client.email;
                if (!email) continue;

                const emailLower = email.toLowerCase();
                const newName = NAME_MAP[emailLower] || nameFromEmail(email);
                const currentName = client.nom || client.name || '';

                // Mettre à jour si le nom est absent, générique (contient ...) ou manque de cohérence
                const needsUpdate =
                    !currentName ||
                    currentName.includes('...') ||
                    currentName === email ||
                    currentName === 'Client' ||
                    currentName.toLowerCase() === 'inconnu';

                console.log(`   [clients] ${email} | nom actuel: "${currentName}" → ${needsUpdate ? `"${newName}" ✏️` : 'OK ✅'}`);

                if (needsUpdate) {
                    await db.collection('clients').updateOne(
                        { _id: client._id },
                        { $set: { nom: newName } }
                    );
                    updatedClients++;
                }
            }

            // ── 2. Mettre à jour la collection "analyses_ia" ──
            const analyses = await db.collection('analyses_ia').find({ commerce_id: commerceId }).toArray();
            console.log(`\n   Analyses IA trouvées : ${analyses.length}`);

            let updatedAnalyses = 0;
            for (const a of analyses) {
                const email = a.email || a.client_db_id;
                if (!email) continue;

                const emailLower = email.toLowerCase();
                const newName = NAME_MAP[emailLower] || nameFromEmail(email);
                const currentName = a.nom || '';

                const needsUpdate =
                    !currentName ||
                    currentName.includes('...') ||
                    currentName === email ||
                    currentName === 'Client' ||
                    currentName.toLowerCase() === 'inconnu';

                console.log(`   [analyses_ia] ${email} | nom actuel: "${currentName}" → ${needsUpdate ? `"${newName}" ✏️` : 'OK ✅'}`);

                if (needsUpdate) {
                    await db.collection('analyses_ia').updateOne(
                        { _id: a._id },
                        { $set: { nom: newName } }
                    );
                    updatedAnalyses++;
                }
            }

            console.log(`\n   ✅ clients mis à jour : ${updatedClients} / ${clients.length}`);
            console.log(`   ✅ analyses_ia mis à jour : ${updatedAnalyses} / ${analyses.length}`);
        }

        console.log('\n============================================================');
        console.log('✅ NOMS CLIENTS MIS À JOUR AVEC SUCCÈS !');
        console.log('============================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    }
})();
