'use strict';

// Usage: node scripts/create-user.js merchant@example.com "mot-de-passe" merchant_admin commerce_local_1
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');

async function main() {
    const [emailRaw, password, role, ...commerceIds] = process.argv.slice(2);
    const email = String(emailRaw || '').trim().toLowerCase();
    if (!email || !password || !['merchant_admin', 'super_admin'].includes(role)) {
        throw new Error('Usage: node scripts/create-user.js <email> <mot-de-passe> <merchant_admin|super_admin> [commerce_id ...]');
    }
    if (role === 'merchant_admin' && commerceIds.length === 0) throw new Error('Un merchant_admin doit avoir au moins un commerce_id.');
    const db = await connectDB();
    await db.collection('users').updateOne({ email }, { $set: { email, password_hash: await bcrypt.hash(password, 12), role, commerce_ids: commerceIds, is_active: true, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } }, { upsert: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
    await db.collection('login_attempts').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
    console.log(`Compte ${role} créé ou mis à jour pour ${email}.`);
}
main().catch(error => { console.error(error.message); process.exit(1); });
