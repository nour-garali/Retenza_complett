// ============================================================
// 🔍 DISCOVER GOOGLE BUSINESS PROFILE ACCOUNT & LOCATION IDs
// ============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('❌ ERREUR: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN manquant dans .env');
    process.exit(1);
}

async function runDiscovery() {
    console.log('🔄 1. Rafraîchissement de l\'Access Token Google...');
    
    let accessToken = null;
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: REFRESH_TOKEN,
                grant_type: 'refresh_token'
            }).toString()
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('❌ Échec rafraîchissement token :', tokenData);
            process.exit(1);
        }

        accessToken = tokenData.access_token;
        console.log('✅ Access Token obtenu avec succès !');
    } catch (err) {
        console.error('❌ Erreur réseau lors du refresh token :', err.message);
        process.exit(1);
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // ── STEP 1 : Accounts ──────────────────────────────────────────────────
    console.log('\n🔍 2. Recherche des Comptes Google Business (mybusinessaccountmanagement.googleapis.com)...');
    let accounts = [];
    try {
        const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', { headers });
        const accData = await accRes.json();

        if (!accRes.ok) {
            console.error('❌ ERREUR HTTP API Accounts (Step 1) :', accRes.status);
            console.error(JSON.stringify(accData, null, 2));
            return;
        }

        accounts = accData.accounts || [];
        console.log(`✅ ${accounts.length} compte(s) Google Business trouvé(s) :`);
        accounts.forEach((acc, idx) => {
            console.log(`   [${idx + 1}] Nom : ${acc.accountName || acc.name} | ID : ${acc.name}`);
        });
    } catch (err) {
        console.error('❌ Erreur lors de l\'appel API Accounts :', err.message);
        return;
    }

    if (accounts.length === 0) {
        console.warn('⚠️ Aucun compte Google Business n\'est associé à cet utilisateur Google.');
        return;
    }

    // ── STEP 2 : Locations ─────────────────────────────────────────────────
    let foundAccountId = null;
    let foundLocationId = null;
    let foundLocationTitle = null;

    for (const acc of accounts) {
        const accountName = acc.name; // format: "accounts/123456789"
        console.log(`\n🔍 3. Recherche des Établissements pour le compte ${accountName}...`);

        try {
            // endpoint : https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{account_id}/locations
            const locUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`;
            const locRes = await fetch(locUrl, { headers });
            const locData = await locRes.json();

            if (!locRes.ok) {
                console.error(`❌ ERREUR HTTP API Locations pour ${accountName} (Step 2) :`, locRes.status);
                console.error(JSON.stringify(locData, null, 2));
                continue;
            }

            const locations = locData.locations || [];
            console.log(`✅ ${locations.length} établissement(s) trouvé(s) pour ${accountName} :`);
            locations.forEach((loc, idx) => {
                console.log(`   [${idx + 1}] Établissement : "${loc.title}" | Location ID : ${loc.name}`);
            });

            if (locations.length > 0 && !foundLocationId) {
                foundAccountId     = accountName;
                foundLocationId    = locations[0].name;
                foundLocationTitle = locations[0].title;
            }
        } catch (err) {
            console.error(`❌ Erreur lors de l'appel API Locations pour ${accountName} :`, err.message);
        }
    }

    // ── STEP 3 : Mise à jour automatique de .env si trouvés ────────────────
    if (foundAccountId && foundLocationId) {
        console.log('\n====================================================');
        console.log('🎉 MATCH TROUVÉ !');
        console.log(`   GOOGLE_REVIEWS_ACCOUNT_ID  = ${foundAccountId}`);
        console.log(`   GOOGLE_REVIEWS_LOCATION_ID = ${foundLocationId}`);
        console.log(`   Établissement             = "${foundLocationTitle}"`);
        console.log('====================================================\n');

        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        envContent = envContent.replace(/^GOOGLE_REVIEWS_ACCOUNT_ID=.*$/m, `GOOGLE_REVIEWS_ACCOUNT_ID=${foundAccountId}`);
        envContent = envContent.replace(/^GOOGLE_REVIEWS_LOCATION_ID=.*$/m, `GOOGLE_REVIEWS_LOCATION_ID=${foundLocationId}`);

        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Fichier .env mis à jour automatiquement !');
    }
}

runDiscovery();
