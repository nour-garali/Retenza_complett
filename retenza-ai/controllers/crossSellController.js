/**
 * crossSellController.js
 * ──────────────────────
 * Moteur de recommandation Cross-Sell / Up-Sell basé sur l'analyse
 * des paniers d'achat (Market Basket Analysis).
 *
 * Algorithme : calcul des métriques d'association pour chaque paire
 * de produits (A, B) achetés dans le même panier :
 *   - Support    : nombre de paniers contenant A et B ensemble
 *   - Confiance  : P(B | A achetés) = support(A∩B) / support(A)
 *   - Lift       : confiance / P(B) — évite les faux positifs sur les produits très populaires
 *
 * Source de données : collection `commandes` (champ `produits[]`).
 *
 * Collections MongoDB :
 *   - commandes          (lecture — source des paniers)
 *   - ProductAssociations (écriture — règles calculées)
 *   - clients            (lecture — token FCM et email)
 *   - cross_sell_pushes  (écriture — journal anti-spam des pushes envoyés)
 *
 * Routes exposées (enregistrées dans crossSellRoutes.js) :
 *   GET  /api/recommendations/:productId  → getProductRecommendations
 *   POST /api/recommendations/recalculate → recalculateAssociations
 *   GET  /api/recommendations/rules       → getAssociationRules
 *   POST /api/recommendations/trigger-push → triggerCrossSellPushEndpoint (webhook post-caisse)
 */

'use strict';

const connectDB             = require('../config/db');
const { sendEmail }         = require('../utils/emailService');
const { sendCrossSellPush } = require('../utils/pushService');

// ============================================================
// CONSTANTES — Seuils du MBA (configurables via .env)
// ============================================================

/** Confiance minimale pour qu'une règle soit retenue (0–1) */
const MIN_CONFIDENCE = parseFloat(process.env.CROSS_SELL_MIN_CONFIDENCE || '0.60');

/** Nombre minimal de paniers contenant A∩B pour qu'une règle soit retenue */
const MIN_SUPPORT = parseInt(process.env.CROSS_SELL_MIN_SUPPORT || '3', 10);

/** Lift minimal (> 1 = corrélation positive, > 1.2 recommandé) */
const MIN_LIFT = parseFloat(process.env.CROSS_SELL_MIN_LIFT || '1.0');

/** Fenêtre anti-spam : pas de push cross-sell si un push a déjà été envoyé dans ce délai (ms) */
const ANTI_SPAM_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 heures

// ============================================================
// HELPER — Normaliser un nom de produit
// ============================================================
/**
 * Normalise un nom de produit pour la comparaison (casse, espaces).
 * @param {string} nom
 * @returns {string}
 */
const normalizeProductName = (nom) =>
    (nom || '').trim().toLowerCase().replace(/\s+/g, ' ');

// ============================================================
// HELPER — Extraire le nom d'un produit depuis un objet ligne de commande
// ============================================================
/**
 * Résout le nom du produit depuis différents schémas possibles du tableau `produits`.
 * Supporte les champs : nom, name, libelle, title, designation, article.
 * @param {Object} p - Objet produit d'une ligne de commande
 * @returns {string|null}
 */
const extractProductName = (p) => {
    if (!p || typeof p !== 'object') return null;
    return p.nom || p.name || p.libelle || p.title || p.designation || p.article || null;
};

// ============================================================
// HELPER — Créer les index MongoDB sur ProductAssociations
// ============================================================
/**
 * Crée les index nécessaires sur la collection ProductAssociations.
 * Idempotent : ne fait rien si les index existent déjà.
 * @param {import('mongodb').Db} db
 */
const ensureIndexes = async (db) => {
    try {
        await db.collection('ProductAssociations').createIndex(
            { commerce_id: 1, produitA: 1, produitB: 1 },
            { unique: true, name: 'idx_association_unique' }
        );
        await db.collection('ProductAssociations').createIndex(
            { commerce_id: 1, confiance: -1 },
            { name: 'idx_confiance_desc' }
        );
        await db.collection('ProductAssociations').createIndex(
            { dateCalcul: 1 },
            { name: 'idx_date_calcul' }
        );
    } catch (err) {
        // L'erreur "index already exists" est ignorée
        if (err.code !== 85 && err.code !== 86) {
            console.warn('[CROSS-SELL] Avertissement création index :', err.message);
        }
    }
};

// ============================================================
// MOTEUR MBA — runAssociationAnalysis(commerceId, db)
// ============================================================
/**
 * Lance l'analyse Market Basket Analysis pour un commerce.
 * Calcule support, confiance et lift pour toutes les paires de produits
 * puis persiste les règles filtrées dans la collection ProductAssociations.
 *
 * @param {string} commerceId - Identifiant du commerce
 * @param {import('mongodb').Db} db - Instance MongoDB connectée
 * @returns {Promise<{ status: string, message: string, stats: Object }>}
 */
const runAssociationAnalysis = async (commerceId, db) => {
    console.log(`🛒 [CROSS-SELL] Démarrage de l'analyse MBA pour le commerce : ${commerceId}`);

    // ── 1. Récupérer toutes les commandes avec leurs produits ────────────────
    const commandes = await db.collection('commandes')
        .find(
            { commerce_id: commerceId, produits: { $exists: true, $not: { $size: 0 } } },
            { projection: { produits: 1, _id: 1 } }
        )
        .toArray();

    if (commandes.length === 0) {
        console.log(`[CROSS-SELL] Aucune commande avec produits pour ${commerceId}. Analyse ignorée.`);
        return { status: 'skip', message: 'Aucune commande avec liste de produits trouvée.', stats: {} };
    }

    // ── 2. Construire les transactions (paniers normalisés) ──────────────────
    // Un panier = ensemble de noms de produits normalisés dans une commande
    const baskets = [];
    let totalCommandes = 0;

    for (const cmd of commandes) {
        if (!Array.isArray(cmd.produits) || cmd.produits.length === 0) continue;

        // Extraire les noms uniques de produits du panier
        const names = new Set();
        for (const p of cmd.produits) {
            const nom = extractProductName(p);
            if (nom) names.add(normalizeProductName(nom));
        }

        if (names.size >= 2) {
            // On ne garde que les paniers multi-articles (au moins 2 produits distincts)
            baskets.push([...names]);
        }
        totalCommandes++;
    }

    const totalBaskets = baskets.length;

    if (totalBaskets < MIN_SUPPORT) {
        console.log(`[CROSS-SELL] Pas assez de paniers multi-articles (${totalBaskets} < ${MIN_SUPPORT}) pour ${commerceId}.`);
        return {
            status: 'skip',
            message: `Pas assez de paniers multi-articles (${totalBaskets} disponibles, minimum ${MIN_SUPPORT} requis).`,
            stats: { totalCommandes, totalBaskets }
        };
    }

    // ── 3. Compter les occurrences de chaque produit (support individuel) ───
    // occurrencesA[produit] = nombre de paniers contenant ce produit
    const occurrencesA = new Map();
    for (const basket of baskets) {
        for (const product of basket) {
            occurrencesA.set(product, (occurrencesA.get(product) || 0) + 1);
        }
    }

    // ── 4. Compter les co-occurrences de chaque paire (A, B) ───────────────
    // On génère toutes les paires ordonnées (A→B et B→A) pour couvrir les deux sens
    const coOccurrences = new Map();

    for (const basket of baskets) {
        const products = basket;
        for (let i = 0; i < products.length; i++) {
            for (let j = 0; j < products.length; j++) {
                if (i === j) continue;
                const key = `${products[i]}|||${products[j]}`;
                coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
            }
        }
    }

    // ── 5. Calculer support, confiance, lift pour chaque paire ─────────────
    const regles = [];

    for (const [key, supportAB] of coOccurrences.entries()) {
        // Filtrage rapide sur le support brut
        if (supportAB < MIN_SUPPORT) continue;

        const [produitA, produitB] = key.split('|||');

        const supportA = occurrencesA.get(produitA) || 1;
        const supportB = occurrencesA.get(produitB) || 1;

        const confiance = supportAB / supportA;                    // P(B|A)
        const pB        = supportB / totalBaskets;                 // P(B) — popularité de B
        const lift      = pB > 0 ? confiance / pB : 0;            // Lift

        // Appliquer les seuils de filtrage
        if (confiance < MIN_CONFIDENCE) continue;
        if (lift < MIN_LIFT) continue;

        regles.push({
            commerce_id   : commerceId,
            produitA,
            produitB,
            support       : supportAB,
            support_total : totalBaskets,
            confiance     : parseFloat(confiance.toFixed(4)),
            lift          : parseFloat(lift.toFixed(4)),
            dateCalcul    : new Date(),
        });
    }

    console.log(`🛒 [CROSS-SELL] ${regles.length} règles calculées (conf ≥ ${MIN_CONFIDENCE * 100}%, support ≥ ${MIN_SUPPORT}, lift ≥ ${MIN_LIFT}) pour ${commerceId}`);

    // ── 6. Persister les règles dans MongoDB ─────────────────────────────────
    await ensureIndexes(db);

    let inserted = 0;
    let updated = 0;

    for (const regle of regles) {
        const result = await db.collection('ProductAssociations').updateOne(
            { commerce_id: regle.commerce_id, produitA: regle.produitA, produitB: regle.produitB },
            { $set: regle },
            { upsert: true }
        );
        if (result.upsertedCount > 0) inserted++;
        else if (result.modifiedCount > 0) updated++;
    }

    // Supprimer les règles obsolètes (produits qui ne sont plus suffisamment associés)
    // On conserve uniquement les règles recalculées dans ce cycle
    const keysActives = regles.map(r => ({ produitA: r.produitA, produitB: r.produitB }));
    if (keysActives.length > 0) {
        // Supprimer les règles de ce commerce qui ne sont plus dans la liste active
        await db.collection('ProductAssociations').deleteMany({
            commerce_id: commerceId,
            $nor: keysActives
        });
    }

    const stats = {
        totalCommandes,
        totalBaskets,
        totalProduits  : occurrencesA.size,
        totalRegles    : regles.length,
        inserted,
        updated,
        minConfidence  : MIN_CONFIDENCE,
        minSupport     : MIN_SUPPORT,
        minLift        : MIN_LIFT,
    };

    console.log(`✅ [CROSS-SELL] Analyse terminée pour ${commerceId} :`, stats);
    return {
        status : 'success',
        message: `${regles.length} règles d'association calculées (${inserted} nouvelles, ${updated} mises à jour).`,
        stats
    };
};

// ============================================================
// HOOK POST-CAISSE — triggerCrossSellPush(commande, db)
// ============================================================
/**
 * Déclenche une suggestion cross-sell juste après l'enregistrement d'une commande.
 * Identifie la règle d'association la plus forte parmi les produits achetés,
 * envoie une notification push (simulée ou réelle) + email de suggestion,
 * et enregistre le push dans `cross_sell_pushes` pour l'anti-spam.
 *
 * Règle anti-spam : un seul push cross-sell par client par fenêtre de 24h.
 *
 * @param {Object} commande - Document de commande (tel qu'enregistré dans MongoDB)
 * @param {import('mongodb').Db} db - Instance MongoDB connectée
 * @returns {Promise<void>}
 */
const triggerCrossSellPush = async (commande, db) => {
    try {
        const { commerce_id, client_email, produits } = commande;

        // Valider les prérequis
        if (!client_email || !Array.isArray(produits) || produits.length === 0) return;
        if (!commerce_id) return;

        // ── 1. Anti-spam (DÉSACTIVÉ : envoi à chaque passage en caisse) ─────────
        // Remarque : Le garde 24h a été désactivé à la demande du client pour que
        // chaque ticket de caisse déclenche systématiquement sa suggestion cross-sell.
        // ─────────────────────────────────────────────────────────────────────────

        // ── 2. Extraire les noms de produits achetés dans ce ticket ─────────────
        const nomsAchetes = produits
            .map(extractProductName)
            .filter(Boolean)
            .map(normalizeProductName);

        if (nomsAchetes.length === 0) return;

        // ── 3. Chercher la règle d'association la plus forte pour ces produits ───
        // On interroge ProductAssociations pour trouver la meilleure recommandation
        // parmi les produits du ticket (tri par confiance × lift décroissant)
        const regles = await db.collection('ProductAssociations')
            .find({ commerce_id, produitA: { $in: nomsAchetes } })
            .sort({ confiance: -1, lift: -1 })
            .limit(10)
            .toArray();

        if (regles.length === 0) {
            console.log(`[CROSS-SELL] Aucune règle d'association trouvée pour les produits du ticket de ${client_email}.`);
            return;
        }

        // Prendre la meilleure règle (déjà triée par confiance × lift)
        // On filtre les produits B déjà dans le panier pour éviter de suggérer ce que le client vient d'acheter
        const regleBest = regles.find(r => !nomsAchetes.includes(r.produitB));
        if (!regleBest) {
            console.log(`[CROSS-SELL] Toutes les suggestions sont déjà dans le panier de ${client_email}. Ignoré.`);
            return;
        }

        // ── 4. Récupérer le token FCM du client (optionnel) ─────────────────────
        const clientDoc = await db.collection('clients').findOne(
            { commerce_id, email: { $regex: new RegExp(`^${client_email}$`, 'i') } },
            { projection: { fcm_token: 1, nom: 1 } }
        );
        const fcmToken  = clientDoc?.fcm_token || null;
        const nomClient = clientDoc?.nom || client_email;

        // ── 5. Envoyer la notification push ─────────────────────────────────────
        await sendCrossSellPush({
            clientEmail : client_email,
            fcmToken,
            produitA    : regleBest.produitA,
            produitB    : regleBest.produitB,
            confiance   : regleBest.confiance,
            commerceId  : commerce_id,
        });

        // ── 6. Envoyer un email de suggestion (canal de secours, toujours disponible) ─
        try {
            const subject = `💡 ${nomClient}, avez-vous pensé à "${regleBest.produitB}" ?`;
            const body    =
                `Bonjour ${nomClient},\n\n` +
                `Merci pour votre achat de "${regleBest.produitA}" !\n\n` +
                `📦 Suggestion : ${Math.round(regleBest.confiance * 100)}% de nos clients qui achètent` +
                ` "${regleBest.produitA}" ajoutent aussi "${regleBest.produitB}" à leur panier.\n\n` +
                `Venez le découvrir lors de votre prochaine visite !\n\n` +
                `— L'équipe Retenza`;

            await sendEmail({ to: client_email, subject, text: body });
        } catch (emailErr) {
            // L'échec de l'email ne doit pas bloquer l'enregistrement du push
            console.warn(`[CROSS-SELL] Échec email de suggestion pour ${client_email} :`, emailErr.message);
        }

        // ── 7. Enregistrer le push dans le journal anti-spam ────────────────────
        await db.collection('cross_sell_pushes').insertOne({
            commerce_id,
            client_email : client_email.toLowerCase(),
            produitA     : regleBest.produitA,
            produitB     : regleBest.produitB,
            confiance    : regleBest.confiance,
            lift         : regleBest.lift,
            sent_at      : new Date(),
            canal        : fcmToken ? 'push+email' : 'email',
        });

        console.log(`✅ [CROSS-SELL] Suggestion "${regleBest.produitA}" → "${regleBest.produitB}" envoyée à ${client_email} (${Math.round(regleBest.confiance * 100)}% confiance)`);

    } catch (err) {
        // Non-bloquant : une erreur ici ne doit jamais faire échouer addCommande
        console.error('[CROSS-SELL] Erreur dans triggerCrossSellPush :', err.message);
    }
};

// ============================================================
// GET /api/recommendations/:productId
// Liste les produits fréquemment achetés avec ce produit.
// ============================================================
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getProductRecommendations = async (req, res) => {
    const { productId }  = req.params;
    const commerceId     = req.query.commerce_id || process.env.COMMERCE_ID || 'commerce_local_1';
    const limitRaw       = parseInt(req.query.limit || '5', 10);
    const limit          = Math.min(Math.max(limitRaw, 1), 20);

    if (!productId) {
        return res.status(400).json({ error: 'Paramètre productId requis.' });
    }

    try {
        const db     = await connectDB();
        const nomA   = normalizeProductName(decodeURIComponent(productId));

        const regles = await db.collection('ProductAssociations')
            .find({ commerce_id: commerceId, produitA: nomA })
            .sort({ confiance: -1, lift: -1 })
            .limit(limit)
            .toArray();

        regles.forEach(r => { if (r._id) r._id = r._id.toString(); });

        return res.json({
            status      : 'success',
            produitA    : nomA,
            commerce_id : commerceId,
            total       : regles.length,
            recommandations: regles.map(r => ({
                produit       : r.produitB,
                confiance     : r.confiance,
                confiance_pct : `${Math.round(r.confiance * 100)}%`,
                lift          : r.lift,
                support       : r.support,
                dateCalcul    : r.dateCalcul,
            }))
        });
    } catch (err) {
        console.error('❌ getProductRecommendations error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/recommendations/recalculate
// Déclenchement manuel du recalcul des associations.
// Body: { commerce_id? }
// ============================================================
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const recalculateAssociations = async (req, res) => {
    const commerceId = (req.body || {}).commerce_id || req.query.commerce_id || process.env.COMMERCE_ID || 'commerce_local_1';

    console.log(`🔄 [CROSS-SELL] Recalcul manuel déclenché pour commerce_id=${commerceId}`);

    try {
        const db     = await connectDB();
        const result = await runAssociationAnalysis(commerceId, db);

        return res.json({
            status   : result.status,
            message  : result.message,
            stats    : result.stats,
        });
    } catch (err) {
        console.error('❌ recalculateAssociations error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/recommendations/rules
// Liste toutes les règles d'association actives (pour le dashboard admin).
// Query: commerce_id, page, limit, min_confidence, sort_by
// ============================================================
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAssociationRules = async (req, res) => {
    const commerceId      = req.query.commerce_id || process.env.COMMERCE_ID || 'commerce_local_1';
    const page            = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limitRaw        = parseInt(req.query.limit || '50', 10);
    const limit           = Math.min(Math.max(limitRaw, 1), 200);
    const skip            = (page - 1) * limit;
    const minConf         = parseFloat(req.query.min_confidence || '0');
    const sortByField     = req.query.sort_by === 'lift' ? 'lift' : 'confiance';
    const produitAFilter  = req.query.produit_a ? normalizeProductName(req.query.produit_a) : null;

    try {
        const db = await connectDB();

        const filter = { commerce_id: commerceId };
        if (minConf > 0)       filter.confiance = { $gte: minConf };
        if (produitAFilter)    filter.produitA   = produitAFilter;

        const [regles, total] = await Promise.all([
            db.collection('ProductAssociations')
                .find(filter)
                .sort({ [sortByField]: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('ProductAssociations').countDocuments(filter),
        ]);

        regles.forEach(r => { if (r._id) r._id = r._id.toString(); });

        return res.json({
            status      : 'success',
            commerce_id : commerceId,
            total,
            page,
            pages       : Math.ceil(total / limit),
            seuils      : { min_confidence: MIN_CONFIDENCE, min_support: MIN_SUPPORT, min_lift: MIN_LIFT },
            regles      : regles.map(r => ({
                _id           : r._id,
                produitA      : r.produitA,
                produitB      : r.produitB,
                confiance     : r.confiance,
                confiance_pct : `${Math.round(r.confiance * 100)}%`,
                lift          : r.lift,
                support       : r.support,
                support_total : r.support_total,
                dateCalcul    : r.dateCalcul,
            }))
        });
    } catch (err) {
        console.error('❌ getAssociationRules error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/recommendations/trigger-push
// Webhook manuel de test du push cross-sell pour une commande donnée.
// Body: { commerce_id, client_email, produits[] }
// ============================================================
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const triggerCrossSellPushEndpoint = async (req, res) => {
    const { commerce_id, client_email, produits } = req.body || {};

    if (!client_email || !Array.isArray(produits) || produits.length === 0) {
        return res.status(400).json({
            error: 'Champs requis manquants : client_email, produits (array).'
        });
    }

    try {
        const db = await connectDB();
        await triggerCrossSellPush({
            commerce_id : commerce_id || process.env.COMMERCE_ID || 'commerce_local_1',
            client_email,
            produits,
        }, db);

        return res.json({
            status  : 'success',
            message : `Déclenchement cross-sell traité pour ${client_email}.`
        });
    } catch (err) {
        console.error('❌ triggerCrossSellPushEndpoint error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// Exports
// ============================================================
module.exports = {
    runAssociationAnalysis,
    triggerCrossSellPush,
    getProductRecommendations,
    recalculateAssociations,
    getAssociationRules,
    triggerCrossSellPushEndpoint,
};
