'use strict';

// Test d'intégration réversible : crée un merchant temporaire, vérifie l'accès
// à son commerce puis l'interdiction d'accès à un autre, et nettoie ses traces.
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const attemptKey = (email) => crypto.createHash('sha256').update(`::ffff:127.0.0.1:${email}`).digest('hex');

async function main() {
    const db = await connectDB();
    const [allowed, forbidden] = await db.collection('clients').distinct('commerce_id');
    if (!allowed || !forbidden) throw new Error('Deux commerces sont requis pour le test.');
    const rgpdClient = await db.collection('clients').findOne({ commerce_id: allowed, email: { $exists: true, $ne: '' } }, { projection: { email: 1, rgpd_portal_token_hash: 1, rgpd_portal_token_expires_at: 1 } });
    if (!rgpdClient) throw new Error('Un client avec email est requis pour le test RGPD.');
    const email = `security-test-${crypto.randomUUID()}@invalid.local`;
    const password = crypto.randomBytes(24).toString('base64url');
    const invalidEmail = `rate-limit-${crypto.randomUUID()}@invalid.local`;
    const foreignEmail = `rgpd-foreign-${crypto.randomUUID()}@invalid.local`;
    let userId, foreignClientId;
    try {
        foreignClientId = (await db.collection('clients').insertOne({ commerce_id: forbidden, email: foreignEmail, nom: 'Client technique RGPD' })).insertedId;
        const inserted = await db.collection('users').insertOne({ email, password_hash: await bcrypt.hash(password, 12), role: 'merchant_admin', commerce_ids: [allowed], is_active: true, created_at: new Date() });
        userId = inserted.insertedId;
        const pixel = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/campaigns/track/open/not-a-real-tracking-id`);
        const rgpdPublic = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/rgpd/portal-data?token=invalide`);
        const protectedExport = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/export/clients?commerce_id=${encodeURIComponent(allowed)}`);
        if (pixel.status !== 200 || rgpdPublic.status !== 404 || protectedExport.status !== 401) throw new Error(`Exceptions d'accès inattendues : pixel=${pixel.status}, rgpd=${rgpdPublic.status}, export=${protectedExport.status}.`);
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        if (login.status !== 200) throw new Error(`Connexion de test refusée (${login.status}).`);
        const cookie = login.headers.get('set-cookie');
        const rgpdTokenResponse = await fetch(`${baseUrl}/api/rgpd/portal-token?email=${encodeURIComponent(rgpdClient.email)}`, { headers: { cookie } });
        const rgpdTokenJson = await rgpdTokenResponse.json();
        const rgpdValid = await fetch(`${baseUrl}/api/rgpd/portal-data?token=${encodeURIComponent(rgpdTokenJson.token || '')}`);
        const rgpdForbidden = await fetch(`${baseUrl}/api/rgpd/portal-token?email=${encodeURIComponent(foreignEmail)}`, { headers: { cookie } });
        const own = await fetch(`${baseUrl}/api/data?commerce_id=${encodeURIComponent(allowed)}`, { headers: { cookie } });
        const other = await fetch(`${baseUrl}/api/data?commerce_id=${encodeURIComponent(forbidden)}`, { headers: { cookie } });
        const ownExport = await fetch(`${baseUrl}/api/export/clients?commerce_id=${encodeURIComponent(allowed)}`, { headers: { cookie } });
        let rateStatus = 0;
        for (let i = 0; i < 5; i++) rateStatus = (await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invalidEmail, password: 'incorrect' }) })).status;
        if (own.status !== 200 || other.status !== 403 || ownExport.status !== 200 || rateStatus !== 429 || rgpdTokenResponse.status !== 200 || rgpdValid.status !== 200 || rgpdForbidden.status !== 404) throw new Error(`Résultats inattendus : propre=${own.status}, interdit=${other.status}, export=${ownExport.status}, rate-limit=${rateStatus}, rgpd=${rgpdTokenResponse.status}/${rgpdValid.status}/${rgpdForbidden.status}.`);
        console.log(`PASS: isolement ${allowed}=200/${forbidden}=403; export protégé; pixel et portail RGPD publics; rate-limit=429.`);
    } finally {
        if (userId) {
            await db.collection('sessions').deleteMany({ user_id: userId });
            await db.collection('users').deleteOne({ _id: userId });
        }
        if (foreignClientId) await db.collection('clients').deleteOne({ _id: foreignClientId });
        const rgpdRestore = {};
        const rgpdUnset = {};
        if (rgpdClient.rgpd_portal_token_hash !== undefined) rgpdRestore.rgpd_portal_token_hash = rgpdClient.rgpd_portal_token_hash; else rgpdUnset.rgpd_portal_token_hash = '';
        if (rgpdClient.rgpd_portal_token_expires_at !== undefined) rgpdRestore.rgpd_portal_token_expires_at = rgpdClient.rgpd_portal_token_expires_at; else rgpdUnset.rgpd_portal_token_expires_at = '';
        await db.collection('clients').updateOne({ _id: rgpdClient._id }, { ...(Object.keys(rgpdRestore).length ? { $set: rgpdRestore } : {}), ...(Object.keys(rgpdUnset).length ? { $unset: rgpdUnset } : {}) });
        await db.collection('login_attempts').deleteOne({ _id: attemptKey(invalidEmail) });
    }
}
main().catch(error => { console.error(`FAIL: ${error.message}`); process.exit(1); });
