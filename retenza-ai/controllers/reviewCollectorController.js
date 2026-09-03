// ============================================================
// 🌐 REVIEW COLLECTOR CONTROLLER — Retenza AI
// Collecte automatique des avis Google Business + Facebook Page
// File d'attente de validation manuelle (collection avis_en_attente)
// ============================================================
//
// FLUX COMPLET :
//  [Scheduler 6h] → runReviewCollection()
//    → callGoogleReviews() + callFacebookRatings()
//    → matchClientByName()   (Jaro-Winkler natif, 0 dep. externe)
//    → INSERT avis_en_attente (idempotence par external_id)
//
//  [Humain] → GET  /api/sentiment/queue
//           → POST /api/sentiment/queue/:id/valider  (Groq + alerte)
//           → POST /api/sentiment/queue/:id/rejeter  (Groq sans VIP)
//
// ============================================================
'use strict';

const { ObjectId }   = require('mongodb');
const connectDB      = require('../config/db');
const { sendEmail }  = require('../utils/emailService');

const COMMERCE_ID = process.env.COMMERCE_ID || 'commerce_local_1';

// ─── Importation dynamique du sentimentController (réutilisation sans duplication) ──
// On importe callGroq + validateSentimentResult via les fonctions internes exposées
// ci-dessous, en réimportant le module une fois chargé.
const sentimentCtrl = require('./sentimentController');

// ============================================================
// ALGORITHME JARO-WINKLER  (natif — zéro dépendance npm)
// Retourne un score de similarité 0.0 → 1.0
// ============================================================
function jaroSimilarity(s1, s2) {
    if (s1 === s2) return 1.0;
    const len1 = s1.length, len2 = s2.length;
    if (len1 === 0 || len2 === 0) return 0.0;
    const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    let matches = 0, transpositions = 0;
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDist);
        const end   = Math.min(i + matchDist + 1, len2);
        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = s2Matches[j] = true;
            matches++;
            break;
        }
    }
    if (matches === 0) return 0.0;
    const s1m = [...s1].filter((_, i) => s1Matches[i]);
    const s2m = [...s2].filter((_, j) => s2Matches[j]);
    for (let i = 0; i < s1m.length; i++) if (s1m[i] !== s2m[i]) transpositions++;
    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinkler(s1, s2, p = 0.1) {
    const jaro = jaroSimilarity(s1, s2);
    let prefix = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
        if (s1[i] === s2[i]) prefix++; else break;
    }
    return jaro + prefix * p * (1 - jaro);
}

function normalizeForMatch(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // supprimer accents
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

// ============================================================
// MATCHING CLIENT PAR NOM (suggéré seulement, jamais auto-appliqué)
// ============================================================
async function matchClientByName(db, commerceId, authorName) {
    if (!authorName || authorName.trim().length < 2) {
        return null;
    }

    const normalized = normalizeForMatch(authorName);

    // Récupérer tous les clients du commerce avec leur nom
    const clients = await db.collection('clients')
        .find(
            { commerce_id: commerceId },
            { projection: { email: 1, nom: 1, client_db_id: 1, segment_gmm: 1, archetype_real: 1 } }
        )
        .limit(2000)
        .toArray();

    if (!clients.length) return null;

    let bestScore  = 0;
    let bestClient = null;

    for (const client of clients) {
        const clientName = normalizeForMatch(client.nom || client.client_db_id || client.email);
        if (!clientName) continue;
        const score = jaroWinkler(normalized, clientName);
        if (score > bestScore) {
            bestScore  = score;
            bestClient = client;
        }
    }

    // Seuil minimum de confiance : 0.80 (en dessous, pas de suggestion)
    if (bestScore < 0.80) return null;

    return {
        email          : bestClient.email || bestClient.client_db_id || null,
        nom            : bestClient.nom   || bestClient.client_db_id || null,
        segment        : bestClient.segment_gmm || bestClient.archetype_real || 'unknown',
        score_confiance: parseFloat(bestScore.toFixed(3)),
    };
}

// ============================================================
// APPEL GOOGLE BUSINESS PROFILE API
// Doc : https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
// ============================================================
async function callGoogleReviews(db, commerceId, settings) {
    const accountId    = process.env.GOOGLE_REVIEWS_ACCOUNT_ID  || settings?.google_account_id;
    const locationId   = process.env.GOOGLE_REVIEWS_LOCATION_ID || settings?.google_location_id;
    const apiKey       = process.env.GOOGLE_API_KEY             || settings?.google_api_key;
    const clientId     = process.env.GOOGLE_CLIENT_ID           || settings?.google_client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET       || settings?.google_client_secret;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN       || settings?.google_refresh_token;

    if (!accountId || !locationId || (!apiKey && !refreshToken)) {
        console.log('[ReviewCollector] Google API non configurée (Account/Location ID ou API Key / Refresh Token manquant) — collecte ignorée.');
        return 0;
    }

    const _fetch = typeof fetch !== 'undefined' ? fetch : (...args) => import('node-fetch').then(m => m.default(...args));

    let accessToken = null;
    if (refreshToken && clientId && clientSecret) {
        try {
            const tokenRes = await _fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }).toString()
            });

            if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                accessToken = tokenData.access_token;
            } else {
                console.error('[ReviewCollector] Échec rafraîchissement token Google:', await tokenRes.text());
            }
        } catch (tErr) {
            console.error('[ReviewCollector] Erreur réseau refresh token:', tErr.message);
        }
    }

    let apiUrl = `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews?pageSize=50`;
    const fetchOptions = { headers: {} };

    if (accessToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (apiKey) {
        apiUrl += `&key=${apiKey}`;
    }

    let newCount = 0;
    try {
        const res = await _fetch(apiUrl, fetchOptions);
        if (!res.ok) {
            const body = await res.text();
            console.error(`[ReviewCollector] Google API HTTP ${res.status}:`, body.substring(0, 200));
            return 0;
        }
        const data = await res.json();
        const reviews = data.reviews || [];

        for (const review of reviews) {
            const externalId = review.reviewId;
            if (!externalId) continue;

            // Idempotence : ne pas re-insérer un avis déjà collecté
            const exists = await db.collection('avis_clients').findOne({ external_id: externalId });
            if (exists) continue;

            const authorName  = review.reviewer?.displayName || 'Anonyme';
            const reviewText  = review.comment || '';
            const rating      = review.starRating
                ? { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[review.starRating] || null
                : null;
            const reviewDate  = review.createTime ? new Date(review.createTime) : new Date();

            const clientSuggere = await matchClientByName(db, commerceId, authorName);

            await db.collection('avis_clients').insertOne({
                commerce_id      : commerceId,
                source           : 'google',
                external_id      : externalId,
                review_text      : reviewText,
                author_name      : authorName,
                rating           : rating,
                review_date      : reviewDate,
                client_suggere   : clientSuggere,
                statut           : 'en_attente',
                client_email     : null,
                client_status    : null,
                result           : null,
                created_at       : new Date(),
                validated_at     : null,
            });
            newCount++;
        }

        console.log(`[ReviewCollector] 🔍 Google: ${newCount} nouvel(aux) avis collecté(s) pour ${commerceId}`);
    } catch (err) {
        console.error('[ReviewCollector] Erreur collecte Google:', err.message);
    }
    return newCount;
}

// ============================================================
// APPEL FACEBOOK GRAPH API
// Doc : https://developers.facebook.com/docs/graph-api/reference/page/ratings/
// ============================================================
async function callFacebookRatings(db, commerceId, settings) {
    const pageId      = process.env.FACEBOOK_PAGE_ID      || settings?.facebook_page_id;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || settings?.facebook_access_token;

    if (!pageId || !accessToken) {
        console.log('[ReviewCollector] Facebook API non configurée — collecte ignorée.');
        return 0;
    }

    const _fetch = typeof fetch !== 'undefined' ? fetch : (...args) => import('node-fetch').then(m => m.default(...args));
    const url = `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=reviewer,review_text,rating,created_time&access_token=${accessToken}&limit=50`;

    let newCount = 0;
    try {
        const res  = await _fetch(url);
        if (!res.ok) {
            const body = await res.text();
            console.error(`[ReviewCollector] Facebook API HTTP ${res.status}:`, body.substring(0, 200));
            return 0;
        }
        const data = await res.json();
        const ratings = data.data || [];

        for (const rating of ratings) {
            const externalId = rating.reviewer?.id
                ? `fb_${rating.reviewer.id}_${rating.created_time}`
                : null;
            if (!externalId) continue;

            const exists = await db.collection('avis_clients').findOne({ external_id: externalId });
            if (exists) continue;

            const authorName = rating.reviewer?.name || 'Anonyme';
            const reviewText = rating.review_text || '';
            const note       = typeof rating.rating === 'number' ? rating.rating : null;
            const reviewDate = rating.created_time ? new Date(rating.created_time) : new Date();

            const clientSuggere = await matchClientByName(db, commerceId, authorName);

            await db.collection('avis_clients').insertOne({
                commerce_id      : commerceId,
                source           : 'facebook',
                external_id      : externalId,
                review_text      : reviewText,
                author_name      : authorName,
                rating           : note,
                review_date      : reviewDate,
                client_suggere   : clientSuggere,
                statut           : 'en_attente',
                client_email     : null,
                client_status    : null,
                result           : null,
                created_at       : new Date(),
                validated_at     : null,
            });
            newCount++;
        }

        console.log(`[ReviewCollector] 📘 Facebook: ${newCount} nouvel(aux) avis collecté(s) pour ${commerceId}`);
    } catch (err) {
        console.error('[ReviewCollector] Erreur collecte Facebook:', err.message);
    }
    return newCount;
}

// ============================================================
// JOB PRINCIPAL — appelé par le scheduler toutes les 6h
// ============================================================
const runReviewCollection = async (commerceId) => {
    try {
        const db       = await connectDB();
        const settings = await db.collection('commerces_settings').findOne({
            brand_id: (commerceId || COMMERCE_ID).replace(/_\d+$/, '')
        });

        const [gCount, fbCount] = await Promise.all([
            callGoogleReviews(db, commerceId || COMMERCE_ID, settings),
            callFacebookRatings(db, commerceId || COMMERCE_ID, settings),
        ]);

        return {
            status : 'success',
            message: `Collecte terminée : ${gCount} Google + ${fbCount} Facebook = ${gCount + fbCount} avis`,
            google : gCount,
            facebook: fbCount,
        };
    } catch (err) {
        console.error('[ReviewCollector] runReviewCollection error:', err.message);
        return { status: 'failed', message: err.message };
    }
};

// ============================================================
// GET /api/sentiment/queue
// Liste des avis en attente de validation (ou historique filtré par statut)
// ============================================================
const getQueue = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const statut     = req.query.statut || 'en_attente';
        const limit      = Math.min(100, parseInt(req.query.limit) || 50);
        const page       = Math.max(1,   parseInt(req.query.page)  || 1);
        const skip       = (page - 1) * limit;

        const filter = { commerce_id: commerceId, statut };

        const [docs, total] = await Promise.all([
            db.collection('avis_clients')
                .find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('avis_clients').countDocuments(filter),
        ]);

        // Compteur rapide de tous les statuts
        const counts = await db.collection('avis_clients').aggregate([
            { $match: { commerce_id: commerceId } },
            { $group: { _id: '$statut', count: { $sum: 1 } } },
        ]).toArray();

        const statusCounts = { en_attente: 0, valide: 0, rejete: 0 };
        for (const c of counts) if (c._id in statusCounts) statusCounts[c._id] = c.count;

        return res.json({
            success   : true,
            data      : docs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            counts    : statusCounts,
        });
    } catch (err) {
        console.error('❌ getQueue error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/sentiment/queue/:id/valider
// Confirme le client, lance l'analyse Groq, met à jour le statut en 'valide'
// Body: { client_email, client_status }   (email confirmé par l'humain)
// ============================================================
const validateQueueItem = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const { id }     = req.params;
        const { client_email, client_status } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const queueItem = await db.collection('avis_clients').findOne({
            _id: new ObjectId(id),
            commerce_id: commerceId,
        });

        if (!queueItem) {
            return res.status(404).json({ error: 'Avis introuvable dans la liste' });
        }
        if (queueItem.statut !== 'en_attente') {
            return res.status(409).json({ error: `Cet avis est déjà "${queueItem.statut}"` });
        }

        // ── Déterminer le statut VIP depuis la base si non fourni ──────────────
        let finalEmail  = client_email  ? client_email.toLowerCase().trim() : null;
        let finalStatus = client_status ? (client_status.toLowerCase() === 'vip' ? 'VIP' : 'Standard') : 'Standard';

        if (finalEmail && !client_status) {
            const clientDoc = await db.collection('clients').findOne({
                commerce_id: commerceId,
                $or: [{ email: finalEmail }, { client_db_id: finalEmail }],
            });
            const seg = (clientDoc?.segment_gmm || clientDoc?.archetype_real || '').toLowerCase();
            if (seg === 'vip') finalStatus = 'VIP';
        }

        // ── Appel Groq via le sentimentController (réutilisation directe) ──────
        let analysisResult = null;
        let analysisId     = null;

        try {
            await new Promise((resolve, reject) => {
                const fakeReq = {
                    query: { commerce_id: commerceId },
                    body : {
                        review_text   : queueItem.review_text,
                        client_status : finalStatus,
                        client_email  : finalEmail,
                        source        : queueItem.source,
                    },
                };
                const fakeRes = {
                    json   : (data) => { analysisResult = data; resolve(); },
                    status : (code) => ({ json: (data) => { reject(new Error(data.error || `HTTP ${code}`)); } }),
                };
                sentimentCtrl.analyzeSentiment(fakeReq, fakeRes);
            });
            analysisId = analysisResult?.analysis_id || null;
        } catch (groqErr) {
            console.error('[ReviewCollector] Groq error lors de la validation:', groqErr.message);
        }

        const sentResult = analysisResult?.result || null;

        // ── Mise à jour directe du document unique dans avis_clients ───────────
        await db.collection('avis_clients').updateOne(
            { _id: new ObjectId(id) },
            { $set: {
                statut       : 'valide',
                client_email : finalEmail,
                client_status: finalStatus,
                result       : sentResult,
                validated_at : new Date(),
                analysis_id  : analysisId,
            }}
        );

        // ── Alerte prioritaire VIP ─────────────────────────────────────────────
        if (
            sentResult?.niveau_alerte === 'prioritaire' &&
            finalStatus === 'VIP' &&
            process.env.ALERT_EMAIL_VIP
        ) {
            const alertSubject = `🚨 Alerte VIP — Avis négatif critique : ${finalEmail || queueItem.author_name}`;
            const alertBody    = [
                `⚠️ ALERTE PRIORITAIRE VIP — Retenza AI`,
                ``,
                `Client       : ${finalEmail || queueItem.author_name}`,
                `Source       : ${queueItem.source === 'google' ? 'Google' : 'Facebook'}`,
                `Note         : ${queueItem.rating ? `${queueItem.rating}/5 ⭐` : 'Non notée'}`,
                `Sentiment    : ${sentResult.sentiment} (churn ${sentResult.risque_churn}/100)`,
                ``,
                `Avis : "${queueItem.review_text}"`,
                ``,
                `Motifs identifiés : ${(sentResult.motifs || []).join(', ') || 'Aucun'}`,
                ``,
                `Suggestion : ${sentResult.suggestion_action || 'Contacter le client personnellement'}`,
            ].join('\n');

            try {
                await sendEmail({
                    to     : process.env.ALERT_EMAIL_VIP,
                    subject: alertSubject,
                    text   : alertBody,
                });
                console.log(`🚨 [ReviewCollector] Alerte prioritaire VIP envoyée → ${process.env.ALERT_EMAIL_VIP}`);
            } catch (emailErr) {
                console.error('[ReviewCollector] Échec envoi alerte VIP:', emailErr.message);
            }
        }

        return res.json({
            success      : true,
            message      : 'Avis validé, analysé et mis à jour.',
            analysis_id  : analysisId,
            alerte_envoyee: sentResult?.niveau_alerte === 'prioritaire' && finalStatus === 'VIP',
            result       : sentResult,
        });

    } catch (err) {
        console.error('❌ validateQueueItem error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/sentiment/queue/:id/rejeter
// Client inconnu → analyse Groq en mode "Standard" (pas de VIP)
// ============================================================
const rejectQueueItem = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const { id }     = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const queueItem = await db.collection('avis_clients').findOne({
            _id: new ObjectId(id),
            commerce_id: commerceId,
        });

        if (!queueItem) {
            return res.status(404).json({ error: 'Avis introuvable' });
        }
        if (queueItem.statut !== 'en_attente') {
            return res.status(409).json({ error: `Cet avis est déjà "${queueItem.statut}"` });
        }

        // ── Analyse Groq en mode Standard (client inconnu) ────────────────────
        let analysisResult = null;
        let analysisId     = null;

        try {
            await new Promise((resolve, reject) => {
                const fakeReq = {
                    query: { commerce_id: commerceId },
                    body : {
                        review_text  : queueItem.review_text,
                        client_status: 'Standard',
                        client_email : null,
                        source       : queueItem.source,
                    },
                };
                const fakeRes = {
                    json  : (data) => { analysisResult = data; resolve(); },
                    status: (code) => ({ json: (data) => { reject(new Error(data.error || `HTTP ${code}`)); } }),
                };
                sentimentCtrl.analyzeSentiment(fakeReq, fakeRes);
            });
            analysisId = analysisResult?.analysis_id || null;
        } catch (groqErr) {
            console.error('[ReviewCollector] Groq error lors du rejet:', groqErr.message);
        }

        const sentResult = analysisResult?.result || null;

        await db.collection('avis_clients').updateOne(
            { _id: new ObjectId(id) },
            { $set: {
                statut       : 'rejete',
                client_email : null,
                client_status: 'Standard',
                result       : sentResult,
                validated_at : new Date(),
                analysis_id  : analysisId,
            }}
        );

        return res.json({
            success    : true,
            message    : 'Avis marqué "client inconnu", analysé en mode Standard.',
            analysis_id: analysisId,
            result     : sentResult,
        });

    } catch (err) {
        console.error('❌ rejectQueueItem error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/sentiment/clients-search
// Recherche de clients pour la correction manuelle et l'autocomplete
// Query: q (nom ou email), commerce_id?, limit?
// ============================================================
const searchClients = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const q          = (req.query.q || '').trim();
        const limit      = Math.min(20, parseInt(req.query.limit) || 10);

        if (q.length < 2) {
            return res.json({ success: true, clients: [] });
        }

        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const clients = await db.collection('clients')
            .find({
                commerce_id: commerceId,
                $or: [
                    { nom          : regex },
                    { email        : regex },
                    { client_db_id : regex },
                ],
            }, {
                projection: { email: 1, nom: 1, client_db_id: 1, segment_gmm: 1, archetype_real: 1 },
            })
            .limit(limit)
            .toArray();

        // Normaliser segment_gmm: si archetype_real === 'VIP', on force segment à 'vip'
        const normalized = clients.map(c => ({
            ...c,
            segment_gmm: (c.archetype_real === 'VIP' || (c.segment_gmm || '').toLowerCase() === 'vip') ? 'vip' : 'standard',
        }));

        return res.json({ success: true, clients: normalized });

    } catch (err) {
        console.error('❌ searchClients error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/sentiment/queue/collect-now
// Déclenche manuellement une collecte immédiate (debug/test)
// ============================================================
const triggerCollectNow = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;
    try {
        const result = await runReviewCollection(commerceId);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/sentiment/queue/:id/corriger
// Met à jour la suggestion client sans valider l'avis
// ============================================================
const updateSuggestion = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const { id }     = req.params;
        const { email, nom, segment } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const clientSuggere = {
            email          : email || null,
            nom            : nom || null,
            segment        : (segment || 'standard').toLowerCase(),
            score_confiance: 1.0, // 100% (correction manuelle)
        };

        const result = await db.collection('avis_clients').updateOne(
            { _id: new ObjectId(id), commerce_id: commerceId, statut: 'en_attente' },
            { $set: { client_suggere: clientSuggere } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Avis introuvable ou déjà validé' });
        }

        return res.json({
            success: true,
            client_suggere: clientSuggere,
            message: 'Suggestion client mise à jour avec succès.',
        });

    } catch (err) {
        console.error('❌ updateSuggestion error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    runReviewCollection,
    getQueue,
    validateQueueItem,
    rejectQueueItem,
    searchClients,
    triggerCollectNow,
    updateSuggestion,
};
