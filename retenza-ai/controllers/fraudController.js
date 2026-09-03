'use strict';

const connectDB = require('../config/db');

const COMMERCE_ID = process.env.COMMERCE_ID || 'commerce_local_1';

// Seuil sous lequel un client est automatiquement bloqué pour motif anti-fraude
const FRAUD_BLOCK_THRESHOLD = 0.3;

// Liste statique de domaines d'emails jetables / temporaires connus
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    '10minutemail.com',
    'guerrillamail.com',
    'tempmail.com',
    'yopmail.com',
    'throwawaymail.com',
    'trashmail.com',
    'dispostable.com',
    'getnada.com',
    'sharklasers.com',
    'maildrop.cc',
    'fakeinbox.com',
    'temp-mail.org',
    'mytemp.email',
    'disposablemail.com'
]);

// ============================================================
// ⚖️ PONDÉRATION DE CALCUL DU SCORE DE CONFIANCE (TRUST SCORE)
// ============================================================
// Le score de confiance part de 1.0 (confiance maximale / réputation intacte)
// et subit des déductions cumulatives selon les signaux de risque détectés :
//
// 1. Alerte 'device_partage' (appareil partagé avec d'autres comptes) : -0.30
// 2. Alerte 'ip_partagee'    (adresse IP partagée avec d'autres comptes) : -0.30
// 3. Alerte 'email_suspect'  (alias + ou domaine jetable/temporaire)     : -0.20
// 4. Achats suspects / jour  (frequence > max/jour configuré)            : -0.20
// 5. Panier hors-normes      (montant commande > multiplicateur moyen)   : -0.20
// 6. Compte Chatbot Bloqué   (is_blocked: true dans chatbot_status)       : -0.30
//
// Formule :
//   trust_score = Math.max(0.0, Math.min(1.0, 1.0 - Sum(Pénalités)))
//
// 📌 REMARQUE DE SÉCURITÉ :
// Ce mécanisme de blocage anti-fraude (is_fraud_blocked) basé sur le trust_score (< 0.3)
// est entièrement INDÉPENDANT du blocage chatbot (chatbot_status.is_blocked).
// Ce sont deux mécanismes de modération distincts avec leurs propres règles, motifs
// et périmètres d'action.
// ============================================================
const PENALTY_WEIGHTS = {
    DEVICE_PARTAGE: 0.40,
    IP_PARTAGEE: 0.30,
    EMAIL_SUSPECT: 0.20,
    SUSPICIOUS_FREQUENCY: 0.20,
    SUSPICIOUS_BASKETS: 0.20,
    CHATBOT_BLOCKED: 0.30
};

/**
 * Extrait l'email de base en supprimant les alias de type "+" (ex: user+1@gmail.com -> user@gmail.com).
 * @param {string} email
 * @returns {string|null}
 */
function getBaseEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const clean = email.toLowerCase().trim();
    const parts = clean.split('@');
    if (parts.length !== 2) return clean;
    const username = parts[0].split('+')[0];
    const domain = parts[1];
    return `${username}@${domain}`;
}

/**
 * Extraction de brand_id depuis commerce_id (ex: "commerce_local_1" -> "commerce_local")
 */
function extractBrandId(commerceId) {
    if (!commerceId) return 'commerce_local';
    return String(commerceId).replace(/_\d+$/, '');
}

/**
 * detectMultiAccounts(commerceId, dbOverride)
 * ───────────────────────────────────────────
 * Analyse la base MongoDB pour détecter les comportements de comptes multiples suspects.
 */
const detectMultiAccounts = async (commerceId = COMMERCE_ID, dbOverride = null) => {
    const db = dbOverride || await connectDB();
    const targetCommerce = commerceId || COMMERCE_ID;
    const commerceFilter = targetCommerce === '__all__'
        ? {}
        : { commerce_id: { $regex: `^${targetCommerce}` } };

    const clients = await db.collection('clients').find(commerceFilter).toArray();
    const commandes = await db.collection('commandes').find(commerceFilter).toArray();

    const deviceToEmails = new Map();
    const ipToEmails = new Map();
    const baseEmailToOriginals = new Map();
    const allEmails = new Set();

    const trackDevice = (email, deviceId) => {
        if (!email || !deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') return;
        const em = email.toLowerCase().trim();
        const dev = deviceId.trim();
        if (!deviceToEmails.has(dev)) deviceToEmails.set(dev, new Set());
        deviceToEmails.get(dev).add(em);
    };

    const trackIp = (email, ip) => {
        if (!email || !ip || typeof ip !== 'string' || ip.trim() === '') return;
        const em = email.toLowerCase().trim();
        const cleanIp = ip.trim();
        if (!ipToEmails.has(cleanIp)) ipToEmails.set(cleanIp, new Set());
        ipToEmails.get(cleanIp).add(em);
    };

    const trackEmail = (email) => {
        if (!email || typeof email !== 'string') return;
        const em = email.toLowerCase().trim();
        allEmails.add(em);

        const base = getBaseEmail(em);
        if (base) {
            if (!baseEmailToOriginals.has(base)) baseEmailToOriginals.set(base, new Set());
            baseEmailToOriginals.get(base).add(em);
        }
    };

    clients.forEach(c => {
        const em = c.email || c.client_db_id;
        if (em) {
            trackEmail(em);
            trackDevice(em, c.device_id_creation);
            trackIp(em, c.ip_creation_compte);
        }
    });

    commandes.forEach(cmd => {
        const em = cmd.client_email || cmd.client_id;
        if (em) {
            trackEmail(em);
            trackDevice(em, cmd.device_id_commande);
            trackIp(em, cmd.ip_commande);
        }
    });

    const deviceAlerts = [];
    for (const [deviceId, emailSet] of deviceToEmails.entries()) {
        if (emailSet.size > 1) {
            const emailsArray = Array.from(emailSet);
            deviceAlerts.push({
                device_id: deviceId,
                type: 'device_partage',
                count: emailsArray.length,
                emails: emailsArray,
                reason: `${emailsArray.length} comptes clients partagent la même empreinte d'appareil (${deviceId})`
            });
        }
    }

    const ipAlerts = [];
    for (const [ipAddr, emailSet] of ipToEmails.entries()) {
        if (emailSet.size > 1) {
            const emailsArray = Array.from(emailSet);
            ipAlerts.push({
                ip: ipAddr,
                type: 'ip_partagee',
                count: emailsArray.length,
                emails: emailsArray,
                reason: `${emailsArray.length} comptes clients ont été créés/utilisés depuis la même adresse IP (${ipAddr})`
            });
        }
    }

    const emailAlerts = [];

    for (const [baseEmail, originalsSet] of baseEmailToOriginals.entries()) {
        if (originalsSet.size > 1) {
            const originals = Array.from(originalsSet);
            emailAlerts.push({
                base_email: baseEmail,
                type: 'email_suspect',
                subtype: 'plus_alias',
                count: originals.length,
                emails: originals,
                reason: `Comptes multiples détectés via alias email (+) : ${originals.join(', ')}`
            });
        }
    }

    allEmails.forEach(em => {
        const domain = em.split('@')[1];
        if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
            emailAlerts.push({
                email: em,
                type: 'email_suspect',
                subtype: 'disposable_domain',
                domain: domain,
                reason: `Utilisation d'un domaine d'email jetable/temporaire connu (${domain})`
            });
        }
    });

    const totalAlertsCount = deviceAlerts.length + ipAlerts.length + emailAlerts.length;

    return {
        status: 'success',
        commerce_id: targetCommerce,
        summary: {
            total_alerts: totalAlertsCount,
            total_device_partage: deviceAlerts.length,
            total_ip_partagee: ipAlerts.length,
            total_email_suspect: emailAlerts.length
        },
        alerts: {
            device_partage: deviceAlerts,
            ip_partagee: ipAlerts,
            email_suspect: emailAlerts
        }
    };
};

/**
 * GET /api/security/multi-accounts?commerce_id=...
 */
const getMultiAccountAlerts = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const result = await detectMultiAccounts(commerceId);
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json(result);
    } catch (err) {
        console.error('❌ getMultiAccountAlerts error:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * Helper : calcule la liste des signaux de transactions anormales
 */
async function getTransactionSignals(commerceId, db) {
    const brandId = extractBrandId(commerceId);
    const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId }) || {};

    const ENV_MAX_DAILY = parseFloat(process.env.FRAUD_MAX_DAILY_PURCHASES) || 5;
    const ENV_BASKET_MULT = parseFloat(process.env.FRAUD_MAX_BASKET_MULTIPLIER) || 3.0;
    const maxDaily = settings.fraud_max_daily_purchases || ENV_MAX_DAILY;
    const basketMultiplier = settings.fraud_max_basket_multiplier || ENV_BASKET_MULT;

    const commerceFilter = { $regex: `^${commerceId === '__all__' ? 'commerce_local' : commerceId}` };

    const txs = await db.collection('commandes').find({ commerce_id: commerceFilter }).toArray();

    let totalRevenue = 0;
    const clientDailyCounts = {};
    txs.forEach(t => {
        const amount = parseFloat(t.montant) || parseFloat(t.total) || parseFloat(t.montant_total) || 0;
        const email = (t.client_email || t.email || t.client_id || '').toLowerCase().trim();
        const rawDate = t.date_commande || t.date || t.created_at || '';
        const dateStr = (rawDate instanceof Date ? rawDate.toISOString() : String(rawDate)).substring(0, 10);
        if (!email) return;

        totalRevenue += amount;
        const key = `${email}_${dateStr}`;
        if (!clientDailyCounts[key]) {
            clientDailyCounts[key] = { email, count: 0 };
        }
        clientDailyCounts[key].count += 1;
    });

    const avgBasket = txs.length > 0 ? (totalRevenue / txs.length) : 50;
    const thresholdBasketAmount = avgBasket * basketMultiplier;

    const suspiciousFrequencyEmails = new Set();
    Object.values(clientDailyCounts).forEach(item => {
        if (item.count > maxDaily) {
            suspiciousFrequencyEmails.add(item.email);
        }
    });

    const suspiciousBasketsEmails = new Set();
    txs.forEach(t => {
        const amount = parseFloat(t.montant) || parseFloat(t.total) || parseFloat(t.montant_total) || 0;
        const email = (t.client_email || t.email || t.client_id || '').toLowerCase().trim();
        if (email && amount > thresholdBasketAmount) {
            suspiciousBasketsEmails.add(email);
        }
    });

    return { suspiciousFrequencyEmails, suspiciousBasketsEmails };
}

/**
 * calculateTrustScore(clientEmail, commerceId, dbOverride, prefetchedContext)
 * ─────────────────────────────────────────────────────────────────────────────
 * Calcule le score de confiance (trust_score) d'un client spécifique (0.0 -> 1.0)
 * et détermine le statut de blocage automatique pour motif de fraude (trust_score < 0.3).
 *
 * @param {string} clientEmail
 * @param {string} commerceId
 * @param {import('mongodb').Db} [dbOverride]
 * @param {object} [prefetchedContext]
 * @returns {Promise<{ trust_score: number, is_fraud_blocked: boolean, fraud_block_reason: string|null, details: object }>}
 */
const calculateTrustScore = async (clientEmail, commerceId = COMMERCE_ID, dbOverride = null, prefetchedContext = null) => {
    if (!clientEmail) {
        return {
            trust_score: 1.0,
            is_fraud_blocked: false,
            fraud_block_reason: null,
            details: { penalties: [], note: 'Aucun email fourni' }
        };
    }

    const db = dbOverride || await connectDB();
    const cleanEmail = clientEmail.toLowerCase().trim();

    let context = prefetchedContext;

    if (!context) {
        const multiAlerts = await detectMultiAccounts(commerceId, db);
        const { suspiciousFrequencyEmails, suspiciousBasketsEmails } = await getTransactionSignals(commerceId, db);
        const blockedDocs = await db.collection('chatbot_status').find({ is_blocked: true }).toArray();
        const chatbotBlockedEmails = new Set(blockedDocs.map(b => (b.email || '').toLowerCase().trim()));

        const devicePartageEmails = new Set();
        (multiAlerts.alerts?.device_partage || []).forEach(a => (a.emails || []).forEach(e => devicePartageEmails.add(e.toLowerCase())));

        const ipPartageeEmails = new Set();
        (multiAlerts.alerts?.ip_partagee || []).forEach(a => (a.emails || []).forEach(e => ipPartageeEmails.add(e.toLowerCase())));

        const emailSuspectEmails = new Set();
        (multiAlerts.alerts?.email_suspect || []).forEach(a => {
            if (a.emails) a.emails.forEach(e => emailSuspectEmails.add(e.toLowerCase()));
            if (a.email) emailSuspectEmails.add(a.email.toLowerCase());
        });

        context = {
            devicePartageEmails,
            ipPartageeEmails,
            emailSuspectEmails,
            suspiciousFrequencyEmails,
            suspiciousBasketsEmails,
            chatbotBlockedEmails
        };
    }

    let currentScore = 1.0;
    const penalties = [];

    if (context.devicePartageEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'device_partage',
            weight: PENALTY_WEIGHTS.DEVICE_PARTAGE,
            reason: "Empreinte d'appareil partagée avec d'autres comptes clients"
        });
        currentScore -= PENALTY_WEIGHTS.DEVICE_PARTAGE;
    }

    if (context.ipPartageeEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'ip_partagee',
            weight: PENALTY_WEIGHTS.IP_PARTAGEE,
            reason: "Adresse IP de création/commande partagée avec d'autres comptes clients"
        });
        currentScore -= PENALTY_WEIGHTS.IP_PARTAGEE;
    }

    if (context.emailSuspectEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'email_suspect',
            weight: PENALTY_WEIGHTS.EMAIL_SUSPECT,
            reason: "Alias d'email (+) ou domaine d'email jetable/temporaire détecté"
        });
        currentScore -= PENALTY_WEIGHTS.EMAIL_SUSPECT;
    }

    if (context.suspiciousFrequencyEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'suspicious_frequency',
            weight: PENALTY_WEIGHTS.SUSPICIOUS_FREQUENCY,
            reason: "Nombre d'achats journalier supérieur au seuil maximum toléré"
        });
        currentScore -= PENALTY_WEIGHTS.SUSPICIOUS_FREQUENCY;
    }

    if (context.suspiciousBasketsEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'suspicious_baskets',
            weight: PENALTY_WEIGHTS.SUSPICIOUS_BASKETS,
            reason: "Montant de commande hors-normes par rapport au panier moyen"
        });
        currentScore -= PENALTY_WEIGHTS.SUSPICIOUS_BASKETS;
    }

    if (context.chatbotBlockedEmails.has(cleanEmail)) {
        penalties.push({
            signal: 'chatbot_blocked',
            weight: PENALTY_WEIGHTS.CHATBOT_BLOCKED,
            reason: "Compte chatbot SAV bloqué pour comportements/insultes répétées"
        });
        currentScore -= PENALTY_WEIGHTS.CHATBOT_BLOCKED;
    }

    const finalScore = Math.max(0.0, Math.min(1.0, parseFloat(currentScore.toFixed(2))));

    // ── RÈGLE DE BLOCAGE AUTOMATIQUE ANTI-FRAUDE (trust_score < 0.3) ─────────────
    // Si le score tombe sous 0.3, le client est automatiquement bloqué pour motif de fraude.
    // Si le score remonte à >= 0.3 lors d'un recalcul ultérieur, is_fraud_blocked repasse à false.
    let isFraudBlocked = false;
    let fraudBlockReason = null;

    if (finalScore < FRAUD_BLOCK_THRESHOLD) {
        isFraudBlocked = true;
        const reasonsList = penalties.map(p => p.reason).join(' ; ');
        fraudBlockReason = `Score de confiance critique (${finalScore.toFixed(2)} < ${FRAUD_BLOCK_THRESHOLD}) - Signaux : ${reasonsList || 'Risque élevé cumulé'}`;
    }

    return {
        email: cleanEmail,
        trust_score: finalScore,
        is_fraud_blocked: isFraudBlocked,
        fraud_block_reason: fraudBlockReason,
        details: {
            initial_score: 1.0,
            final_score: finalScore,
            total_penalties_count: penalties.length,
            total_deduction: parseFloat((1.0 - currentScore).toFixed(2)),
            penalties
        }
    };
};

/**
 * Recalcule et persiste le trust_score et l'état de blocage anti-fraude pour tous les clients d'un commerce.
 * Utilisé par l'endpoint POST et par le job planifié toutes les 6 heures.
 */
const recalculateAllTrustScoresForCommerce = async (commerceId = COMMERCE_ID, dbOverride = null) => {
    const db = dbOverride || await connectDB();
    const targetCommerce = commerceId || COMMERCE_ID;
    const commerceFilter = targetCommerce === '__all__' ? {} : { commerce_id: { $regex: `^${targetCommerce}` } };

    const multiAlerts = await detectMultiAccounts(targetCommerce, db);
    const { suspiciousFrequencyEmails, suspiciousBasketsEmails } = await getTransactionSignals(targetCommerce, db);
    const blockedDocs = await db.collection('chatbot_status').find({ is_blocked: true }).toArray();
    const chatbotBlockedEmails = new Set(blockedDocs.map(b => (b.email || '').toLowerCase().trim()));

    const devicePartageEmails = new Set();
    (multiAlerts.alerts?.device_partage || []).forEach(a => (a.emails || []).forEach(e => devicePartageEmails.add(e.toLowerCase())));

    const ipPartageeEmails = new Set();
    (multiAlerts.alerts?.ip_partagee || []).forEach(a => (a.emails || []).forEach(e => ipPartageeEmails.add(e.toLowerCase())));

    const emailSuspectEmails = new Set();
    (multiAlerts.alerts?.email_suspect || []).forEach(a => {
        if (a.emails) a.emails.forEach(e => emailSuspectEmails.add(e.toLowerCase()));
        if (a.email) emailSuspectEmails.add(a.email.toLowerCase());
    });

    const sharedContext = {
        devicePartageEmails,
        ipPartageeEmails,
        emailSuspectEmails,
        suspiciousFrequencyEmails,
        suspiciousBasketsEmails,
        chatbotBlockedEmails
    };

    const clientsToProcess = await db.collection('clients').find(commerceFilter).toArray();
    const results = [];
    const nowIso = new Date().toISOString();

    for (const c of clientsToProcess) {
        const email = c.email || c.client_db_id;
        if (!email) continue;

        const calculation = await calculateTrustScore(email, targetCommerce, db, sharedContext);

        // Déterminer l'état final de blocage en tenant compte d'un éventuel déblocage manuel par l'admin
        let finalBlocked = calculation.is_fraud_blocked;
        let finalReason = calculation.fraud_block_reason;

        // Si l'administrateur a débloqué manuellement le client ET que le score est resté bas, on préserve le déblocage manuel
        if (c.manual_unblock === true && calculation.trust_score < FRAUD_BLOCK_THRESHOLD) {
            finalBlocked = false;
            finalReason = c.fraud_block_reason || 'Débloqué manuellement par un administrateur';
        }

        const updatePayload = {
            trust_score: calculation.trust_score,
            is_fraud_blocked: finalBlocked,
            fraud_block_reason: finalReason,
            trust_score_updated_at: nowIso
        };

        const emailRegex = new RegExp(`^${email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

        await db.collection('clients').updateOne(
            { email: emailRegex },
            { $set: updatePayload }
        );

        await db.collection('analyses_ia').updateMany(
            { email: emailRegex },
            { $set: updatePayload }
        );

        results.push({
            email,
            nom: c.nom || email,
            trust_score: calculation.trust_score,
            is_fraud_blocked: finalBlocked,
            fraud_block_reason: finalReason,
            details: calculation.details
        });
    }

    return {
        status: 'success',
        commerce_id: targetCommerce,
        recalculated_count: results.length,
        updated_at: nowIso,
        results
    };
};

/**
 * POST /api/security/recalculate-trust-score
 * Recalcule et persiste le trust_score + is_fraud_blocked pour un client spécifique ou tous les clients d'un commerce.
 */
const recalculateTrustScoresHandler = async (req, res) => {
    const commerceId = req.body?.commerce_id || COMMERCE_ID;
    const targetEmail = req.body?.client_email ? String(req.body.client_email).toLowerCase().trim() : null;

    try {
        const db = await connectDB();

        if (targetEmail) {
            const calculation = await calculateTrustScore(targetEmail, commerceId, db);
            const nowIso = new Date().toISOString();

            const updatePayload = {
                trust_score: calculation.trust_score,
                is_fraud_blocked: calculation.is_fraud_blocked,
                fraud_block_reason: calculation.fraud_block_reason,
                trust_score_updated_at: nowIso
            };

            const emailRegex = new RegExp(`^${targetEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

            await db.collection('clients').updateOne(
                { email: emailRegex },
                { $set: updatePayload }
            );

            await db.collection('analyses_ia').updateMany(
                { email: emailRegex },
                { $set: updatePayload }
            );

            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            return res.json({
                status: 'success',
                commerce_id: commerceId,
                recalculated_count: 1,
                updated_at: nowIso,
                results: [{
                    email: targetEmail,
                    trust_score: calculation.trust_score,
                    is_fraud_blocked: calculation.is_fraud_blocked,
                    fraud_block_reason: calculation.fraud_block_reason,
                    details: calculation.details
                }]
            });
        } else {
            const result = await recalculateAllTrustScoresForCommerce(commerceId, db);
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            return res.json(result);
        }
    } catch (err) {
        console.error('❌ recalculateTrustScoresHandler error:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * GET /api/security/trust-scores?commerce_id=...
 * Retourne la liste des clients, leur trust_score et leur statut is_fraud_blocked,
 * triés par score croissant (clients les plus suspects en premier).
 */
const getTrustScoresHandler = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const db = await connectDB();
        const commerceFilter = commerceId === '__all__' ? {} : { commerce_id: { $regex: `^${commerceId}` } };

        const clients = await db.collection('clients')
            .find(commerceFilter)
            .project({ email: 1, nom: 1, commerce_id: 1, trust_score: 1, is_fraud_blocked: 1, fraud_block_reason: 1, trust_score_updated_at: 1, _id: 0 })
            .toArray();

        const formatted = clients.map(c => ({
            email: c.email,
            nom: c.nom || c.email,
            commerce_id: c.commerce_id,
            trust_score: c.trust_score !== undefined ? c.trust_score : 1.0,
            is_fraud_blocked: c.is_fraud_blocked === true,
            fraud_block_reason: c.fraud_block_reason || null,
            trust_score_updated_at: c.trust_score_updated_at || null
        }));

        formatted.sort((a, b) => a.trust_score - b.trust_score);

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json({
            status: 'success',
            commerce_id: commerceId,
            total_clients: formatted.length,
            scores: formatted
        });
    } catch (err) {
        console.error('❌ getTrustScoresHandler error:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * POST /api/security/unblock-client
 * Permet à un super_admin ou merchant_admin de débloquer manuellement un client.
 * Force is_fraud_blocked: false et enregistre le flag manual_unblock: true.
 */
const unblockClientFraudHandler = async (req, res) => {
    const { commerce_id, client_email } = req.body || {};

    if (!client_email) {
        return res.status(400).json({ status: 'error', error: 'client_email requis.' });
    }

    try {
        const db = await connectDB();
        const emailClean = String(client_email).toLowerCase().trim();
        const emailRegex = new RegExp(`^${emailClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

        const nowIso = new Date().toISOString();

        const updateFields = {
            is_fraud_blocked: false,
            fraud_block_reason: null,
            manual_unblock: true,
            unblocked_by_admin_at: nowIso
        };

        const resClients = await db.collection('clients').updateOne(
            { email: emailRegex },
            { $set: updateFields }
        );

        await db.collection('analyses_ia').updateMany(
            { email: emailRegex },
            { $set: updateFields }
        );

        if (resClients.matchedCount === 0) {
            return res.status(404).json({ status: 'error', error: `Client ${emailClean} introuvable.` });
        }

        return res.json({
            status: 'success',
            message: `Le client ${emailClean} a été débloqué manuellement avec succès.`,
            email: emailClean,
            is_fraud_blocked: false,
            manual_unblock: true
        });
    } catch (err) {
        console.error('❌ unblockClientFraudHandler error:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * Middleware checkFraudBlock
 * ─────────────────────────
 * Vérifie si le client qui effectue une action sensible (passage de commande, débit de fidélité, etc.)
 * est marqué avec is_fraud_blocked: true.
 * Si oui, renvoie immédiatement un HTTP 403 explicite.
 */
const checkFraudBlock = async (req, res, next) => {
    try {
        const clientEmail = (
            req.body?.client_email ||
            req.body?.email ||
            req.query?.email ||
            req.query?.client_email ||
            ''
        ).toLowerCase().trim();

        if (!clientEmail) {
            return next();
        }

        const db = await connectDB();
        const emailRegex = new RegExp(`^${clientEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
        const client = await db.collection('clients').findOne({ email: emailRegex });

        if (client && client.is_fraud_blocked === true) {
            console.warn(`⛔ [ANTI-FRAUD BLOCK] Action 403 refusée pour ${clientEmail} (is_fraud_blocked: true, trust_score: ${client.trust_score})`);
            return res.status(403).json({
                status: 'error',
                code: 'FRAUD_BLOCKED',
                error: 'Action bloquée par la politique anti-fraude. Score de confiance du client insuffisant.',
                trust_score: client.trust_score !== undefined ? client.trust_score : 0,
                reason: client.fraud_block_reason || 'Score de confiance sous le seuil critique (< 0.30)'
            });
        }

        return next();
    } catch (err) {
        console.error('❌ checkFraudBlock middleware error:', err.message);
        return next();
    }
};

module.exports = {
    PENALTY_WEIGHTS,
    FRAUD_BLOCK_THRESHOLD,
    detectMultiAccounts,
    getMultiAccountAlerts,
    calculateTrustScore,
    recalculateAllTrustScoresForCommerce,
    recalculateTrustScoresHandler,
    getTrustScoresHandler,
    unblockClientFraudHandler,
    checkFraudBlock
};
