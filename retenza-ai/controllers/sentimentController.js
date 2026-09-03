// ============================================================
// 🧠 SENTIMENT CONTROLLER — Analyse IA des Avis Clients
// Retenza AI — Module Analyse de Sentiment Google/Facebook
// ============================================================
// Fonctionnement :
//  1. Récupère automatiquement l'historique des 3 derniers avis du client (MongoDB)
//  2. Injecte les variables dans le prompt système fourni
//  3. Appelle l'API Groq (LLM llama-3.3-70b-versatile) avec rotation des clés
//  4. Valide et parse le JSON retourné
//  5. Sauvegarde systématique en base (collection avis_clients)
// ============================================================

'use strict';

const connectDB = require('../config/db');

// ─── Clés Groq en rotation (pool identique au reste du projet) ────────────────
const GROQ_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
].filter(Boolean);

const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const COMMERCE_ID  = process.env.COMMERCE_ID || 'commerce_local_1';

let _groqKeyIndex = 0;
function nextGroqKey() {
    const key = GROQ_KEYS[_groqKeyIndex % GROQ_KEYS.length];
    _groqKeyIndex++;
    return key;
}

// ─── Prompt système exact fourni par l'utilisateur ────────────────────────────
const SYSTEM_PROMPT = `Tu es un système d'analyse de sentiment pour un commerce, intégré à une plateforme de fidélisation client (Retenza AI).

Tu reçois un avis client provenant de Google ou Facebook, ainsi que le statut du client (VIP ou standard).

Ta tâche :
1. Analyser le sentiment global de l'avis (positif, neutre, négatif)
2. Évaluer un score de risque de churn de 0 à 100 (0 = aucun risque, 100 = risque de départ imminent)
3. Identifier les motifs précis de mécontentement s'il y en a (ex: qualité produit, service client, délai, prix)
4. Déterminer si une action immédiate est requise

Règles :
- Si le client est VIP ET le sentiment est négatif (score de risque > 60), signale une alerte prioritaire avec suggestion d'appel personnel
- Si le client est standard, une alerte simple suffit (pas d'appel suggéré automatiquement)
- Reste factuel, ne survends jamais la gravité d'un avis neutre ou légèrement négatif
- Prends en compte le ton, l'ironie et les nuances culturelles (avis pouvant être en français, arabe dialectal tunisien, ou anglais)

Réponds UNIQUEMENT en JSON valide, sans texte additionnel, selon ce format :

{
  "sentiment": "positif" | "neutre" | "négatif",
  "score_confiance": 0.0-1.0,
  "risque_churn": 0-100,
  "motifs": ["motif1", "motif2"],
  "alerte_requise": true | false,
  "niveau_alerte": "aucune" | "standard" | "prioritaire",
  "suggestion_action": "string ou null",
  "extrait_pertinent": "courte citation de l'avis justifiant l'analyse"
}`;

// ─── Appel Groq avec retry sur clé suivante si 429 ───────────────────────────
async function callGroq(userMessage, maxRetries = GROQ_KEYS.length) {
    const _fetch = typeof fetch !== 'undefined' ? fetch : (...args) => import('node-fetch').then(m => m.default(...args));
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const apiKey = nextGroqKey();
        try {
            const response = await _fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type' : 'application/json',
                },
                body: JSON.stringify({
                    model      : GROQ_MODEL,
                    messages   : [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user',   content: userMessage   },
                    ],
                    temperature: 0.2,  // Faible pour cohérence JSON
                    max_tokens : 600,
                    response_format: { type: 'json_object' },
                }),
            });

            if (response.status === 429) {
                console.warn(`[Sentiment] Clé Groq saturée (429) — rotation vers la suivante`);
                lastError = new Error('Rate limit 429');
                continue;
            }

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Groq HTTP ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;

        } catch (err) {
            lastError = err;
            console.error(`[Sentiment] Tentative ${attempt + 1} échouée:`, err.message);
        }
    }

    throw lastError || new Error('Toutes les clés Groq ont échoué');
}

// ─── Validation et normalisation du JSON retourné ─────────────────────────────
function validateSentimentResult(parsed) {
    const validSentiments = ['positif', 'neutre', 'négatif'];
    const validNiveaux    = ['aucune', 'standard', 'prioritaire'];

    return {
        sentiment        : validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutre',
        score_confiance  : Math.min(1, Math.max(0, parseFloat(parsed.score_confiance) || 0.5)),
        risque_churn     : Math.min(100, Math.max(0, parseInt(parsed.risque_churn)    || 0)),
        motifs           : Array.isArray(parsed.motifs) ? parsed.motifs.filter(m => typeof m === 'string').slice(0, 8) : [],
        alerte_requise   : typeof parsed.alerte_requise === 'boolean' ? parsed.alerte_requise : false,
        niveau_alerte    : validNiveaux.includes(parsed.niveau_alerte) ? parsed.niveau_alerte : 'aucune',
        suggestion_action: parsed.suggestion_action || null,
        extrait_pertinent: parsed.extrait_pertinent || '',
    };
}

// ─── Récupère l'historique automatique des 3 derniers avis du même client ─────
async function fetchClientHistory(db, commerceId, clientEmail) {
    if (!clientEmail || !clientEmail.includes('@')) return null;

    try {
        const history = await db.collection('avis_clients')
            .find({
                commerce_id  : commerceId,
                client_email : clientEmail.toLowerCase().trim(),
            })
            .sort({ created_at: -1 })
            .limit(3)
            .toArray();

        if (!history.length) return null;

        return history
            .map((h, i) => {
                const date = h.created_at
                    ? new Date(h.created_at).toLocaleDateString('fr-FR')
                    : 'date inconnue';
                const s = h.result?.sentiment || '?';
                const r = h.result?.risque_churn ?? '?';
                return `[${i + 1}] ${date} — Sentiment: ${s}, Churn: ${r}/100, Avis: "${(h.review_text || '').substring(0, 80)}..."`;
            })
            .join('\n');
    } catch (err) {
        console.warn('[Sentiment] Impossible de charger l\'historique client:', err.message);
        return null;
    }
}

// ============================================================
// POST /api/sentiment/analyze
// Body: { review_text, client_status, client_email?, client_history_override?, source? }
// ============================================================
const analyzeSentiment = async (req, res) => {
    const startTime = Date.now();

    try {
        const db = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;

        const {
            review_text,
            client_status,
            client_email,
            client_history_override,  // override manuel (si fourni, prioritaire sur l'auto)
            source,                   // 'google' | 'facebook' | 'manuel' | etc.
        } = req.body;

        // ── Validation des champs obligatoires ─────────────────────────────────
        if (!review_text || typeof review_text !== 'string' || !review_text.trim()) {
            return res.status(400).json({ error: 'review_text est obligatoire' });
        }
        if (!client_status || !['vip', 'standard', 'VIP', 'Standard'].includes(client_status)) {
            return res.status(400).json({ error: 'client_status doit être "vip" ou "standard"' });
        }

        const normalizedStatus = client_status.toLowerCase() === 'vip' ? 'VIP' : 'Standard';
        const normalizedEmail  = client_email ? client_email.toLowerCase().trim() : null;

        // ── Historique : override manuel prioritaire, sinon auto MongoDB ────────
        let clientHistory = client_history_override || null;
        let historySource = 'manuel';

        if (!clientHistory && normalizedEmail) {
            clientHistory = await fetchClientHistory(db, commerceId, normalizedEmail);
            historySource = 'auto';
        }

        // ── Construction du message utilisateur pour le LLM ─────────────────────
        const userMessage = [
            `Avis client : "${review_text.trim()}"`,
            `Statut client : "${normalizedStatus}"`,
            `Historique récent (optionnel) : "${clientHistory || 'Aucun historique disponible'}"`,
        ].join('\n');

        console.log(`[Sentiment] 🔍 Analyse en cours — ${normalizedStatus} — source: ${source || 'non précisée'}`);

        // ── Appel LLM Groq ───────────────────────────────────────────────────────
        const rawContent = await callGroq(userMessage);
        if (!rawContent) {
            return res.status(502).json({ error: 'Réponse vide du modèle Groq' });
        }

        // ── Parse et validation JSON ─────────────────────────────────────────────
        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            // Tentative de nettoyage si JSON mal formé
            const match = rawContent.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                console.error('[Sentiment] JSON invalide reçu:', rawContent.substring(0, 200));
                return res.status(502).json({ error: 'Le modèle n\'a pas retourné un JSON valide' });
            }
        }

        const result = validateSentimentResult(parsed);
        const duration = Date.now() - startTime;

        // ── Sauvegarde systématique en base MongoDB ──────────────────────────────
        const docToSave = {
            commerce_id   : commerceId,
            client_email  : normalizedEmail,
            client_status : normalizedStatus,
            review_text   : review_text.trim(),
            source        : source || 'manuel',
            statut        : 'valide',
            client_history: clientHistory,
            history_source: historySource,
            result        : result,
            model_used    : GROQ_MODEL,
            duration_ms   : duration,
            created_at    : new Date(),
            validated_at  : new Date(),
        };

        const insertResult = await db.collection('avis_clients').insertOne(docToSave);

        console.log(
            `[Sentiment] ✅ ${result.sentiment.toUpperCase()} | Churn: ${result.risque_churn}/100 | ` +
            `Alerte: ${result.niveau_alerte} | ${duration}ms | ID: ${insertResult.insertedId}`
        );

        return res.json({
            success   : true,
            result    : result,
            analysis_id: insertResult.insertedId,
            history_source: historySource,
            duration_ms : duration,
        });

    } catch (err) {
        console.error('❌ analyzeSentiment error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/sentiment/history
// Query: commerce_id?, client_email?, limit?, page?
// ============================================================
const getSentimentHistory = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const email      = req.query.client_email ? req.query.client_email.toLowerCase().trim() : null;
        const limit      = Math.min(100, parseInt(req.query.limit) || 20);
        const page       = Math.max(1,   parseInt(req.query.page)  || 1);
        const skip       = (page - 1) * limit;

        const filter = { commerce_id: commerceId, statut: { $ne: 'en_attente' } };
        if (email) filter.client_email = email;

        const [docs, total] = await Promise.all([
            db.collection('avis_clients')
                .find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('avis_clients').countDocuments(filter),
        ]);

        // Statistiques agrégées sur tous les avis du commerce
        const [stats] = await db.collection('avis_clients').aggregate([
            { $match: { commerce_id: commerceId } },
            { $group: {
                _id             : null,
                total           : { $sum: 1 },
                avg_churn       : { $avg: '$result.risque_churn' },
                positifs        : { $sum: { $cond: [{ $eq: ['$result.sentiment', 'positif'] }, 1, 0] } },
                neutres         : { $sum: { $cond: [{ $eq: ['$result.sentiment', 'neutre'] }, 1, 0] } },
                negatifs        : { $sum: { $cond: [{ $eq: ['$result.sentiment', 'négatif'] }, 1, 0] } },
                alertes_prioritaires: { $sum: { $cond: [{ $eq: ['$result.niveau_alerte', 'prioritaire'] }, 1, 0] } },
            }},
        ]).toArray();

        return res.json({
            success   : true,
            data      : docs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            stats     : stats || { total: 0, avg_churn: 0, positifs: 0, neutres: 0, negatifs: 0, alertes_prioritaires: 0 },
        });

    } catch (err) {
        console.error('❌ getSentimentHistory error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/sentiment/prefill-history
// Pré-remplit le champ historique d'un client avant soumission
// Query: client_email, commerce_id?
// ============================================================
const prefillClientHistory = async (req, res) => {
    try {
        const db         = await connectDB();
        const commerceId = req.query.commerce_id || COMMERCE_ID;
        const email      = req.query.client_email ? req.query.client_email.toLowerCase().trim() : null;

        if (!email) {
            return res.json({ success: true, history: null, count: 0 });
        }

        const history = await fetchClientHistory(db, commerceId, email);
        const count   = await db.collection('avis_clients').countDocuments({
            commerce_id : commerceId,
            client_email: email,
        });

        return res.json({ success: true, history, count });

    } catch (err) {
        console.error('❌ prefillClientHistory error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    analyzeSentiment,
    getSentimentHistory,
    prefillClientHistory,
};
