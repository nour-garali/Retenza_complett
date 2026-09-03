require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rfmRoutes       = require('./routes/rfmRoutes');
const loyaltyRoutes   = require('./routes/loyaltyRoutes');
const crossSellRoutes = require('./routes/crossSellRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Middlewares
// ============================================================
app.use(cors({
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger minimaliste pour chaque requête
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    req.auth = { role: 'super_admin' }; // Bypass d'authentification
    next();
});

// ============================================================
// Routes API REST
// ============================================================
app.use('/api/super-admin', superAdminRoutes);

// Les liens RGPD signés et le pixel de tracking doivent rester accessibles sans
// session. Toutes les autres API sont protégées au niveau du backend, y compris
// lorsque l'appel contourne le proxy Next.js.
app.use('/api', rfmRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/recommendations', crossSellRoutes);
app.use('/api/partnership-requests', require('./routes/partnershipRoutes'));

// ============================================================
// Servir la page HTML d'interface (templates/index.html)
// ============================================================
const templatesDir = path.join(__dirname, 'templates');
app.use(express.static(templatesDir));

app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(templatesDir, 'index.html'));
});

// Fallback pour les routes inconnues
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `Route introuvable : ${req.path}` });
    }
    res.sendFile(path.join(templatesDir, 'index.html'));
});

// ============================================================
// Gestionnaire d'erreurs global
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur :', err.stack);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
});

// ============================================================
// Planificateur quotidien autonome d'envois marketing (IA)
// ============================================================
const { runSmartAutomationInternal, sendShopAnniversaryCampaign } = require('./controllers/rfmController');
const { runLowTrafficAutomation, calculateSnapshot, DEFAULTS: LOW_TRAFFIC_DEFAULTS } = require('./controllers/lowTrafficController');
const { runReviewCollection } = require('./controllers/reviewCollectorController');
const { runAssociationAnalysis } = require('./controllers/crossSellController');
const { recalculateAllTrustScoresForCommerce } = require('./controllers/fraudController');
const connectDB = require('./config/db');


// Seuil de détection du "mode test" : cooldown_days ≤ 0.01 (= ~14 minutes max)
const TEST_MODE_THRESHOLD_DAYS = 0.01;
// Fenêtre d'exécution quotidienne : 9h00 → 9h04 (4 minutes de tolérance)
const DAILY_RUN_HOUR = 9;
const DAILY_WINDOW_MINUTES = 4;
// Collecte des avis toutes les 6h = 72 ticks de 5 minutes
const REVIEW_COLLECT_INTERVAL_TICKS = 72;
let reviewCollectTickCounter = 0;
// Recalcul des associations Cross-Sell toutes les 6h = 72 ticks de 5 minutes
const CROSS_SELL_INTERVAL_TICKS = 72;
let crossSellTickCounter = 0;
// Recalcul du trust_score Anti-Fraude toutes les 6h = 72 ticks de 5 minutes
const TRUST_SCORE_INTERVAL_TICKS = 72;
let trustScoreTickCounter = 0;

function startAdaptiveScheduler() {
    let isSchedulerRunning = false;
    // Garde-fou pour ne pas relancer plusieurs fois dans la même journée (mode production)
    const lastDailyRunDates = {};
    async function recordTask(db, jobName, commerceId, task) {
        const started_at = new Date();
        const row = await db.collection('job_runs').insertOne({ job_name: jobName, commerce_id: commerceId, started_at, status: 'running' });
        try { const result = await task(); const status = result?.status === 'skip' ? 'skipped' : 'success'; await db.collection('job_runs').updateOne({ _id: row.insertedId }, { $set: { status, finished_at: new Date(), result_summary: result?.message || null } }); return result; }
        catch (error) { await db.collection('job_runs').updateOne({ _id: row.insertedId }, { $set: { status: 'failed', finished_at: new Date(), error: error.message } }); throw error; }
    }

    /**
     * Lit le cooldown de chaque marque en base et détermine si ce commerce
     * doit être traité lors de ce tick.
     */
    async function shouldRunForCommerce(db, commerceId) {
        const brandId = commerceId.replace(/_\d+$/, '');
        try {
            const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId });
            const cooldownDays = (settings && settings.cooldown_days !== undefined)
                ? parseFloat(settings.cooldown_days) || 30
                : 30;

            const isTestMode = cooldownDays <= TEST_MODE_THRESHOLD_DAYS;

            if (isTestMode) {
                // Mode 5 minutes : on exécute à chaque tick (toutes les 5 min)
                console.log(`⏰ [SCHEDULER] Mode TEST (${cooldownDays}j) détecté pour "${brandId}" — tick 5 min`);
                return true;
            } else {
                // Mode production : on exécute uniquement dans la fenêtre définie
                const runHour = (settings && settings.daily_run_hour !== undefined) ? parseInt(settings.daily_run_hour, 10) : DAILY_RUN_HOUR;
                const now = new Date();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const todayStr = now.toDateString();
                const inDailyWindow = (hour === runHour && minute < DAILY_WINDOW_MINUTES);
                const alreadyRanToday = (lastDailyRunDates[commerceId] === todayStr);

                if (inDailyWindow && !alreadyRanToday) {
                    console.log(`⏰ [SCHEDULER] Mode PRODUCTION (${cooldownDays}j) pour "${brandId}" — fenêtre ${runHour}h OK`);
                    return true;
                } else if (inDailyWindow && alreadyRanToday) {
                    console.log(`⏰ [SCHEDULER] Mode PRODUCTION — déjà exécuté aujourd'hui pour "${brandId}", saut.`);
                    return false;
                } else {
                    // Pas dans la fenêtre — afficher prochaine exécution prévue
                    const nextRun = new Date();
                    nextRun.setHours(runHour, 0, 0, 0);
                    if (now >= nextRun) nextRun.setDate(nextRun.getDate() + 1);
                    return false;
                }
            }
        } catch (err) {
            console.warn(`[SCHEDULER] Impossible de lire les paramètres pour "${commerceId}":`, err.message);
            return false;
        }
    }

    async function tickScheduler() {
        const tickStartedAt = new Date();
        let tickRunId = null;
        if (isSchedulerRunning) {
            console.log(`⏰ [SCHEDULER] [WARNING] Exécution déjà en cours, saut de ce tick.`);
            return;
        }
        isSchedulerRunning = true;

        try {
            const db = await connectDB();
            tickRunId = (await db.collection('job_runs').insertOne({job_name:'scheduler_tick',started_at:tickStartedAt,status:'running'})).insertedId;
            await db.collection('system_health').updateOne({service_name:'scheduler'},{$set:{service_name:'scheduler',status:'healthy',checked_at:tickStartedAt,details:{last_tick_at:tickStartedAt}}},{upsert:true});
            const commerceIds = await db.collection('clients').distinct('commerce_id');

            // Vérification indépendante toutes les 5 min : les offres flash ne dépendent pas du cycle de 9 h.
            for (const commerceId of commerceIds) {
                try { await recordTask(db, 'low_traffic', commerceId, () => runLowTrafficAutomation(commerceId, db)); } catch (err) { console.error(`[LOW-TRAFFIC] ${commerceId}:`, err.message); }
            }

            // Collecte des avis Google + Facebook toutes les 6h (72 ticks de 5min)
            reviewCollectTickCounter++;
            if (reviewCollectTickCounter >= REVIEW_COLLECT_INTERVAL_TICKS) {
                reviewCollectTickCounter = 0;
                console.log(`⏰ [SCHEDULER] 🌐 Lancement collecte avis (6h) pour ${commerceIds.length} commerce(s)`);
                for (const commerceId of commerceIds) {
                    try {
                        const r = await runReviewCollection(commerceId);
                        console.log(`🌐 [REVIEW COLLECTOR] ${commerceId}: ${r.message}`);
                    } catch (err) {
                        console.error(`❌ [REVIEW COLLECTOR] ${commerceId}:`, err.message);
                    }
                }
            }

            // Recalcul des associations Cross-Sell toutes les 6h (72 ticks de 5min)
            crossSellTickCounter++;
            if (crossSellTickCounter >= CROSS_SELL_INTERVAL_TICKS) {
                crossSellTickCounter = 0;
                console.log(`⏰ [SCHEDULER] 🛒 Lancement recalcul Cross-Sell MBA (6h) pour ${commerceIds.length} commerce(s)`);
                for (const commerceId of commerceIds) {
                    try {
                        const r = await recordTask(db, 'cross_sell_analysis', commerceId, () => runAssociationAnalysis(commerceId, db));
                        console.log(`🛒 [CROSS-SELL] ${commerceId}: ${r.message}`);
                    } catch (err) {
                        console.error(`❌ [CROSS-SELL] ${commerceId}:`, err.message);
                    }
                }
            }

            // Recalcul du score de confiance Anti-Fraude (trust_score) toutes les 6h (72 ticks de 5min)
            trustScoreTickCounter++;
            if (trustScoreTickCounter >= TRUST_SCORE_INTERVAL_TICKS) {
                trustScoreTickCounter = 0;
                console.log(`⏰ [SCHEDULER] 🛡️ Lancement recalcul Trust Score Anti-Fraude (6h) pour ${commerceIds.length} commerce(s)`);
                for (const commerceId of commerceIds) {
                    try {
                        const r = await recordTask(db, 'trust_score_recalculate', commerceId, () => recalculateAllTrustScoresForCommerce(commerceId, db));
                        console.log(`🛡️ [TRUST SCORE] ${commerceId}: ${r?.recalculated_count || 0} client(s) mis à jour.`);
                    } catch (err) {
                        console.error(`❌ [TRUST SCORE] ${commerceId}:`, err.message);
                    }
                }
            }

            // Recalcul quotidien du cache heatmap (une fois dans la fenêtre de l'heure définie).
            const nowForSnapshots = new Date();
            const minuteForSnapshots = nowForSnapshots.getMinutes();

            for (const commerceId of commerceIds) {
                const brandId = commerceId.replace(/_\d+$/, '');
                let runHour = DAILY_RUN_HOUR;
                try {
                    const exportSettings = await db.collection('commerces_settings').findOne({ brand_id: brandId });
                    if (exportSettings && exportSettings.daily_run_hour !== undefined) {
                        runHour = parseInt(exportSettings.daily_run_hour, 10);
                    }
                    
                    if (nowForSnapshots.getHours() === runHour && minuteForSnapshots < DAILY_WINDOW_MINUTES) {
                        // Snapshot
                        try { const settings = await db.collection('heures_creuses_settings').findOne({ commerce_id: commerceId }); await recordTask(db, 'low_traffic_snapshot', commerceId, () => settings ? calculateSnapshot(db, commerceId, { ...LOW_TRAFFIC_DEFAULTS, ...settings, offer: { ...LOW_TRAFFIC_DEFAULTS.offer, ...(settings.offer || {}) }, audience: { ...LOW_TRAFFIC_DEFAULTS.audience, ...(settings.audience || {}) } }) : Promise.resolve({status:'skip',message:'Configuration absente'})); } catch (err) { console.error(`[LOW-TRAFFIC SNAPSHOT] ${commerceId}:`, err.message); }

                        // Export mensuel
                        if (nowForSnapshots.getDate() === 1) {
                            if (exportSettings && exportSettings.monthly_export_enabled === false) {
                                console.log(`⏰ [SCHEDULER] 📊 Export Comptable désactivé pour "${commerceId}" (Paramètres Avancés) — saut.`);
                                await recordTask(db, 'monthly_accounting_export', commerceId, () => Promise.resolve({ status: 'skip', message: 'Export désactivé via Paramètres Avancés' }));
                            } else {
                                const { runMonthlyAccountingExport } = require('./controllers/rfmController');
                                console.log(`⏰ [SCHEDULER] 📊 Lancement Export Comptable Mensuel pour "${commerceId}"`);
                                try {
                                    const r = await recordTask(db, 'monthly_accounting_export', commerceId, () => runMonthlyAccountingExport(commerceId, db));
                                    console.log(`📊 [ACCOUNTING] ${commerceId}: ${r.message}`);
                                } catch (err) {
                                    console.error(`❌ [ACCOUNTING] ${commerceId}:`, err.message);
                                }
                            }
                        } else {
                            await recordTask(db, 'monthly_accounting_export', commerceId, () => Promise.resolve({ status: 'skip', message: 'Pas le 1er du mois' }));
                        }
                    } else {
                        await recordTask(db, 'low_traffic_snapshot', commerceId, () => Promise.resolve({ status: 'skip', message: 'Hors fenêtre quotidienne' }));
                        await recordTask(db, 'monthly_accounting_export', commerceId, () => Promise.resolve({ status: 'skip', message: 'Hors fenêtre quotidienne' }));
                    }
                } catch (e) {
                    console.error(`Erreur vérification cache/export ${commerceId}:`, e.message);
                }
            }

            for (const commerceId of commerceIds) {
                const shouldRun = await shouldRunForCommerce(db, commerceId);
                if (!shouldRun) { await recordTask(db, 'rfm_automation', commerceId, () => Promise.resolve({status:'skip',message:'Hors fenêtre'})); await recordTask(db, 'shop_anniversary', commerceId, () => Promise.resolve({status:'skip',message:'Hors fenêtre'})); continue; }

                console.log(`⏰ [SCHEDULER] Lancement automatique pour le commerce : ${commerceId} à ${new Date().toLocaleString('fr-FR')}`);
                const result = await recordTask(db, 'rfm_automation', commerceId, () => runSmartAutomationInternal(commerceId));
                console.log(`⏰ [SCHEDULER] Résultat pour ${commerceId} :`, result.message, result.stats);

                // Campagnes anniversaire boutique (J-7, J-3, J-1) — indépendant du cooldown RFM
                try {
                    const db = await connectDB();
                    const anniversaryResult = await recordTask(db, 'shop_anniversary', commerceId, () => sendShopAnniversaryCampaign(commerceId, db));
                    if (anniversaryResult.status === 'success') {
                        console.log(`🎂 [SCHEDULER] Anniversaire boutique pour ${commerceId} :`, anniversaryResult.stats);
                    }
                } catch (err) {
                    console.error(`❌ [SCHEDULER] Erreur anniversaire boutique pour ${commerceId} :`, err.message);
                }
                
                lastDailyRunDates[commerceId] = new Date().toDateString();
            }
            if(tickRunId) await db.collection('job_runs').updateOne({_id:tickRunId},{$set:{status:'success',finished_at:new Date()}});
        } catch (err) {
            console.error(`❌ [SCHEDULER] Erreur globale :`, err.message);
            try { const db=await connectDB(); if(tickRunId) await db.collection('job_runs').updateOne({_id:tickRunId},{$set:{status:'failed',finished_at:new Date(),error:err.message}}); await db.collection('system_health').updateOne({service_name:'scheduler'},{$set:{service_name:'scheduler',status:'degraded',checked_at:new Date(),details:{error:err.message}}},{upsert:true}); } catch(_){}
        } finally {
            isSchedulerRunning = false;
        }
    }

    // Tick toutes les 5 minutes — le scheduler décide lui-même si on est en mode test ou production
    const TICK_INTERVAL_MS = Number(process.env.SCHEDULER_TICK_INTERVAL_MS) || 5 * 60 * 1000; // 5 minutes
    console.log(`⏰ [SCHEDULER] Planificateur adaptatif démarré (tick toutes les 5 min).`);
    console.log(`⏰ [SCHEDULER]   → Mode TEST (≤ 0.01j) : exécution à chaque tick (5 min)`);
    console.log(`⏰ [SCHEDULER]   → Mode PRODUCTION (7/14/21/30j) : exécution quotidienne à ${DAILY_RUN_HOUR}h00`);

    setInterval(tickScheduler, TICK_INTERVAL_MS);
}


// ============================================================
// Démarrage du serveur
// ============================================================
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   🚀 Retenza Phase 1 — Node.js / Express.js      ║');
    console.log(`║   Serveur démarré sur http://localhost:${PORT}      ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║   Routes API :                                   ║');
    console.log('║   GET  /api/data                → KPIs + RFM    ║');
    console.log('║   GET  /api/transactions/:email → Achats client  ║');
    console.log('║   POST /api/recalculate         → Pipeline RFM   ║');
    console.log('║   POST /api/loyalty/credit      → Fidélité pts   ║');
    console.log('║   POST /api/loyalty/redeem      → Utiliser code  ║');
    console.log('║   GET  /api/loyalty/balance/:e  → Solde client   ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    // Démarrer le planificateur adaptatif de tâches de fond
    connectDB().then(async db=>{ const ids=await db.collection('clients').distinct('commerce_id'); for(const id of ids) await db.collection('commerces').updateOne({commerce_id:id},{$setOnInsert:{commerce_id:id,brand_id:id.replace(/_\d+$/,''),name:id,status:'active',created_at:new Date()},$set:{updated_at:new Date()}},{upsert:true}); await db.collection('system_health').updateOne({service_name:'mongodb'},{$set:{service_name:'mongodb',status:'healthy',checked_at:new Date()}},{upsert:true}); }).catch(()=>{});
    startAdaptiveScheduler();
});

module.exports = app;
