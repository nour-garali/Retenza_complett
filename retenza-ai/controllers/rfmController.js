const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');
const { sendEmail } = require('../utils/emailService');
const { getClientIp } = require('../utils/clientIp');

const COMMERCE_ID = process.env.COMMERCE_ID || 'commerce_local_1';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// ============================================================
// 🧪 CONFIG MODE TEST : liste des emails autorisés en mode 5 minutes
// Modifier cette liste pour ajouter/retirer des destinataires de test.
// En mode production (7j/14j/21j/30j), ce filtre ne s'applique PAS.
// ============================================================
const TEST_MODE_EMAILS = [
    'ghofrane.khadhar@gmail.com',
    // Ajoutez un 2ème email de test ici si besoin :
    // 'autre.email@exemple.com',
];
// Seuil de détection du mode test : cooldown_days ≤ cette valeur
const TEST_MODE_THRESHOLD_DAYS = 0.01; // 0.01 jour = ~14 minutes

// ============================================================
// 📊 CACHE EN MÉMOIRE & SÉCURITÉ TRACKING
// ============================================================
const statsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// 🛒 DÉTECTION D'ABSENCE ANORMALE (Panier Abandonné Physique)
// Calcule l'intervalle moyen de visite d'un client à partir de
// ses transactions/commandes, et détecte si son absence actuelle
// dépasse significativement son propre rythme habituel.
// ============================================================

/**
 * detectAbnormalAbsence(email, commerceId, db, settings)
 * 
 * @param {string}  email       - Email du client
 * @param {string}  commerceId  - ID du commerce
 * @param {object}  db          - Instance MongoDB connectée
 * @param {object}  settings    - Paramètres du commerce (commerces_settings)
 * @returns {object|null}  Résultat avec { detected, avgInterval, daysSinceLast, threshold, avgBasket, topProduct } ou null
 */
const detectAbnormalAbsence = async (email, commerceId, db, settings) => {
    try {
        // Multiplicateur configurable (défaut : 2.0)
        const multiplier = parseFloat(settings?.absence_multiplier) || 2.0;
        const MIN_TRANSACTIONS = 5; // Minimum pour un calcul fiable

        // 1. Récupérer toutes les dates de transactions ET commandes du client
        // On résout d'abord le client_id depuis l'email
        const clientDoc = await db.collection('clients').findOne(
            { email: { $regex: new RegExp(`^${email}$`, 'i') }, commerce_id: commerceId }
        ) || await db.collection('clients').findOne(
            { email: { $regex: new RegExp(`^${email}$`, 'i') } }
        );

        const identifiers = [email];
        if (clientDoc) {
            if (clientDoc.id) identifiers.push(String(clientDoc.id));
            if (clientDoc._id) identifiers.push(clientDoc._id.toString());
        }

        // Récupérer toutes les transactions
        const txDocs = await db.collection('transactions')
            .find({ client_id: { $in: identifiers }, commerce_id: commerceId })
            .project({ date_transaction: 1 })
            .toArray();

        // Récupérer toutes les commandes (et les produits pour personnalisation)
        const cmdDocs = await db.collection('commandes')
            .find({
                commerce_id: commerceId,
                $or: [
                    { client_email: { $regex: new RegExp(`^${email}$`, 'i') } },
                    { client_id: { $in: identifiers } }
                ]
            })
            .project({ date_commande: 1, montant_total: 1, montant: 1, produits: 1 })
            .toArray();

        // 2. Fusionner et dédupliquer les dates (par jour)
        const dateSet = new Set();
        const allDates = [];
        const allAmounts = [];
        const productFreq = {};

        txDocs.forEach(tx => {
            if (!tx.date_transaction) return;
            const d = new Date(tx.date_transaction);
            if (isNaN(d.getTime())) return;
            const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
            if (!dateSet.has(dayKey)) { dateSet.add(dayKey); allDates.push(d); }
            const amt = parseFloat(tx.montant || 0);
            if (amt > 0) allAmounts.push(amt);
        });

        cmdDocs.forEach(cmd => {
            const dateRaw = cmd.date_commande;
            if (!dateRaw) return;
            const d = new Date(dateRaw);
            if (isNaN(d.getTime())) return;
            const dayKey = d.toISOString().slice(0, 10);
            if (!dateSet.has(dayKey)) { dateSet.add(dayKey); allDates.push(d); }
            const amt = parseFloat(cmd.montant_total || cmd.montant || 0);
            if (amt > 0) allAmounts.push(amt);
            // Tracker les produits achetés
            if (Array.isArray(cmd.produits)) {
                cmd.produits.forEach(p => {
                    const name = p.nom || p.name || p.libelle || p.title;
                    if (name) productFreq[name] = (productFreq[name] || 0) + 1;
                });
            }
        });

        // 3. Vérifier le minimum de données
        if (allDates.length < MIN_TRANSACTIONS) return null;

        // 4. Trier les dates croissantes et calculer les intervalles
        allDates.sort((a, b) => a - b);
        const intervals = [];
        for (let i = 1; i < allDates.length; i++) {
            const diffMs = allDates[i] - allDates[i - 1];
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays > 0 && diffDays < 90) intervals.push(diffDays); // Exclure les gros gaps (vacances, fermeture)
        }

        if (intervals.length < 2) return null; // Pas assez d'intervalles pour une moyenne fiable

        // 5. Moyenne des intervalles (robuste : on exclut les outliers > Q3 + 1.5*IQR)
        intervals.sort((a, b) => a - b);
        const q1 = intervals[Math.floor(intervals.length * 0.25)];
        const q3 = intervals[Math.floor(intervals.length * 0.75)];
        const iqr = q3 - q1;
        const upperBound = q3 + 1.5 * iqr;
        const filteredIntervals = intervals.filter(v => v <= upperBound);
        const avgInterval = filteredIntervals.reduce((s, v) => s + v, 0) / filteredIntervals.length;

        // 6. Jours depuis la dernière visite
        const lastVisit = allDates[allDates.length - 1];
        const daysSinceLast = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);

        // 7. Seuil d'alerte
        const threshold = avgInterval * multiplier;
        const detected = daysSinceLast > threshold;

        // 8. Panier moyen
        const avgBasket = allAmounts.length > 0
            ? Math.round(allAmounts.reduce((s, v) => s + v, 0) / allAmounts.length)
            : null;

        // 9. Produit le plus fréquent (si disponible)
        let topProduct = null;
        if (Object.keys(productFreq).length > 0) {
            topProduct = Object.entries(productFreq).sort((a, b) => b[1] - a[1])[0][0];
        }

        return {
            detected,
            avgInterval: parseFloat(avgInterval.toFixed(1)),
            daysSinceLast: parseFloat(daysSinceLast.toFixed(1)),
            threshold: parseFloat(threshold.toFixed(1)),
            avgBasket,
            topProduct,
            lastVisitDate: lastVisit.toISOString().slice(0, 10)
        };
    } catch (err) {
        console.error(`[detectAbnormalAbsence] Erreur pour ${email}:`, err.message);
        return null;
    }
};

const clearStatsCache = () => {
    statsCache.clear();
};

const generateTrackingId = () => {
    return crypto.randomBytes(16).toString('hex'); // Jetons aléatoires 32 caractères non devinables
};

const generateBatchId = (prefix = 'CMP') => {
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const randHex = crypto.randomBytes(3).toString('hex');
    return `${prefix}-${dateStr}-${randHex}`;
};


// ============================================================
// GET /api/data
// Retourne tous les résultats RFM depuis la collection analyses_ia
// triés par score_global_sa décroissant.
// ============================================================
const getRFMData = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const db = await connectDB();
        const records = await db.collection('analyses_ia')
            .find({ commerce_id: commerceId })
            .sort({ score_global_sa: -1 })
            .toArray();

        // Récupérer tous les soldes de points de fidélité pour ce commerce
        const loyaltyBalances = await db.collection('points_fidelite')
            .find({ commerce_id: commerceId })
            .toArray();

        // Créer une map pour accès rapide par email
        const loyaltyMap = new Map();
        loyaltyBalances.forEach(lb => {
            if (lb.client_email) {
                loyaltyMap.set(lb.client_email.toLowerCase(), lb);
            }
        });

        // Récupérer la liste des clients pour synchroniser l'état RGPD opt-out
        const clientsDocs = await db.collection('clients')
            .find({ commerce_id: commerceId })
            .toArray();
        const clientRgpdMap = new Map();
        clientsDocs.forEach(c => {
            if (c.email) {
                clientRgpdMap.set(c.email.toLowerCase(), c);
            }
        });

        // Convertir ObjectId en chaîne et attacher points_cumules + status RGPD
        records.forEach(r => {
            if (r._id) r._id = r._id.toString();
            if (r.email) {
                const loyalty = loyaltyMap.get(r.email.toLowerCase());
                r.points_cumules = loyalty ? (loyalty.points_cumules || 0) : 0;

                const clientDoc = clientRgpdMap.get(r.email.toLowerCase());
                if (clientDoc) {
                    r.rgpd_opt_out = clientDoc.rgpd_opt_out === true;
                    if (clientDoc.rgpd_opt_out_date) r.rgpd_opt_out_date = clientDoc.rgpd_opt_out_date;
                    r.trust_score = clientDoc.trust_score !== undefined ? clientDoc.trust_score : (r.trust_score !== undefined ? r.trust_score : 1.0);
                } else {
                    r.trust_score = r.trust_score !== undefined ? r.trust_score : 1.0;
                }
            } else {
                r.points_cumules = 0;
                r.trust_score = 1.0;
            }
        });

        return res.json(records);
    } catch (err) {
        console.error('❌ getRFMData error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/transactions/:email
// Résout le client_id depuis son email, puis renvoie ses transactions.
// ============================================================
const getClientTransactions = async (req, res) => {
    const { id } = req.params;
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const db = await connectDB();

        // Construire un filtre robuste : on essaie id (string) ET ObjectId si valide
        const orFilter = [{ client_id: id }];
        if (ObjectId.isValid(id)) {
            orFilter.push({ client_id: new ObjectId(id) });
        }

        let transactions = await db.collection('transactions')
            .find({ $or: orFilter, commerce_id: commerceId })
            .sort({ date_transaction: -1 })
            .toArray();

        // Fallback : si rien trouvé, chercher par email via la collection clients
        if (transactions.length === 0) {
            const clientDoc = await db.collection('clients').findOne({ email: id, commerce_id: commerceId })
                || await db.collection('clients').findOne({ email: id });
            if (clientDoc) {
                const customId = clientDoc.id;
                const mongoId = clientDoc._id.toString();

                const orFilter2 = [];
                if (customId) orFilter2.push({ client_id: customId });
                orFilter2.push({ client_id: mongoId });
                if (ObjectId.isValid(mongoId)) {
                    orFilter2.push({ client_id: new ObjectId(mongoId) });
                }

                transactions = await db.collection('transactions')
                    .find({ $or: orFilter2, commerce_id: commerceId })
                    .sort({ date_transaction: -1 })
                    .toArray();
            }
        }

        // Formater les dates ISO et les ObjectId pour le JSON
        transactions.forEach(tx => {
            if (tx._id) tx._id = tx._id.toString();
            if (tx.date_transaction) tx.date_transaction = new Date(tx.date_transaction).toISOString();
        });

        return res.json(transactions);
    } catch (err) {
        console.error('❌ getClientTransactions error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/recalculate
// Lance le pipeline de calcul RFM Python comme sous-processus.
// ============================================================
const recalculateRFM = (req, res) => {
    const data = req.body || {};
    const commerceId = data.commerce_id || COMMERCE_ID;
    const projectRoot = path.resolve(__dirname, '..');

    console.log(`🔄 Recalcul RFM lancé pour commerce_id=${commerceId}...`);

    const args = ['main.py', '--commerce-id', commerceId];

    const pyProcess = spawn(PYTHON_PATH, args, {
        cwd: projectRoot,
        env: { ...process.env }
    });

    let output = '';
    let errorOutput = '';
    let responseSent = false;

    pyProcess.stdout.on('data', data => {
        const line = data.toString();
        output += line;
        process.stdout.write(`[Python RFM] ${line}`);
    });

    pyProcess.stderr.on('data', data => {
        const line = data.toString();
        errorOutput += line;
        process.stderr.write(`[Python ERR] ${line}`);
    });

    pyProcess.on('close', code => {
        if (responseSent) return;
        responseSent = true;

        if (code === 0) {
            console.log(`✅ Pipeline RFM terminé avec succès (code ${code})`);
            return res.json({
                status: 'success',
                message: 'Calcul RFM recalculé et sauvegardé avec succès !'
            });
        } else {
            console.error(`❌ Pipeline RFM échoué (code ${code})`);
            return res.status(500).json({
                status: 'error',
                error: `Le processus Python a terminé avec le code ${code}`,
                detail: errorOutput.slice(-500)
            });
        }
    });

    pyProcess.on('error', err => {
        if (responseSent) return;
        responseSent = true;

        console.error('❌ Impossible de lancer Python :', err.message);
        return res.status(500).json({ error: `Impossible de lancer Python : ${err.message}` });
    });
};

// ============================================================
// POST /api/campaigns/send
// Envoie ou simule un e-mail de campagne marketing et le persiste
// dans la collection 'campagnes_envoyees' de MongoDB.
// ============================================================
const sendCampaignEmail = async (req, res) => {
    const { email, nom, subject, body, segment, commerce_id } = req.body || {};
    const commerceId = commerce_id || COMMERCE_ID;

    if (!email || !subject || !body) {
        return res.status(400).json({ error: 'Champs requis manquants : email, subject, body.' });
    }

    try {
        const db = await connectDB();

        const normalizedEmail = email.toLowerCase().trim();

        // Vérification RGPD
        const client = await db.collection('clients').findOne({ email: email, commerce_id: commerceId });
        if (client && (client.rgpd_opt_out === true || client.rgpd_opt_out_marketing === true)) {
            return res.status(400).json({ error: `Le client ${email} s'est désabonné du ciblage marketing (RGPD).` });
        }

        const trackingId = generateTrackingId();
        const batchId = generateBatchId('IND');

        // Envoi réel ou simulation via le service emailService avec tracking
        const result = await sendEmail({
            to: normalizedEmail,
            subject,
            text: body,
            trackingId
        });

        const campaignDoc = {
            commerce_id: commerceId,
            client_email: normalizedEmail,
            client_nom: nom || email,
            segment: segment || 'unknown',
            subject,
            body,
            sent_at: new Date().toISOString(),
            status: result.status, // 'sent' ou 'simulated'
            tracking_id: trackingId,
            campaign_batch_id: batchId,
            opened: false,
            open_count: 0
        };

        // Persistance dans MongoDB
        await db.collection('campagnes_envoyees').insertOne(campaignDoc);
        clearStatsCache();

        const msg = result.status === 'sent'
            ? `E-mail de campagne envoyé avec succès à ${email}.`
            : `E-mail de campagne simulé et enregistré pour ${email}.`;

        return res.json({
            status: 'success',
            message: msg
        });
    } catch (err) {
        console.error('❌ sendCampaignEmail error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/campaigns/history/:email
// Retourne l'historique des campagnes envoyées à un client.
// ============================================================
const getClientCampaignHistory = async (req, res) => {
    const { email } = req.params;
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const db = await connectDB();
        const query = {};

        if (email && email !== '__all__') {
            query.client_email = email;
        }

        if (commerceId && commerceId !== '__all__') {
            query.commerce_id = commerceId;
        }

        const history = await db.collection('campagnes_envoyees')
            .find(query)
            .sort({ sent_at: -1 })
            .limit(100) // limit to last 100 entries for performance
            .toArray();

        history.forEach(h => { if (h._id) h._id = h._id.toString(); });

        return res.json(history);
    } catch (err) {
        console.error('❌ getClientCampaignHistory error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/campaigns/send-group
// Envoie un e-mail à un groupe de clients en batch
// ============================================================
const sendGroupCampaign = async (req, res) => {
    const { clients, subject, body, commerce_id, filters } = req.body || {};
    const commerceId = commerce_id || COMMERCE_ID;
    // true si l'expéditeur a fourni une liste explicite (recommandation IA)
    const isPinnedList = Array.isArray(clients) && clients.length > 0;

    if (!isPinnedList && !filters) {
        return res.status(400).json({ error: 'Champs requis manquants : clients (array) ou filters.' });
    }
    if (!subject || !body) {
        return res.status(400).json({ error: 'Champs requis manquants : subject, body.' });
    }

    try {
        const db = await connectDB();

        // 1. Récupérer les infos RGPD depuis la collection clients
        // Pour une liste épinglée (IA), on ne bloque que le opt-out dur (pas le marketing)
        const rgpdQuery = isPinnedList
            ? { commerce_id: commerceId, rgpd_opt_out: true }         // opt-out dur uniquement
            : { commerce_id: commerceId, $or: [{ rgpd_opt_out: true }, { rgpd_opt_out_marketing: true }] };

        const clientsDb = await db.collection('clients')
            .find(rgpdQuery, { projection: { email: 1 } })
            .toArray();
        const rgpdOptOutSet = new Set(
            clientsDb.map(c => c.email ? c.email.toLowerCase().trim() : '').filter(Boolean)
        );

        console.log(`[send-group] commerce_id=${commerceId} isPinnedList=${isPinnedList} rgpdOptOutCount=${rgpdOptOutSet.size}`);

        // 2. Déterminer la liste de base des clients
        let rawClients = isPinnedList ? clients : [];
        if (rawClients.length === 0) {
            // Si pas de liste passée, récupérer tous les clients de la boutique
            const dbAnalyses = await db.collection('analyses_ia').find({ commerce_id: commerceId }).toArray();
            rawClients = dbAnalyses.map(c => ({
                email: c.email || c.client_db_id,
                nom: c.nom || c.email || c.client_db_id,
                segment: c.segment_gmm || 'group'
            }));
        }

        console.log(`[send-group] rawClients count=${rawClients.length}`, rawClients.map(c => c.email));

        // 3. Exclure les clients ayant désactivé le ciblage (RGPD)
        let filteredClientsList = rawClients.filter(c => {
            const email = (c.email || '').toLowerCase().trim();
            if (!email) return false;
            const blocked = rgpdOptOutSet.has(email);
            if (blocked) console.log(`[send-group] RGPD block: ${email}`);
            return !blocked;
        });

        console.log(`[send-group] after RGPD filter count=${filteredClientsList.length}`);

        // 4. Appliquer les filtres de ciblage supplémentaires s'ils sont fournis
        if (filters) {
            const { onlyBaisse, onlyAmbassadors, segment_gmm, close_to_palier } = filters;

            const dbAnalyses = await db.collection('analyses_ia').find({ commerce_id: commerceId }).toArray();
            const clientStatsMap = {};
            dbAnalyses.forEach(c => {
                if (c.email) clientStatsMap[c.email.toLowerCase().trim()] = c;
            });

            let closeEmails = new Set();
            if (close_to_palier) {
                const loyaltyDocs = await db.collection('points_fidelite').find({
                    commerce_id: commerceId,
                    $or: [
                        { points_cumules: { $gte: 80, $lt: 100 } },
                        { points_cumules: { $gte: 180, $lt: 200 } }
                    ]
                }).toArray();
                closeEmails = new Set(
                    loyaltyDocs
                        .map(d => (d.client_email || d.email || '').toLowerCase().trim())
                        .filter(Boolean)
                );
            }

            filteredClientsList = filteredClientsList.filter(c => {
                const emailLower = c.email ? c.email.toLowerCase().trim() : '';
                const stats = clientStatsMap[emailLower];
                if (!stats) {
                    console.log(`[send-group] no stats found for ${emailLower} — skipping`);
                    return false;
                }

                if (onlyBaisse && stats.baisse_frequence_detectee !== true) return false;
                if (segment_gmm && segment_gmm !== 'all' && stats.segment_gmm !== segment_gmm) return false;
                if (close_to_palier && !closeEmails.has(emailLower)) return false;

                if (onlyAmbassadors) {
                    const scoreInfluence = stats.influence_score !== undefined
                        ? stats.influence_score
                        : Math.round(((stats.score_global_sa || 0) * 0.7 + (1.0 - (stats.churn_score || 0)) * 0.3) * 100);
                    if (scoreInfluence < 80) return false;
                }
                return true;
            });
        }

        if (filteredClientsList.length === 0) {
            console.log(`[send-group] ❌ Liste vide après filtrage. commerce_id=${commerceId}`);
            // Journaliser les tentatives échouées pour qu'elles apparaissent dans l'historique
            const sentAt = new Date().toISOString();
            const batchId = generateBatchId('GRP');
            if (rawClients.length > 0) {
                const failedDocs = rawClients.map(c => ({
                    commerce_id: commerceId,
                    client_email: (c.email || '').toLowerCase().trim(),
                    client_nom: c.nom || c.email || 'Client',
                    segment: c.segment || 'group',
                    subject,
                    body,
                    sent_at: sentAt,
                    status: 'failed_rgpd',
                    tracking_id: generateTrackingId(),
                    campaign_batch_id: batchId,
                    opened: false,
                    open_count: 0
                }));
                try {
                    await db.collection('campagnes_envoyees').insertMany(failedDocs);
                    clearStatsCache();
                } catch (e) {
                    console.error('[send-group] Impossible de journaliser les tentatives échouées :', e.message);
                }
            }
            // Retourner un vrai statut d'erreur pour que le frontend l'affiche correctement
            return res.status(422).json({
                status: 'error',
                error: isPinnedList
                    ? `Aucun des ${rawClients.length} client(s) épinglé(s) n'a pu être contacté (vérifier RGPD ou e-mail).`
                    : "Aucun client ne correspond aux critères de filtrage ou tous se sont désabonnés (RGPD)."
            });
        }


        const sentAt = new Date().toISOString();
        const campaignsToInsert = [];
        const batchId = generateBatchId('GRP');

        // Envoi parallèle
        const sendPromises = filteredClientsList.map(async (client) => {
            const finalSubject = subject.replace(/{nom}/g, client.nom || client.email);
            const finalBody = body.replace(/{nom}/g, client.nom || client.email);
            const trackingId = generateTrackingId();
            const normalizedEmail = (client.email || '').toLowerCase().trim();

            let status = 'simulated_batch';
            try {
                const emailResult = await sendEmail({
                    to: normalizedEmail,
                    subject: finalSubject,
                    text: finalBody,
                    trackingId
                });
                status = emailResult.status === 'sent' ? 'sent_batch' : 'simulated_batch';
            } catch (err) {
                console.error(`❌ Échec de l'envoi d'e-mail groupé à ${normalizedEmail} :`, err.message);
                status = 'failed_batch';
            }

            campaignsToInsert.push({
                commerce_id: commerceId,
                client_email: normalizedEmail,
                client_nom: client.nom || client.email,
                segment: client.segment || 'group',
                subject: finalSubject,
                body: finalBody,
                sent_at: sentAt,
                status: status,
                tracking_id: trackingId,
                campaign_batch_id: batchId,
                opened: false,
                open_count: 0
            });
        });

        await Promise.all(sendPromises);

        if (campaignsToInsert.length > 0) {
            await db.collection('campagnes_envoyees').insertMany(campaignsToInsert);
            clearStatsCache();
        }

        const sentCount = campaignsToInsert.filter(c => c.status === 'sent_batch').length;
        const msg = sentCount > 0
            ? `${sentCount} e-mails groupés envoyés avec succès (et ${campaignsToInsert.length - sentCount} simulés/échoués).`
            : `${campaignsToInsert.length} e-mails groupés simulés avec succès !`;

        return res.json({
            status: 'success',
            message: msg
        });
    } catch (err) {
        console.error('❌ sendGroupCampaign error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/campaigns/trigger-automation
// Automatisation IA : Analyse tous les clients et génère des e-mails hyper-personnalisés
// selon les probabilités GMM exactes de chacun.
// ============================================================
// Fonction interne d'automatisation intelligente réutilisable par le planificateur de tâches
const runSmartAutomationInternal = async (commerceId) => {
    const db = await connectDB();

    // 1. Récupérer tous les clients de ce commerce
    const clients = await db.collection('analyses_ia')
        .find({ commerce_id: commerceId })
        .toArray();

    if (!clients || clients.length === 0) {
        return { status: 'info', message: 'Aucun client à analyser.', stats: {} };
    }

    const sentAt = new Date().toISOString();
    const campaignsToInsert = [];
    const stats = { ambassador_invite: 0, birthday_gift: 0, vip_danger: 0, vip: 0, regular: 0, baisse_frequence: 0, absence_anormale: 0, at_risk: 0, lost: 0, skipped_cooldown: 0 };

    // 2. Déterminer la durée de cooldown au niveau MARQUE
    // (tous les points de vente de la même marque partagent le même réglage)
    let cooldownDays = 30;
    let cooldownResetAt = null; // Date de la dernière réinitialisation manuelle du cooldown
    let commerceSettings = null; // Paramètres complets du commerce (absence_multiplier, templates, etc.)
    try {
        const brandId = commerceId.replace(/_\d+$/, ''); // ex: commerce_local_1 → commerce_local
        commerceSettings = await db.collection('commerces_settings').findOne({ commerce_id: commerceId })
            || await db.collection('commerces_settings').findOne({ brand_id: brandId });
        if (commerceSettings && commerceSettings.cooldown_days !== undefined) {
            cooldownDays = parseFloat(commerceSettings.cooldown_days) || 30;
        }
        // Récupérer la date de réinitialisation manuelle si elle existe
        if (commerceSettings && commerceSettings.cooldown_reset_at) {
            cooldownResetAt = new Date(commerceSettings.cooldown_reset_at);
        }
        console.log(`[SmartAutomation] Cooldown marque "${brandId}" : ${cooldownDays} jours${cooldownResetAt ? ` | Réinitialisé le ${cooldownResetAt.toLocaleString('fr-FR')}` : ''}`);
    } catch (err) {
        console.warn(`[SmartAutomation] Impossible de lire les paramètres de cooldown, défaut 30j:`, err.message);
    }

    // ── GARDE : Arrêt d'urgence global SmartAutomation ──
    // Si le commerçant a désactivé le SmartAutomation depuis la page Paramètres Avancés,
    // on interrompt immédiatement sans traiter aucun client.
    if (commerceSettings && commerceSettings.smart_automation_enabled === false) {
        console.log(`⛔ [SmartAutomation] Désactivé via Paramètres Avancés pour "${commerceId}" — aucun envoi effectué.`);
        return { status: 'skip', message: 'SmartAutomation désactivé via Paramètres Avancés.', stats: {} };
    }

    // ── Configuration dynamique des règles (ordre + activation) ──
    // Ordre par défaut (si non configuré) : Ambassadeur → Anniversaire → Absence → VIP danger → ...
    const DEFAULT_RULE_ORDER = [
        'ambassador_invite', 'birthday_gift', 'absence_anormale',
        'vip_danger', 'vip_fidelisation', 'vip_pur',
        'perdu_critique', 'perdu_standard',
        'at_risk_churn', 'at_risk_standard',
        'baisse_frequence', 'regular'
    ];
    // Map id → { enabled, priority } depuis la config DB, ou defaults (tous enabled, ordre par défaut)
    const rulesConfig = {};
    const savedRules = (commerceSettings && Array.isArray(commerceSettings.automation_rules))
        ? commerceSettings.automation_rules
        : DEFAULT_RULE_ORDER.map((id, idx) => ({ id, enabled: true, priority: idx }));
    savedRules.forEach(r => { rulesConfig[r.id] = { enabled: r.enabled !== false, priority: r.priority ?? 99 }; });
    const isRuleEnabled = (id) => rulesConfig[id] ? rulesConfig[id].enabled !== false : true;

    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const cooldownWindowStart = new Date(Date.now() - cooldownMs);

    // Si une réinitialisation manuelle a eu lieu APRÈS la fenêtre de cooldown calculée,
    // on utilise la date de reset comme borne inférieure (les emails avant le reset sont ignorés
    // dans le calcul du cooldown, mais restent intacts dans la base).
    const effectiveCooldownStart = (cooldownResetAt && cooldownResetAt > cooldownWindowStart)
        ? cooldownResetAt
        : cooldownWindowStart;

    // Récupérer les campagnes envoyées depuis la borne effective pour le cooldown anti-spam
    // EXCLUSION INTENTIONNELLE : birthday_gift, ambassador_invite et absence_anormale ne comptent PAS dans ce cooldown
    const recentCampaigns = await db.collection('campagnes_envoyees')
        .find({
            commerce_id: commerceId,
            sent_at: { $gte: effectiveCooldownStart.toISOString() },
            category: { $nin: ['birthday_gift', 'ambassador_invite', 'absence_anormale'] } // ces catégories ont leur propre anti-doublon
        })
        .toArray();

    // Map email -> date du dernier envoi de campagne promotionnelle/automatique
    const lastSentMap = {};
    recentCampaigns.forEach(c => {
        const email = c.client_email;
        if (email) {
            const sentDate = new Date(c.sent_at);
            if (!lastSentMap[email] || sentDate > lastSentMap[email]) {
                lastSentMap[email] = sentDate;
            }
        }
    });

    // 2b. RGPD : récupérer les clients ayant désactivé le ciblage marketing
    const rgpdClients = await db.collection('clients')
        .find({
            commerce_id: commerceId,
            $or: [
                { rgpd_opt_out: true },
                { rgpd_opt_out_marketing: true }
            ]
        }, { projection: { email: 1 } })
        .toArray();
    const rgpdOptOutSet = new Set(rgpdClients.map(c => c.email ? c.email.toLowerCase() : '').filter(Boolean));

    // 3. Récupérer les cadeaux d'anniversaire envoyés ces 300 derniers jours (anti-doublon d'anniversaire)
    const threeHundredDaysAgo = new Date();
    threeHundredDaysAgo.setDate(threeHundredDaysAgo.getDate() - 300);
    const recentBirthdays = await db.collection('campagnes_envoyees')
        .find({
            commerce_id: commerceId,
            category: 'birthday_gift',
            sent_at: { $gte: threeHundredDaysAgo.toISOString() }
        })
        .toArray();

    const birthdaySentEmails = new Set(recentBirthdays.map(c => c.client_email).filter(Boolean));

    // Récupérer les invitations ambassadeur déjà envoyées (anti-doublon à vie)
    const recentAmbassadorInvites = await db.collection('campagnes_envoyees')
        .find({ commerce_id: commerceId, category: 'ambassador_invite' })
        .toArray();
    const ambassadorInvitedEmails = new Set(recentAmbassadorInvites.map(c => c.client_email).filter(Boolean));

    // Récupérer les relances d'absence anormale envoyées ces 14 derniers jours (anti-doublon d'absence anormale)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentAbsenceCampaigns = await db.collection('campagnes_envoyees')
        .find({
            commerce_id: commerceId,
            category: 'absence_anormale',
            sent_at: { $gte: fourteenDaysAgo.toISOString() }
        })
        .toArray();
    const absenceSentEmails = new Set(recentAbsenceCampaigns.map(c => (c.client_email || '').toLowerCase().trim()).filter(Boolean));

    // Calcul de la date de demain pour l'anniversaire à J-1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getUTCDate();
    const tomorrowMonth = tomorrow.getUTCMonth();

    // ============================================================
    // 🧪 FILTRE MODE TEST : si cooldown ≤ 0.01j, limiter aux emails de test
    // En mode production (7j/14j/21j/30j), tous les clients sont traités.
    // ============================================================
    const isTestMode = cooldownDays <= TEST_MODE_THRESHOLD_DAYS;
    let clientsToProcess = clients;

    if (isTestMode) {
        const testEmailsSet = new Set(TEST_MODE_EMAILS.map(e => e.toLowerCase()));
        const allEligible = clients.filter(c => (c.email || c.client_db_id));
        clientsToProcess = allEligible.filter(c => {
            const email = (c.email || c.client_db_id || '').toLowerCase();
            return testEmailsSet.has(email);
        });
        const skippedCount = allEligible.length - clientsToProcess.length;
        console.log(`🧪 [TEST MODE] Filtrage actif : envoi limité à ${clientsToProcess.length} client(s) de test (${TEST_MODE_EMAILS.join(', ')}) — ${skippedCount} autres clients éligibles ignorés pour ce cycle.`);

        if (clientsToProcess.length === 0) {
            console.warn(`🧪 [TEST MODE] Aucun client de test trouvé dans commerce "${commerceId}" — vérifiez que l'email est bien dans la base et la collection analyses_ia.`);
            return { status: 'info', message: 'Mode test : aucun client de test trouvé dans ce commerce.', stats };
        }
    } else {
        console.log(`⚙️ [PRODUCTION MODE] Traitement de ${clients.length} clients (cooldown: ${cooldownDays}j) — filtre test désactivé.`);
    }

    for (const client of clientsToProcess) {
        const clientEmail = client.email || client.client_db_id;
        if (!clientEmail) continue;

        // --- GARDE RGPD : exclure les clients ayant désactivé le ciblage marketing ---
        // NOTE : les e-mails transactionnels (confirmation commande, crédit points) ne passent
        // pas par cet automatiseur et ne sont donc pas affectés par ce garde.
        if (rgpdOptOutSet.has(clientEmail.toLowerCase())) continue;

        // --- GARDE HEURES D'ENVOI : respecter la plage horaire configurée par le commerçant ---
        // Géré au niveau individuel de chaque email (flexible par boutique / fuseau horaire).
        if (commerceSettings && commerceSettings.send_hours_enabled === true) {
            const nowHour = new Date().getHours();
            const startH = commerceSettings.send_hour_start ?? 0;
            const endH   = commerceSettings.send_hour_end   ?? 23;
            const inWindow = startH <= endH
                ? (nowHour >= startH && nowHour <= endH)
                : (nowHour >= startH || nowHour <= endH); // gestion du cas 22h → 6h (nuit)
            if (!inWindow) {
                console.log(`⏰ [SmartAutomation] Hors plage d'envoi (${startH}h-${endH}h, heure courante: ${nowHour}h) — skip pour ${clientEmail}`);
                stats.skipped_cooldown++;
                continue;
            }
        }

        const nomClient = client.nom || clientEmail || 'Client';
        const churnScore = client.churn_score || 0;
        const churnRiskLabel = client.churn_risk_label || 'Faible';

        // --- REGLE 1 : ANNIVERSAIRE (J-1) ---
        let isBirthdayTomorrow = false;
        if (client.date_naissance) {
            const birthDate = new Date(client.date_naissance);
            if (birthDate.getUTCDate() === tomorrowDay && birthDate.getUTCMonth() === tomorrowMonth) {
                isBirthdayTomorrow = true;
            }
        }

        let campaignToSend = null;

        // --- REGLE 0 : AMBASSADEUR (Score Influence >= 80 & jamais invité) ---
        const scoreInfluence = client.influence_score !== undefined
            ? client.influence_score
            : Math.round(((client.score_global_sa || 0) * 0.7 + (1.0 - (client.churn_score || 0)) * 0.3) * 100);

        if (isRuleEnabled('ambassador_invite') && scoreInfluence >= 80 && !ambassadorInvitedEmails.has(clientEmail)) {
            const refCode = client.referral_code || `REF-${(nomClient).toUpperCase().replace(/\s+/g, '-').substring(0, 10)}-PARRAIN`;
            const finalSubject = `${nomClient}, l'IA Retenza vous a sélectionné(e) comme Ambassadeur officiel ! 👑`;
            const finalBody = `Bonjour ${nomClient},\n\nNous sommes ravis de vous compter parmi nos meilleurs clients et nous souhaitons vous en remercier d'une façon toute particulière.\n\nGrâce à votre fidélité exceptionnelle, l'IA de Retenza vous a sélectionné(e) comme l'un de nos Ambassadeurs officiels !\n\n🎯 Votre code de parrainage exclusif : ${refCode}\n\nComment ça marche ?\n1. Partagez ce code à vos amis et votre entourage.\n2. Pour chaque ami qui vient acheter chez nous avec votre code, vous gagnez des récompenses :\n   - 1er parrainage → -10% sur votre prochain achat (code: PARRAIN10)\n   - 3 parrainages  → -20% sur votre prochain achat (code: PARRAIN20)\n   - 5 parrainages  → Statut VIP + avantages exclusifs (code: VIPAMBASSADEUR)\n\nMerci pour votre confiance et votre fidélité.\n\nL'équipe Retenza 💛`;

            campaignToSend = {
                subject: finalSubject,
                body: finalBody,
                category: 'ambassador_invite'
            };
            stats.ambassador_invite++;
            console.log(`🤖 [AUTO IA] 👑 AMBASSADEUR détecté : Invitation parrainage envoyée à ${nomClient} (${clientEmail}) — Score: ${scoreInfluence}%`);
        }

        if (campaignToSend) {
            // Envoi immédiat pour l'invitation ambassadeur (court-circuit du cooldown)
            let status = 'simulated_auto';
            try {
                const emailResult = await sendEmail({ to: clientEmail, subject: campaignToSend.subject, text: campaignToSend.body });
                status = emailResult.status === 'sent' ? 'sent_auto' : 'simulated_auto';
            } catch (err) {
                console.error(`❌ Échec invitation ambassadeur à ${clientEmail} :`, err.message);
                status = 'failed_auto';
            }
            campaignsToInsert.push({
                commerce_id: commerceId, client_email: clientEmail, client_nom: nomClient,
                segment: client.segment_gmm || 'vip', churn_score: churnScore,
                churn_risk_label: churnRiskLabel, subject: campaignToSend.subject,
                body: campaignToSend.body, sent_at: sentAt, status, category: 'ambassador_invite',
                influence_score: scoreInfluence, referral_code: client.referral_code || ''
            });
            continue; // Ne pas envoyer d'autre email ce cycle à cet ambassadeur
        }

        // --- REGLE 1 : ANNIVERSAIRE (J-1) ---
        if (isRuleEnabled('birthday_gift') && isBirthdayTomorrow) {
            if (!birthdaySentEmails.has(clientEmail)) {
                const finalSubject = `🎂 Joyeux Anniversaire, ${nomClient} ! Un cadeau spécial pour vous 🎁`;
                const finalBody = `Bonjour ${nomClient},\n\nToute l'équipe de Retenza vous souhaite un merveilleux anniversaire !\n\nPour célébrer ce jour spécial et vous remercier de votre fidélité, voici une réduction exceptionnelle de 20% sur votre prochain achat avec le code : CADEAU20.\n\nProfitez-en bien !\n\nL'équipe Retenza`;
                campaignToSend = { subject: finalSubject, body: finalBody, category: 'birthday_gift' };
                stats.birthday_gift++;
                console.log(`🤖 [AUTO IA] Anniversaire fêté à J-1 pour ${nomClient} (${clientEmail})`);
            } else {
                console.log(`🤖 [AUTO IA] Anniversaire déjà fêté récemment pour ${nomClient} (${clientEmail}) - Ignoré`);
            }
        }

        // --- REGLE 1.5 : ABSENCE ANORMALE (Bypass Cooldown 30j — anti-doublon propre 14j) ---
        // Détecte une absence physique anormale chez un client régulier et déclenche l'envoi
        // IMMÉDIATEMENT sans être bloqué par le cooldown promotionnel classique de 30j.
        if (
            isRuleEnabled('absence_anormale') &&
            !campaignToSend &&
            (client.segment_gmm === 'regular' || !client.segment_gmm) &&
            client.baisse_frequence_detectee !== true &&
            !absenceSentEmails.has(clientEmail.toLowerCase().trim())
        ) {
            let absenceResult = null;
            try {
                absenceResult = await detectAbnormalAbsence(clientEmail, commerceId, db, commerceSettings);
            } catch (absErr) {
                console.error(`[Règle 1.5] Erreur détection absence pour ${clientEmail}:`, absErr.message);
            }

            if (absenceResult && absenceResult.detected) {
                const absenceTemplate = commerceSettings?.absence_template || '';
                const reduction = commerceSettings?.absence_reduction || 20;
                const heureLimite = commerceSettings?.absence_heure_limite || '18h';
                const produitHabituel = absenceResult.topProduct || null;
                const panierMoyen = absenceResult.avgBasket ? `${absenceResult.avgBasket} DT` : null;

                let messageBody = '';
                if (absenceTemplate) {
                    messageBody = absenceTemplate
                        .replace(/\{nom_client\}/g, nomClient)
                        .replace(/\{produit_habituel\}/g, produitHabituel || (panierMoyen ? `votre panier habituel (${panierMoyen})` : 'votre habituel'))
                        .replace(/\{reduction\}/g, reduction)
                        .replace(/\{heure_limite\}/g, heureLimite)
                        .replace(/\{panier_moyen\}/g, panierMoyen || '');
                } else if (produitHabituel) {
                    messageBody = `Bonjour ${nomClient},\n\nOn a gardé ${produitHabituel} au chaud pour vous ! 🛒\n\n` +
                        `Nous avons remarqué que vous n'êtes pas passé(e) depuis ${Math.round(absenceResult.daysSinceLast)} jours — c'est inhabituel pour vous !\n\n` +
                        `Pour vous accueillir à nouveau, voici une remise de ${reduction}% sur votre prochain achat si vous passez avant ${heureLimite} aujourd'hui.\n\n` +
                        `Utilisez le code : RETOUR${reduction}\n\nNous avons hâte de vous revoir !\n\nL'équipe Retenza 💛`;
                } else {
                    const panierStr = panierMoyen ? ` (votre panier habituel : ${panierMoyen})` : '';
                    messageBody = `Bonjour ${nomClient},\n\nVotre visite nous manque ! 🛒\n\n` +
                        `Nous avons remarqué que vous n'êtes pas passé(e) depuis ${Math.round(absenceResult.daysSinceLast)} jours — c'est plus long que votre rythme habituel${panierStr}.\n\n` +
                        `Pour marquer votre retour, profitez de ${reduction}% de remise si vous passez avant ${heureLimite} aujourd'hui.\n\n` +
                        `Utilisez le code : RETOUR${reduction}\n\nNous espérons vous revoir très vite !\n\nL'équipe Retenza 💛`;
                }

                campaignToSend = {
                    subject: `${nomClient}, on vous a gardé votre habituel au chaud 🛒 — ${reduction}% aujourd'hui !`,
                    body: messageBody,
                    category: 'absence_anormale'
                };
                stats.absence_anormale++;
                console.log(
                    `🤖 [AUTO IA] 🛒 ABSENCE ANORMALE (Bypass Cooldown 30j ✅) : ${nomClient} (${clientEmail}) — ` +
                    `absent depuis ${absenceResult.daysSinceLast}j (seuil: ${absenceResult.threshold}j, ` +
                    `intervalle moyen: ${absenceResult.avgInterval}j)` +
                    (produitHabituel ? ` | Produit habituel: ${produitHabituel}` : ' | Sans produit trackable')
                );
            }
        }

        // Si une campagne prioritaire (anniversaire ou absence anormale) est prête → envoi immédiat
        if (campaignToSend && (campaignToSend.category === 'birthday_gift' || campaignToSend.category === 'absence_anormale')) {
            let status = 'simulated_auto';
            try {
                const emailResult = await sendEmail({
                    to: clientEmail,
                    subject: campaignToSend.subject,
                    text: campaignToSend.body
                });
                status = emailResult.status === 'sent' ? 'sent_auto' : 'simulated_auto';
            } catch (err) {
                console.error(`❌ Échec envoi prioritaire IA à ${clientEmail}:`, err.message);
                status = 'failed_auto';
            }
            campaignsToInsert.push({
                commerce_id: commerceId,
                client_email: clientEmail,
                client_nom: nomClient,
                segment: client.segment_gmm || 'unknown',
                churn_score: churnScore,
                churn_risk_label: churnRiskLabel,
                subject: campaignToSend.subject,
                body: campaignToSend.body,
                sent_at: sentAt,
                status: status,
                category: campaignToSend.category
            });
            console.log(`🤖 [AUTO IA] Décision prioritaire: ${campaignToSend.category.toUpperCase()} | Statut: ${status} → ${nomClient}`);
            continue; // Passer au client suivant sans appliquer le cooldown général
        }


        // --- REGLE 3 : DÉCISIONS IA COMBINÉES (GMM + XGBOOST CHURN) ---
        let probs = client.probabilities_gmm;
        if (Array.isArray(probs)) probs = probs[0] || probs;

        if (!probs || typeof probs !== 'object') continue; // Passer si pas de GMM

        const pVip = probs['vip'] || 0;
        const pRisk = (probs['at_risk'] || 0) + (probs['lost'] || 0);
        const pLost = probs['lost'] || 0;

        // Score Churn XGBoost (0.0 → 1.0) — complément décisionnel du GMM
        const isHighChurn = churnScore >= 0.55;   // Risque Moyen → Critique
        const isCriticalChurn = churnScore >= 0.75;  // Risque Critique uniquement

        let finalSubject = '';
        let finalBody = '';
        let category = '';

        // Règle 1 : VIP + Churn Critique → Rétention urgente prioritaire
        if (isRuleEnabled('vip_danger') && pVip > 0.5 && isCriticalChurn) {
            finalSubject = `${nomClient}, nous ne voulons pas vous perdre ! Offre VIP exclusive 🚨`;
            finalBody = `Bonjour ${nomClient},\n\nNous avons remarqué que vous vous faisiez rare, et cela nous préoccupe sincèrement.\n\nEn tant que client VIP, vous méritez une attention toute particulière. Voici une remise exceptionnelle de 35% sur votre prochain achat : VIPSAVE35.\n\nNous espérons vous revoir très bientôt !\n\nL'équipe Retenza`;
            category = 'vip_danger';
        }
        // Règle 2 : VIP + Churn Élevé/Moyen → Offre de fidélisation VIP
        else if (isRuleEnabled('vip_fidelisation') && pVip > 0.25 && pRisk > 0.25) {
            finalSubject = `Une offre exceptionnelle pour vous retenir, ${nomClient}`;
            finalBody = `Bonjour ${nomClient},\n\nVous êtes l'un de nos clients les plus précieux, mais nous avons remarqué que vous vous faisiez rare !\n\nPour vous remercier de votre fidélité historique, voici une remise exceptionnelle de 30% : VIPRETOUR30.\n\nÀ très vite !`;
            category = 'vip_danger';
        }
        // Règle 3 : VIP pur + Churn Faible → Message fidélisation premium
        else if (isRuleEnabled('vip_pur') && pVip > 0.6) {
            finalSubject = `Merci pour votre fidélité incroyable, ${nomClient} !`;
            finalBody = `Bonjour ${nomClient},\n\nEn tant que client VIP majeur, nous vous offrons un accès en avant-première à nos nouvelles collections. Merci pour votre confiance absolue !\n\nL'équipe Retenza`;
            category = 'vip';
        }
        // Règle 4 : Perdu + Churn Critique → Reconquête urgente
        else if (isRuleEnabled('perdu_critique') && pLost > 0.5 && isCriticalChurn) {
            finalSubject = `${nomClient}, une dernière offre pour votre retour 💔`;
            finalBody = `Bonjour ${nomClient},\n\nCela fait longtemps que nous ne vous avons pas vu ! Nous avons préparé une offre spéciale de reconquête rien que pour vous : 30% de remise avec le code RETOUR30.\n\nCette offre est valable 7 jours. Ne la manquez pas !`;
            category = 'lost';
        }
        // Règle 5 : Perdu standard
        else if (isRuleEnabled('perdu_standard') && pLost > 0.5) {
            finalSubject = `Une offre spéciale pour votre retour, ${nomClient}`;
            finalBody = `Bonjour ${nomClient},\n\nNous espérons que tout va bien ! Pour marquer votre retour parmi nous, bénéficiez d'une remise de 25% avec le code : RETOUR25.`;
            category = 'lost';
        }
        // Règle 6 : À risque + Churn Élevé → Action préventive reinforced
        else if (isRuleEnabled('at_risk_churn') && pRisk > 0.4 && isHighChurn) {
            finalSubject = `${nomClient}, nous pensons à vous — une offre exclusive vous attend`;
            finalBody = `Bonjour ${nomClient},\n\nNotre équipe a détecté que vous n'avez pas commandé depuis un moment. Pour vous remercier de votre confiance, voici une remise de 20% sur votre prochain achat : REACTIVATION20.\n\nNous comptons sur votre retour !`;
            category = 'at_risk';
        }
        // Règle 7 : À risque standard → Sondage + petite remise
        else if (isRuleEnabled('at_risk_standard') && pRisk > 0.4) {
            finalSubject = `Votre avis compte pour nous, ${nomClient}`;
            finalBody = `Bonjour ${nomClient},\n\nAuriez-vous 2 minutes pour nous donner votre avis ? En retour, recevez un bon de réduction de 10%.`;
            category = 'at_risk';
        }
        // Règle 8 : Régulier + Churn Moyen → Encouragement proactif
        else if (isRuleEnabled('at_risk_churn') && isHighChurn) {
            finalSubject = `Nos meilleures offres vous attendent, ${nomClient} !`;
            finalBody = `Bonjour ${nomClient},\n\nNe laissez pas passer nos nouvelles promotions ! Profitez de 15% de réduction sur votre prochain achat avec le code : PROMO15.\n\nOffre valable cette semaine seulement.`;
            category = 'regular';
        }
        // Règle 8.5 : Baisse de Fréquence détectée (Δ < -25%) — client encore "regular" par GMM
        else if (isRuleEnabled('baisse_frequence') && client.baisse_frequence_detectee === true && client.segment_gmm === 'regular') {
            const deltaPct = client.delta_frequence ? Math.round(Math.abs(client.delta_frequence) * 100) : 25;
            finalSubject = `${nomClient}, on vous a remarqué 👀 — une offre pour vous fidéliser`;
            finalBody = `Bonjour ${nomClient},\n\nNous avons remarqué que vos achats ont baissé de ${deltaPct}% ce dernier mois. Nous ne voulons pas vous perdre !\n\nPour vous remercier de votre fidélité passée, voici une remise de 15% sur votre prochain achat avec le code : FIDELITE15.\n\nCette offre est valable 14 jours. N'hésitez pas à en profiter !\n\nL'équipe Retenza 💛`;
            category = 'baisse_frequence';
            console.log(`🤖 [AUTO IA] 📉 BAISSE FRÉQUENCE détectée : Δ=-${deltaPct}% pour ${nomClient} (${clientEmail}) — segment GMM: ${client.segment_gmm}`);
        }
        // Règle 9 : Régulier fidèle → Newsletter et nouveautés
        else if (isRuleEnabled('regular')) {
            finalSubject = `Nos nouveautés vous attendent, ${nomClient} !`;
            finalBody = `Bonjour ${nomClient},\n\nDe nouveaux produits viennent d'arriver ! Venez découvrir notre sélection qui pourrait vous plaire.`;
            category = 'regular';
        }

        // Assigner la campagne issue des règles post-cooldown (Règles 1 à 9)
        if (finalSubject && category) {
            stats[category] = (stats[category] || 0) + 1;
            campaignToSend = {
                subject: finalSubject,
                body: finalBody,
                category: category
            };
        }

        if (campaignToSend) {
            let status = 'simulated_auto';
            try {
                const emailResult = await sendEmail({
                    to: clientEmail,
                    subject: campaignToSend.subject,
                    text: campaignToSend.body
                });
                status = emailResult.status === 'sent' ? 'sent_auto' : 'simulated_auto';
            } catch (err) {
                console.error(`❌ Échec de l'envoi d'e-mail automatique IA à ${clientEmail} :`, err.message);
                status = 'failed_auto';
            }

            campaignsToInsert.push({
                commerce_id: commerceId,
                client_email: clientEmail,
                client_nom: nomClient,
                segment: client.segment_gmm || 'unknown',
                churn_score: churnScore,
                churn_risk_label: churnRiskLabel,
                subject: campaignToSend.subject,
                body: campaignToSend.body,
                sent_at: sentAt,
                status: status,
                category: campaignToSend.category
            });

            console.log(`🤖 [AUTO IA] Décision: ${campaignToSend.category.toUpperCase()} | GMM: ${client.segment_gmm} | Churn: ${churnRiskLabel} (${(churnScore * 100).toFixed(0)}%) | Statut: ${status} → ${nomClient}`);
        }

        // Délai de 50ms entre chaque envoi pour soulager le serveur SMTP
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 5. Sauvegarder massivement
    if (campaignsToInsert.length > 0) {
        await db.collection('campagnes_envoyees').insertMany(campaignsToInsert);
    }

    return {
        status: 'success',
        message: `Automatisation IA terminée. ${campaignsToInsert.length} e-mails générés sur-mesure !`,
        stats
    };
};

// État en mémoire de la dernière automatisation (pour le polling)
const automationStatus = {
    running: false,
    lastResult: null,
    lastError: null,
    startedAt: null,
    commerceId: null
};

// GET /api/campaigns/automation-status — Polling du statut de l'automatisation en cours
const getAutomationStatus = (req, res) => {
    return res.json({
        status: 'success',
        running: automationStatus.running,
        startedAt: automationStatus.startedAt,
        result: automationStatus.lastResult,
        error: automationStatus.lastError
    });
};

const triggerSmartAutomation = async (req, res) => {
    const commerceId = req.body.commerce_id || COMMERCE_ID;

    // Si une automatisation tourne déjà, on refuse
    if (automationStatus.running) {
        return res.status(409).json({
            status: 'busy',
            message: 'Une automatisation est déjà en cours. Veuillez patienter.',
            startedAt: automationStatus.startedAt
        });
    }

    // Répondre IMMÉDIATEMENT au client — le bouton se débloque tout de suite
    automationStatus.running = true;
    automationStatus.lastResult = null;
    automationStatus.lastError = null;
    automationStatus.startedAt = new Date().toISOString();
    automationStatus.commerceId = commerceId;

    res.status(202).json({
        status: 'started',
        message: 'Automatisation IA lancée en arrière-plan. Vérifiez le statut dans quelques instants.',
        startedAt: automationStatus.startedAt
    });

    // Exécuter l'automatisation EN ARRIÈRE-PLAN (après réponse HTTP)
    runSmartAutomationInternal(commerceId)
        .then(result => {
            automationStatus.running = false;
            automationStatus.lastResult = result;
            console.log(`✅ [AUTO IA] Terminé : ${result.message}`);
        })
        .catch(err => {
            automationStatus.running = false;
            automationStatus.lastError = err.message;
            console.error('❌ triggerSmartAutomation background error :', err.message);
        });
};

// ============================================================
// GET /api/commerces
// Retourne la liste de tous les commerce_id disponibles dans la base.
// ============================================================
const getCommerces = async (req, res) => {
    try {
        const db = await connectDB();

        // Récupérer tous les commerce_id distincts depuis la collection clients
        const allCommerceIds = await db.collection('clients').distinct('commerce_id');
        const commerceIds = req.auth?.role === 'super_admin'
            ? allCommerceIds
            : allCommerceIds.filter(id => req.auth?.commerceIds?.includes(id));

        const commerceLabels = {
            'commerce_local': 'Boutique Nabeul',
            'commerce_local_1': 'Boutique Tunis',
            'commerce_local_2': 'Boutique Sousse'
        };

        // Placer commerce_local_1 en premier, puis trier par nombre de transactions
        const counts = await Promise.all(commerceIds.map(async id => {
            const count = await db.collection('transactions').countDocuments({ commerce_id: id });
            return { id, count };
        }));
        counts.sort((a, b) => {
            if (a.id === 'commerce_local_1') return -1;
            if (b.id === 'commerce_local_1') return 1;
            return b.count - a.count;
        });

        const commerces = counts.map(({ id }) => {
            let label = commerceLabels[id];
            if (!label) {
                label = 'Boutique ' + id.replace('commerce_', '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
            }
            return { id, label };
        });

        return res.json(commerces);
    } catch (err) {
        console.error('❌ getCommerces error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// Comparateur Global de Boutiques
// ============================================================
// ============================================================
const getGlobalComparison = async (req, res) => {
    try {
        const db = await connectDB();

        // Noms lisibles des commerces
        const commerceLabels = {
            'commerce_local': 'Nabeul',
            'commerce_local_1': 'Tunis',
            'commerce_local_2': 'Sousse'
        };

        // Agrégation complète par commerce_id depuis analyses_ia
        const stats = await db.collection('analyses_ia').aggregate([
            {
                $group: {
                    _id: '$commerce_id',
                    nb_clients: { $sum: 1 },
                    ca_total: { $sum: '$monetary_total' },
                    panier_moyen: { $avg: '$monetary' },
                    churn_moyen: { $avg: '$churn_score' },
                    recence_moyenne: { $avg: '$recency' },
                    freq_moyenne: { $avg: '$frequency' },
                    score_sa_moyen: { $avg: '$score_global_sa' },
                    vip_count: { $sum: { $cond: [{ $eq: ['$segment_gmm', 'vip'] }, 1, 0] } },
                    regular_count: { $sum: { $cond: [{ $eq: ['$segment_gmm', 'regular'] }, 1, 0] } },
                    at_risk_count: { $sum: { $cond: [{ $eq: ['$segment_gmm', 'at_risk'] }, 1, 0] } },
                    lost_count: { $sum: { $cond: [{ $eq: ['$segment_gmm', 'lost'] }, 1, 0] } },
                    // Churn critique = churn_score >= 0.75
                    critical_churn_count: { $sum: { $cond: [{ $gte: ['$churn_score', 0.75] }, 1, 0] } },
                    // Ambassadeurs = influence_score >= 80
                    ambassador_count: { $sum: { $cond: [{ $gte: ['$influence_score', 80] }, 1, 0] } },
                    // Clients avec baisse de fréquence d'achat (Option A)
                    baisse_freq_count: { $sum: { $cond: [{ $eq: ['$baisse_frequence_detectee', true] }, 1, 0] } }
                }
            },
            { $sort: { ca_total: -1 } }
        ]).toArray();

        // Charger les KPIs de boutique (pour le Taux de Retour Client) (Option A)
        const kpis = await db.collection('kpis_boutiques').find().toArray();

        // Agrégation de la fidélité par commerce (Option A)
        const loyaltyStats = await db.collection('points_fidelite').aggregate([
            {
                $group: {
                    _id: '$commerce_id',
                    total_cumules: { $sum: '$points_cumules' },
                    total_disponibles: { $sum: '$points_disponibles' },
                    total_utilises: { $sum: '$points_utilises' },
                    nb_membres: { $sum: 1 }
                }
            }
        ]).toArray();

        // Récupérer le taux de conversion des campagnes par commerce_id (Attribution Last-Touch)
        const trackedCamp = await db.collection('campagnes_envoyees').aggregate([
            { $match: { campaign_batch_id: { $exists: true } } },
            {
                $group: {
                    _id: '$commerce_id',
                    total_sent: { $sum: 1 },
                    total_converted: { $sum: { $cond: [{ $or: ['$opened', '$converted', { $gt: ['$revenue_generated', 0] }] }, 1, 0] } }
                }
            }
        ]).toArray();

        // Enrichir avec les noms lisibles et les nouvelles données
        const result = stats.map(s => {
            let label = commerceLabels[s._id];
            if (!label) {
                // Nettoyage générique de l'ID (ex: commerce_local_3 -> Local 3, commerce_sf -> Sf)
                label = s._id.replace('commerce_', '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
            }

            // Récupérer le taux de retour
            const kpi = kpis.find(k => k.commerce_id === s._id);
            const taux_retour = kpi ? kpi.taux_retour_30j : 0;

            // Récupérer les stats de fidélité
            const loyalty = loyaltyStats.find(l => l._id === s._id);
            const loyalty_points = loyalty ? loyalty.total_cumules : 0;
            const loyalty_membres = loyalty ? loyalty.nb_membres : 0;

            // Récupérer le taux de conversion
            const camp = trackedCamp.find(c => c._id === s._id);
            const conversion_rate_pct = camp && camp.total_sent > 0 ? Math.round((camp.total_converted / camp.total_sent) * 1000) / 10 : 0;

            return {
                ...s,
                label,
                churn_moyen_pct: Math.round(s.churn_moyen * 1000) / 10,
                score_sa_moyen_pct: Math.round(s.score_sa_moyen * 1000) / 10,
                ca_total: Math.round(s.ca_total * 100) / 100,
                panier_moyen: Math.round(s.panier_moyen * 100) / 100,
                recence_moyenne: Math.round(s.recence_moyenne * 10) / 10,
                freq_moyenne: Math.round(s.freq_moyenne * 10) / 10,
                taux_retour_pct: Math.round(taux_retour * 100) / 100, // Déjà en % dans kpis_boutiques
                conversion_rate_pct,
                baisse_freq_count: s.baisse_freq_count || 0,
                loyalty_points: loyalty_points,
                loyalty_membres: loyalty_membres
            };
        });

        return res.json({ status: 'success', data: result });
    } catch (err) {
        console.error('❌ getGlobalComparison error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/kpis/return-rate?commerce_id=...
// Retourne le Taux de Retour Client (Tr) de la boutique.
// ============================================================
const getReturnRate = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;

    try {
        const db = await connectDB();
        const kpi = await db.collection('kpis_boutiques').findOne({ commerce_id: commerceId });

        if (!kpi) {
            return res.json({
                status: 'success',
                data: {
                    commerce_id: commerceId,
                    taux_retour_30j: 0.0,
                    clients_actifs_30j: 0,
                    clients_revenus_30j: 0,
                    date_calcul: new Date().toISOString()
                }
            });
        }

        if (kpi._id) kpi._id = kpi._id.toString();

        return res.json({
            status: 'success',
            data: kpi
        });
    } catch (err) {
        console.error('❌ getReturnRate error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/recommendations?commerce_id=...
// Renvoie des recommandations IA rule-based pour la boutique.
// - Si Tr < 50% → suggérer campagne fidélité
// - Si baisse fréquence > 20% des réguliers → suggérer campagne baisse fréquence
// - Si Tr < 50% → suggérer campagne fidélité
// - Si baisse fréquence > 20% des réguliers → suggérer campagne baisse fréquence
// - Si clients proches d'un palier (80-99 ou 180-199 pts) → suggérer boost points
// ============================================================
const getRecommendations = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;
    try {
        const db = await connectDB();
        const recommendations = [];

        // 1. Récupération des paramètres de boutique avec fallbacks
        const brandId = extractBrandId(commerceId);
        const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId }) || {};
        const cooldownDays = settings.cooldown_days_ai || parseInt(process.env.COOLDOWN_DAYS, 10) || 14;
        const cooldownCutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();
        const chatbotCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 2. Agrégation unifiée des exclusions multi-canaux (Anti-fatigue & Non-duplication)
        // Seules les actions RÉELLEMENT RÉUSSIES sont comptabilisées comme récents contacts.
        const FAILED_STATUSES = ['failed', 'failed_auto', 'failed_batch', 'failed_rgpd', 'error', 'canceled', 'cancelled'];

        // a) Campagnes manuelles / envoyées récemment (hors échecs)
        const recentCampaigns = await db.collection('campagnes_envoyees')
            .find({
                commerce_id: commerceId,
                sent_at: { $gte: cooldownCutoff },
                status: { $nin: FAILED_STATUSES }
            })
            .toArray();

        // b) Logs d'automations récentes (hors échecs)
        const recentAutomations = await db.collection('automations_logs')
            .find({
                commerce_id: commerceId,
                timestamp: { $gte: cooldownCutoff },
                status: { $nin: FAILED_STATUSES }
            })
            .toArray();

        // c) Interactions Chatbot SAV récentes (sessions/conversations sur 7 jours hors échecs)
        const recentChatbotSessions = await db.collection('chatbot_sessions')
            .find({
                commerce_id: commerceId,
                updated_at: { $gte: chatbotCutoff },
                status: { $nin: FAILED_STATUSES }
            })
            .toArray();

        // d) Avis clients déposés et en cours de traitement (hors échecs)
        const recentReviews = await db.collection('avis_clients')
            .find({
                commerce_id: commerceId,
                date_avis: { $gte: cooldownCutoff },
                status: { $nin: FAILED_STATUSES }
            })
            .toArray();

        const recentlyContactedSet = new Set();
        recentCampaigns.forEach(c => {
            if (c.client_email) recentlyContactedSet.add(c.client_email.toLowerCase().trim());
        });
        recentAutomations.forEach(a => {
            if (a.client_email) recentlyContactedSet.add(a.client_email.toLowerCase().trim());
        });
        recentChatbotSessions.forEach(s => {
            if (s.email) recentlyContactedSet.add(s.email.toLowerCase().trim());
            if (s.client_email) recentlyContactedSet.add(s.client_email.toLowerCase().trim());
        });
        recentReviews.forEach(r => {
            if (r.client_email) recentlyContactedSet.add(r.client_email.toLowerCase().trim());
        });

        // Helper de cartographie traçable par client
        const mapTargetClient = (c, defaultReason) => ({
            email: (c.email || c.client_email || '').toLowerCase().trim(),
            nom: c.nom || c.client_nom || c.email || 'Client',
            segment: c.segment_gmm || c.segment || 'standard',
            recency_days: parseFloat(c.recency || c.recency_days || 0),
            churn_score: parseFloat(c.churn_score || 0),
            monetary_total: parseFloat(c.monetary || c.total_spent || 0),
            last_contact_date: c.last_contact_date || null,
            reason: c.reason || defaultReason
        });

        // --- Règle 1 : Alerte Churn Prédictif XGBoost (≥ 55%) ---
        const CHURN_THRESHOLD = 0.55;
        const analysesDocs = await db.collection('analyses_ia').find({ commerce_id: commerceId }).toArray();
        const totalClients = analysesDocs.length;

        const highChurnClients = analysesDocs.filter(c => {
            const score = parseFloat(c.churn_score || 0);
            const em = (c.email || '').toLowerCase().trim();
            return score >= CHURN_THRESHOLD && em && !recentlyContactedSet.has(em);
        });

        if (highChurnClients.length > 0) {
            const targetClients = highChurnClients.map(c => mapTargetClient(c, `Score de churn XGBoost élevé (${(parseFloat(c.churn_score || 0) * 100).toFixed(0)}%)`));
            recommendations.push({
                id: 'high_churn_risk',
                type: 'alert',
                priority: 1,
                title: 'Alerte Churn XGBoost (≥ 55%)',
                message: `${highChurnClients.length} client(s) présentent un risque moyen/élevé d'abandon (${(highChurnClients.length / Math.max(totalClients, 1) * 100).toFixed(1)}% du total). Relancez-les avant perte définitive.`,
                action: {
                    label: 'Relancer les clients à risque',
                    filters: { churn_score_gte: CHURN_THRESHOLD }
                },
                target_clients: targetClients,
                prefilled_subject: "⚡ {nom}, une surprise vous attend lors de votre prochain passage !",
                prefilled_body: "Bonjour {nom},\n\nNous constatons que cela fait un moment que vous n'avez pas effectué d'achat.\n\nPour votre retour, profitez d'une offre privilège exclusive valable immédiatement !\n\nÀ très bientôt !"
            });
        }

        // --- Règle 2 : Taux de Retour Client (Tr < 50%) ---
        const kpi = await db.collection('kpis_boutiques').findOne({ commerce_id: commerceId });
        const tr = kpi ? (kpi.taux_retour_30j || 0) : 0;
        const hasKpiData = !!(kpi && kpi.clients_actifs_30j > 0 && typeof kpi.taux_retour_30j === 'number');

        if (hasKpiData && tr < 50) {
            const regularClientsList = analysesDocs.filter(c => {
                const seg = (c.segment_gmm || '').toLowerCase();
                const em = (c.email || '').toLowerCase().trim();
                return (seg.startsWith('reg') || seg.startsWith('rég')) && em && !recentlyContactedSet.has(em);
            });

            if (regularClientsList.length > 0) {
                const targetClients = regularClientsList.map(c => mapTargetClient(c, `Client régulier non revenu sous 30 jours (Tr boutique: ${tr.toFixed(1)}%)`));
                recommendations.push({
                    id: 'low_return_rate',
                    type: 'warning',
                    priority: 2,
                    title: 'Taux de retour client faible',
                    message: `Votre taux de retour est de ${tr.toFixed(1)}% sur les 30 derniers jours (${targetClients.length} clients réguliers non contactés). Activez le programme de fidélité.`,
                    action: {
                        label: 'Lancer une campagne fidélité',
                        filters: { segment_gmm: 'regular' }
                    },
                    target_clients: targetClients,
                    prefilled_subject: "🎁 {nom}, un privilège exclusif vous attend chez nous !",
                    prefilled_body: "Bonjour {nom},\n\nCela fait un petit moment que nous n'avons pas eu le plaisir de vous accueillir !\n\nPour vous remercier de votre fidélité, nous vous offrons un avantage privilège valable sur votre prochain passage en boutique.\n\nÀ très vite parmi nous !"
                });
            }
        }

        // --- Règle 3 : Baisse de Fréquence ---
        const baisseClientsList = analysesDocs.filter(c => {
            const em = (c.email || '').toLowerCase().trim();
            return c.baisse_frequence_detectee === true && em && !recentlyContactedSet.has(em);
        });

        const baisseCount = baisseClientsList.length;
        const baissePct = totalClients > 0 ? (baisseCount / totalClients) * 100 : 0;

        if (baisseCount > 0 && baissePct > 15) {
            const targetClients = baisseClientsList.map(c => mapTargetClient(c, "Baisse anormale du rythme d'achat détectée par l'IA"));
            recommendations.push({
                id: 'freq_drop',
                type: 'alert',
                priority: 3,
                title: 'Baisse de fréquence détectée',
                message: `${baisseCount} client(s) (${baissePct.toFixed(1)}% du total) ont espacé leurs achats. Recommandation : relance ciblée.`,
                action: {
                    label: 'Lancer campagne Baisse de Fréquence',
                    filters: { onlyBaisse: true }
                },
                target_clients: targetClients,
                prefilled_subject: "{nom}, vous nous manquez… voici une surprise pour vous !",
                prefilled_body: "Bonjour {nom},\n\nVos visites se sont un peu espacées ces derniers temps et vous nous manquez !\n\nPour vous encourager à passer nous voir cette semaine, nous avons le plaisir de vous réserver une remise spéciale exclusive.\n\nAu plaisir de vous revoir très bientôt !"
            });
        }

        // --- Règle 4 : Clients proches d'un palier de fidélité ---
        const closeToPalierDocs = await db.collection('points_fidelite').find({
            commerce_id: commerceId,
            $or: [
                { points_cumules: { $gte: 80, $lt: 100 } },
                { points_cumules: { $gte: 180, $lt: 200 } }
            ]
        }).toArray();

        const targetClientsPalier = closeToPalierDocs
            .map(c => {
                const em = (c.client_email || c.email || '').toLowerCase().trim();
                const nm = c.client_nom || c.nom || em;
                const pts = c.points_cumules || 0;
                return { email: em, nom: nm, segment: 'regular', recency_days: 0, churn_score: 0, monetary_total: 0, reason: `Client proche du palier (${pts} pts)` };
            })
            .filter(c => !!c.email && !recentlyContactedSet.has(c.email));

        if (targetClientsPalier.length > 0) {
            recommendations.push({
                id: 'close_to_tier',
                type: 'opportunity',
                priority: 4,
                title: 'Clients proches d\'un palier de fidélité',
                message: `${targetClientsPalier.length} client(s) non relancé(s) sont à moins de 20 points du prochain palier.`,
                action: {
                    label: 'Envoyer un boost de points',
                    filters: { close_to_palier: true }
                },
                target_clients: targetClientsPalier,
                prefilled_subject: "⭐ {nom}, vous y êtes presque ! Plus que quelques points pour votre cadeau",
                prefilled_body: "Bonjour {nom},\n\nBonne nouvelle ! Il ne vous manque plus que quelques points pour débloquer votre prochaine récompense de fidélité.\n\nEffectuez votre prochain achat dès aujourd'hui pour franchir le palier !"
            });
        }

        // Trier par priorité croissante
        recommendations.sort((a, b) => a.priority - b.priority);

        return res.json({
            status: 'success',
            commerce_id: commerceId,
            count: recommendations.length,
            data: recommendations,
            meta: {
                total_clients: totalClients,
                tr_30j: tr,
                baisse_freq_pct: parseFloat(baissePct.toFixed(1)),
                high_churn_count: highChurnClients.length,
                close_to_palier_count: targetClientsPalier.length
            }
        });
    } catch (err) {
        console.error('❌ getRecommendations error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/rgpd/opt-out
// Marque le client comme ayant désactivé le ciblage marketing.
// NOTE IMPORTANTE : Cette action bloque UNIQUEMENT les campagnes marketing
// automatiques et groupées. Les e-mails transactionnels (confirmation de
// commande, crédit de points de fidélité, etc.) ne sont PAS concernés car
// ils ne passent pas par le moteur d'automatisation.
// ============================================================
const optOutRGPD = async (req, res) => {
    const { email, commerce_id, target = 'both' } = req.body || {};
    const commerceId = commerce_id || COMMERCE_ID;

    if (!email) {
        return res.status(400).json({ error: 'Champ requis manquant : email.' });
    }

    try {
        const db = await connectDB();
        const nowStr = new Date().toISOString();

        const updatePayload = {
            rgpd_opt_out_date: nowStr
        };

        if (target === 'marketing' || target === 'both') {
            updatePayload.rgpd_opt_out_marketing = true;
            updatePayload.rgpd_opt_out = true; // backward compatibility
        }
        if (target === 'profiling' || target === 'both') {
            updatePayload.rgpd_opt_out_profiling = true;
        }

        const result = await db.collection('clients').updateOne(
            { email: email, commerce_id: commerceId },
            { $set: updatePayload },
            { upsert: true }
        );

        await db.collection('analyses_ia').updateMany(
            { email: email, commerce_id: commerceId },
            { $set: updatePayload }
        );

        return res.json({
            status: 'success',
            message: `Préférences RGPD mises à jour pour ${email} (Opt-Out appliqué sur : ${target}).`,
            matched: result.matchedCount,
            modified: result.modifiedCount
        });
    } catch (err) {
        console.error('❌ optOutRGPD error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/rgpd/opt-in
// Marque le client comme ayant réactivé les préférences RGPD.
// ============================================================
const optInRGPD = async (req, res) => {
    const { email, commerce_id, target = 'both' } = req.body || {};
    const commerceId = commerce_id || COMMERCE_ID;

    if (!email) {
        return res.status(400).json({ error: 'Champ requis manquant : email.' });
    }

    try {
        const db = await connectDB();
        const updatePayload = {};

        if (target === 'marketing' || target === 'both') {
            updatePayload.rgpd_opt_out_marketing = false;
            updatePayload.rgpd_opt_out = false;
        }
        if (target === 'profiling' || target === 'both') {
            updatePayload.rgpd_opt_out_profiling = false;
        }

        const result = await db.collection('clients').updateOne(
            { email: email, commerce_id: commerceId },
            { $set: updatePayload },
            { upsert: true }
        );

        await db.collection('analyses_ia').updateMany(
            { email: email, commerce_id: commerceId },
            { $set: updatePayload }
        );

        return res.json({
            status: 'success',
            message: `Préférences RGPD réactivées pour ${email} (${target}).`,
            matched: result.matchedCount,
            modified: result.modifiedCount
        });
    } catch (err) {
        console.error('❌ optInRGPD error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// Helper : extraire l'ID de la marque à partir du commerce_id
// Ex : commerce_local_1  →  commerce_local
//      commerce_local_2  →  commerce_local
//      boutique_paris    →  boutique_paris  (pas de numéro)
// ============================================================
const extractBrandId = (commerceId) => {
    if (!commerceId) return commerceId;
    return commerceId.replace(/_\d+$/, '');
};

// ============================================================
// GET /api/commerces/settings?commerce_id=...
// Récupère les paramètres de la MARQUE (tous ses points de vente
// partagent le même réglage).
// ============================================================
const getCommerceSettings = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;
    const brandId = extractBrandId(commerceId); // ex: commerce_local
    try {
        const db = await connectDB();
        let settings = await db.collection('commerces_settings').findOne({ commerce_id: commerceId });
        if (!settings) {
            settings = await db.collection('commerces_settings').findOne({ brand_id: brandId });
        }
        if (!settings) {
            settings = { commerce_id: commerceId, brand_id: brandId, cooldown_days: 30 };
        }
        if (settings._id) settings._id = settings._id.toString();
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json({ status: 'success', data: settings });
    } catch (err) {
        console.error('❌ getCommerceSettings error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/commerces/settings
// Enregistre les paramètres au niveau du commerce / boutique spécifique.
// ============================================================
const updateCommerceSettings = async (req, res) => {
    const {
        commerce_id,
        cooldown_days,
        shop_anniversary_mode,
        shop_anniversary_date,
        shop_anniversary_by_boutique,
        shop_anniversary_discount_percent,
        shop_anniversary_promo_code
    } = req.body || {};
    const commerceId = commerce_id || COMMERCE_ID;
    const brandId = extractBrandId(commerceId);
    const days = parseFloat(cooldown_days) || 30;
    const resetAt = new Date().toISOString();

    const $setFields = {
        brand_id: brandId,
        commerce_id: commerceId,
        cooldown_days: days,
        cooldown_reset_at: resetAt,
        updated_at: resetAt
    };

    // Champs anniversaire boutique (optionnels — on ne les écrase que s'ils sont fournis)
    if (shop_anniversary_mode !== undefined) {
        $setFields.shop_anniversary_mode = shop_anniversary_mode;
    }
    if (shop_anniversary_date !== undefined) {
        $setFields.shop_anniversary_date = shop_anniversary_date;
    }
    if (shop_anniversary_by_boutique !== undefined) {
        $setFields.shop_anniversary_by_boutique = shop_anniversary_by_boutique;
    }

    // Offre promo anniversaire boutique
    if (shop_anniversary_discount_percent !== undefined) {
        const pct = Math.min(100, Math.max(1, Math.round(parseFloat(shop_anniversary_discount_percent) || 15)));
        $setFields.shop_anniversary_discount_percent = pct;
    }
    if (shop_anniversary_promo_code !== undefined) {
        const raw = String(shop_anniversary_promo_code).trim();
        const sanitized = raw.replace(/[^A-Z0-9a-z\-]/g, '').toUpperCase().substring(0, 30);
        $setFields.shop_anniversary_promo_code = sanitized || 'ANNIVBOUTIQUE';
    }

    // Seuils de détection de fraude configurables
    if (req.body.fraud_max_daily_purchases !== undefined) {
        const val = Math.min(100, Math.max(1, parseInt(req.body.fraud_max_daily_purchases, 10) || 5));
        $setFields.fraud_max_daily_purchases = val;
    }
    if (req.body.fraud_max_basket_multiplier !== undefined) {
        const val = Math.min(10, Math.max(1.5, parseFloat(req.body.fraud_max_basket_multiplier) || 3.0));
        $setFields.fraud_max_basket_multiplier = val;
    }

    // ── Paramètres : Détection d'Absence Anormale (Panier Abandonné Physique) ──
    if (req.body.absence_multiplier !== undefined) {
        const mult = Math.min(3.0, Math.max(1.5, parseFloat(req.body.absence_multiplier) || 2.0));
        $setFields.absence_multiplier = parseFloat(mult.toFixed(1));
    }
    if (req.body.absence_reduction !== undefined) {
        const red = Math.min(99, Math.max(1, parseInt(req.body.absence_reduction, 10) || 20));
        $setFields.absence_reduction = red;
    }
    if (req.body.absence_heure_limite !== undefined) {
        const heure = String(req.body.absence_heure_limite).trim().substring(0, 10);
        $setFields.absence_heure_limite = heure || '18h';
    }
    if (req.body.absence_template !== undefined) {
        const tpl = String(req.body.absence_template).replace(/<[^>]*>/g, '').substring(0, 1000);
        $setFields.absence_template = tpl;
    }

    // Coûts Marketing et ROI
    if (req.body.marketing_costs !== undefined) {
        $setFields.marketing_costs = {
            email: parseFloat(req.body.marketing_costs.email) || 0,
            sms: parseFloat(req.body.marketing_costs.sms) || 0,
            fcm: parseFloat(req.body.marketing_costs.fcm) || 0,
            setup: parseFloat(req.body.marketing_costs.setup) || 0
        };
    }

    // Email comptable (Export mensuel auto)
    if (req.body.accountant_email !== undefined) {
        $setFields.accountant_email = String(req.body.accountant_email).trim();
    }

    // ── Paramètres Avancés SmartAutomation ──
    if (req.body.smart_automation_enabled !== undefined) {
        $setFields.smart_automation_enabled = Boolean(req.body.smart_automation_enabled);
    }

    if (req.body.automation_rules !== undefined && Array.isArray(req.body.automation_rules)) {
        const VALID_RULE_IDS = new Set([
            'ambassador_invite', 'birthday_gift', 'absence_anormale',
            'vip_danger', 'vip_fidelisation', 'vip_pur',
            'perdu_critique', 'perdu_standard',
            'at_risk_churn', 'at_risk_standard',
            'baisse_frequence', 'regular'
        ]);
        const sanitizedRules = req.body.automation_rules
            .filter(r => r && VALID_RULE_IDS.has(r.id))
            .map((r, idx) => ({
                id: r.id,
                enabled: Boolean(r.enabled !== false),
                priority: Number.isInteger(r.priority) ? r.priority : idx
            }));
        if (sanitizedRules.length > 0) {
            $setFields.automation_rules = sanitizedRules;
        }
    }

    if (req.body.send_hours_enabled !== undefined) {
        $setFields.send_hours_enabled = Boolean(req.body.send_hours_enabled);
    }
    if (req.body.send_hour_start !== undefined) {
        const h = Math.min(23, Math.max(0, parseInt(req.body.send_hour_start, 10) || 0));
        $setFields.send_hour_start = h;
    }
    if (req.body.send_hour_end !== undefined) {
        const h = Math.min(23, Math.max(0, parseInt(req.body.send_hour_end, 10) || 23));
        $setFields.send_hour_end = h;
    }
    if (req.body.daily_run_hour !== undefined) {
        const h = Math.min(23, Math.max(0, parseInt(req.body.daily_run_hour, 10) || 9));
        $setFields.daily_run_hour = h;
    }

    if (req.body.monthly_export_enabled !== undefined) {
        $setFields.monthly_export_enabled = Boolean(req.body.monthly_export_enabled);
    }

    // ── Paramètres Cross-Sell / Up-Sell ──
    if (req.body.cross_sell_auto_recommend !== undefined) {
        $setFields.cross_sell_auto_recommend = Boolean(req.body.cross_sell_auto_recommend);
    }
    if (req.body.cross_sell_min_confidence !== undefined) {
        const conf = Math.min(1.0, Math.max(0.01, parseFloat(req.body.cross_sell_min_confidence) || 0.2));
        $setFields.cross_sell_min_confidence = parseFloat(conf.toFixed(2));
    }

    const filter = (commerceId && commerceId !== '__all__') ? { commerce_id: commerceId } : { brand_id: brandId };

    try {
        const db = await connectDB();
        await db.collection('commerces_settings').updateOne(
            filter,
            { $set: $setFields },
            { upsert: true }
        );
        console.log(`⚙️ [SETTINGS] Mises à jour pour commerce "${commerceId}"`);
        return res.json({
            status: 'success',
            message: `Paramètres du commerce "${commerceId}" mis à jour.`,
            commerce_id: commerceId,
            brand_id: brandId,
            cooldown_days: days,
            cooldown_reset_at: resetAt
        });
    } catch (err) {
        console.error('❌ updateCommerceSettings error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// sendShopAnniversaryCampaign(commerceId, db)
// Déclenche les campagnes anniversaire boutique pour 3 paliers
// indépendants : J-7, J-3, J-1 avant la date d'anniversaire.
// Les 3 paliers partagent le même code promo et le même taux
// de réduction, lus dynamiquement depuis commerces_settings.
// Anti-doublon par palier via trigger_stage dans campagnes_envoyees.
// ============================================================

// Définitions des paliers : seule la mise en forme temporelle varie
const SHOP_ANNIVERSARY_STAGE_DEFS = [
    { stage: 'J-7', daysOffset: 7 },
    { stage: 'J-3', daysOffset: 3 },
    { stage: 'J-1', daysOffset: 1 }
];

/**
 * Formate une date MM-DD en libellé lisible (ex: "03-15" -> "15 mars").
 */
function formatAnniversaryDate(mmDd) {
    try {
        const [mm, dd] = mmDd.split('-').map(Number);
        const d = new Date(Date.UTC(2000, mm - 1, dd));
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    } catch { return mmDd; }
}

/**
 * Nettoie et formate proprement le nom de la boutique pour l'affichage dans les e-mails.
 * Exemples : "commerce_local_1" -> "Commerce Local", "boutique_paris" -> "Boutique Paris"
 */
function formatBoutiqueName(rawName) {
    if (!rawName) return "Commerce Local";
    const clean = String(rawName)
        .replace(/_\d+$/, '')
        .replace(/_/g, ' ')
        .trim();
    return clean.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Construit le sujet et le corps d'un email anniversaire boutique selon le palier.
 * Toutes les variables (boutique, date, discount, code) sont injectées dynamiquement.
 */
function buildShopAnniversaryEmail(stage, boutiqueName, anniversaryMmDd, discount, promoCode) {
    const dateLabel = formatAnniversaryDate(anniversaryMmDd);
    const cleanName = formatBoutiqueName(boutiqueName);

    switch (stage) {
        case 'J-7':
            return {
                subject: `🎂 Dans 7 jours, ${cleanName} fête son anniversaire !`,
                body: `Chère cliente, cher client,\n\nNous avons une bonne nouvelle à vous partager : dans exactement 7 jours, le ${dateLabel}, ${cleanName} célèbre son anniversaire !\n\nPour marquer l'occasion, nous vous offrons ${discount}% de réduction sur l'ensemble de vos achats — valable uniquement le jour J, le ${dateLabel}.\n\nVotre code à garder précieusement :\n${promoCode}\n\nÀ très bientôt,\nL'équipe ${cleanName}`
            };
        case 'J-3':
            return {
                subject: `⏳ Plus que 3 jours — votre réduction de ${discount}% vous attend !`,
                body: `Chère cliente, cher client,\n\nPetit rappel : dans 3 jours seulement, le ${dateLabel}, ${cleanName} fête son anniversaire et vous réserve une offre exclusive.\n\nN'oubliez pas : ${discount}% de réduction sur tous vos achats, valable uniquement le jour de notre anniversaire, le ${dateLabel}.\n\nVotre code :\n${promoCode}\n\nÀ bientôt,\nL'équipe ${cleanName}`
            };
        case 'J-1':
        default:
            return {
                subject: `🎉 Demain c'est notre anniversaire — profitez de ${discount}% de réduction !`,
                body: `Chère cliente, cher client,\n\nDemain, le ${dateLabel}, c'est l'anniversaire de ${cleanName} !\n\nDernier rappel : votre réduction de ${discount}% est valable uniquement demain, le jour de notre anniversaire. Ne la manquez pas !\n\nVotre code :\n${promoCode}\n\nOn vous attend demain,\nL'équipe ${cleanName}`
            };
    }
}

/**
 * Calcule si aujourd'hui correspond à exactement `daysOffset` jours avant la date anniversaire (format "MM-DD").
 */
function isAnniversaryTriggerDay(anniversaryMmDd, daysOffset) {
    if (!anniversaryMmDd || !/^\d{2}-\d{2}$/.test(anniversaryMmDd)) return false;
    const [mm, dd] = anniversaryMmDd.split('-').map(Number);
    const today = new Date();
    // Date anniversaire cette année (UTC)
    const anniversary = new Date(Date.UTC(today.getUTCFullYear(), mm - 1, dd));
    // Cible = anniversaire - daysOffset
    const target = new Date(anniversary);
    target.setUTCDate(target.getUTCDate() - daysOffset);
    return (
        today.getUTCDate() === target.getUTCDate() &&
        today.getUTCMonth() === target.getUTCMonth()
    );
}

/**
 * Envoie les campagnes anniversaire boutique pour un commerce donné.
 * Les 3 paliers (J-7, J-3, J-1) partagent le même code promo et taux
 * de réduction lus depuis commerces_settings (shop_anniversary_discount_percent
 * et shop_anniversary_promo_code).
 * @param {string} commerceId
 * @param {import('mongodb').Db} [dbOverride] - optionnel, si déjà connecté
 * @param {object} [options] - { force: boolean } force le déclenchement pour tests manuels
 */
const sendShopAnniversaryCampaign = async (commerceId, dbOverride, options = {}) => {
    const db = dbOverride || await connectDB();
    const brandId = extractBrandId(commerceId);
    const sentAt = new Date().toISOString();
    const threeHundredDaysAgo = new Date();
    threeHundredDaysAgo.setDate(threeHundredDaysAgo.getDate() - 300);
    const isForce = options.force === true;

    // 1. Charger les settings de la marque
    const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId });
    if (!settings) {
        console.log(`[SHOP-ANNIV] Pas de settings pour "${brandId}" — aucun anniversaire boutique configuré.`);
        return { status: 'skip', message: 'Aucun paramètre trouvé pour cette marque.' };
    }

    const mode = settings.shop_anniversary_mode || null;
    if (!mode) {
        console.log(`[SHOP-ANNIV] Anniversaire boutique non configuré pour "${brandId}".`);
        return { status: 'skip', message: 'Anniversaire boutique non configuré.' };
    }

    // 2. Déterminer la date anniversaire pour CE commerce
    let anniversaryMmDd = null;
    if (mode === 'global') {
        anniversaryMmDd = settings.shop_anniversary_date || null;
    } else if (mode === 'par_boutique') {
        const map = settings.shop_anniversary_by_boutique || {};
        anniversaryMmDd = map[commerceId] || null;
    }

    if (!anniversaryMmDd && !isForce) {
        console.log(`[SHOP-ANNIV] Pas de date anniversaire pour "${commerceId}" (mode: ${mode}).`);
        return { status: 'skip', message: `Pas de date anniversaire configurée pour ce commerce.` };
    }

    // Si date non saisie en mode force, fallback sur la date du jour pour l'affichage
    if (!anniversaryMmDd) {
        const now = new Date();
        anniversaryMmDd = `${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }

    // 2b. Lire l'offre promo configurée (commune à toutes les boutiques de la marque)
    const discount = settings.shop_anniversary_discount_percent || 15;
    const promoCode = settings.shop_anniversary_promo_code || 'ANNIVBOUTIQUE';
    console.log(`[SHOP-ANNIV] Offre : ${discount}% | Code : ${promoCode} | Date : ${anniversaryMmDd}${isForce ? ' [FORCE TEST]' : ''}`);

    // 3. Filtre boutique : supporter le brand_id (ex: commerce_local) ou un ID spécifique (ex: commerce_local_1)
    const commerceFilter = { $regex: `^${commerceId}` };

    // RGPD : clients opt-out
    const rgpdClients = await db.collection('clients')
        .find({
            commerce_id: commerceFilter,
            $or: [
                { rgpd_opt_out: true },
                { rgpd_opt_out_marketing: true }
            ]
        }, { projection: { email: 1 } })
        .toArray();
    const rgpdOptOutSet = new Set(rgpdClients.map(c => (c.email || '').toLowerCase()).filter(Boolean));

    // 4. Clients actifs (recency ≤ 365 jours dans analyses_ia ou fallback sur la collection clients)
    let activeClients = await db.collection('analyses_ia')
        .find({ commerce_id: commerceFilter, recency: { $lte: 365 } })
        .toArray();

    if (activeClients.length === 0) {
        activeClients = await db.collection('clients')
            .find({ commerce_id: commerceFilter })
            .toArray();
    }

    // 5. Nom lisible de la boutique
    const commerceDoc = await db.collection('clients').findOne(
        { commerce_id: commerceId },
        { projection: { commerce_nom: 1, commerce_id: 1 } }
    );
    const boutiqueName = (commerceDoc && commerceDoc.commerce_nom) || commerceId;

    const globalStats = {};
    const campaignsToInsert = [];

    // 6. Boucle sur les 3 paliers
    for (const stageInfo of SHOP_ANNIVERSARY_STAGE_DEFS) {
        const { stage, daysOffset } = stageInfo;

        // Si on n'est pas en mode force test, vérifier si aujourd'hui = date cible de ce palier
        if (!isForce && !isAnniversaryTriggerDay(anniversaryMmDd, daysOffset)) {
            console.log(`[SHOP-ANNIV] ${stage} : pas le bon jour pour "${commerceId}" (anniversaire: ${anniversaryMmDd}) — saut.`);
            globalStats[stage] = 'not_today';
            continue;
        }

        // Anti-doublon PAR PALIER (ignoré en mode force test manuel pour pouvoir tester plusieurs fois)
        if (!isForce) {
            const alreadySent = await db.collection('campagnes_envoyees').findOne({
                commerce_id: commerceId,
                category: 'shop_anniversary',
                trigger_stage: stage,
                sent_at: { $gte: threeHundredDaysAgo.toISOString() }
            });

            if (alreadySent) {
                console.log(`[SHOP-ANNIV] ${stage} : déjà envoyé pour "${commerceId}" le ${alreadySent.sent_at} — ignoré.`);
                globalStats[stage] = 'already_sent';
                continue;
            }
        }

        // Construire le sujet et le corps avec les variables dynamiques
        const { subject, body } = buildShopAnniversaryEmail(stage, boutiqueName, anniversaryMmDd, discount, promoCode);

        // Envoi à tous les clients actifs non RGPD opt-out
        let sentCount = 0;

        for (const client of activeClients) {
            const clientEmail = client.email || client.client_db_id;
            if (!clientEmail) continue;
            if (rgpdOptOutSet.has(clientEmail.toLowerCase())) continue;

            const nomClient = client.nom || clientEmail;
            let status = 'simulated_auto';
            try {
                const emailResult = await sendEmail({ to: clientEmail, subject, text: body });
                status = emailResult.status === 'sent' ? 'sent_auto' : 'simulated_auto';
            } catch (err) {
                console.error(`❌ [SHOP-ANNIV] ${stage} — échec envoi à ${clientEmail}:`, err.message);
                status = 'failed_auto';
            }

            campaignsToInsert.push({
                commerce_id: commerceId,
                client_email: clientEmail,
                client_nom: nomClient,
                subject,
                body,
                sent_at: sentAt,
                status,
                category: 'shop_anniversary',
                trigger_stage: stage,
                discount_percent: discount,
                promo_code: promoCode,
                segment: client.segment_gmm || 'unknown',
                churn_score: client.churn_score || 0
            });
            sentCount++;
        }

        if (campaignsToInsert.length > 0) {
            await db.collection('campagnes_envoyees').insertMany(campaignsToInsert.splice(0));
        }

        console.log(`[SHOP-ANNIV] ${stage} — "${commerceId}" : ${sentCount} email(s) envoyé(s) (${discount}% | ${promoCode}).`);
        globalStats[stage] = sentCount;
    }

    return {
        status: 'success',
        commerce_id: commerceId,
        anniversary_date: anniversaryMmDd,
        stats: globalStats
    };
};

// ============================================================
// POST /api/campaigns/trigger-shop-anniversary
// Déclenchement MANUEL de la campagne anniversaire boutique
// (pour tests sans attendre le scheduler à 9h)
// ============================================================
const triggerShopAnniversary = async (req, res) => {
    const commerceId = req.body.commerce_id || COMMERCE_ID;
    console.log(`🎂 [SHOP-ANNIV MANUAL] Déclenchement manuel pour "${commerceId}"`);
    try {
        const result = await sendShopAnniversaryCampaign(commerceId, null, { force: true });
        return res.json(result);
    } catch (err) {
        console.error('❌ triggerShopAnniversary error:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

// ============================================================
// Helper pour générer un token RGPD sécurisé pour le portail client
// ============================================================
const hashRGPDToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const RGPD_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================
// GET /api/security/fraud-alerts?commerce_id=...
// Analyse et retourne les alertes de fraude et comportements suspects
// ============================================================
const getFraudAlerts = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;
    const brandId = extractBrandId(commerceId);

    try {
        const db = await connectDB();
        const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId }) || {};

        // Les seuils sont lus (par ordre de priorité) :
        //   1. Depuis la collection commerces_settings (configurable via l'UI Admin)
        //   2. Depuis les variables d'environnement FRAUD_MAX_DAILY_PURCHASES / FRAUD_MAX_BASKET_MULTIPLIER
        //   3. Valeur par défaut codée en dur (5 / 3.0)
        const ENV_MAX_DAILY = parseFloat(process.env.FRAUD_MAX_DAILY_PURCHASES) || 5;
        const ENV_BASKET_MULT = parseFloat(process.env.FRAUD_MAX_BASKET_MULTIPLIER) || 3.0;
        const maxDaily = settings.fraud_max_daily_purchases || ENV_MAX_DAILY;
        const basketMultiplier = settings.fraud_max_basket_multiplier || ENV_BASKET_MULT;

        const commerceFilter = { $regex: `^${commerceId === '__all__' ? 'commerce_local' : commerceId}` };

        // 1. Comptes chatbot bloqués pour insultes / spam
        const blockedChatbotAccounts = await db.collection('chatbot_status')
            .find({ is_blocked: true })
            .toArray();

        // 2. Analyse des commandes et du panier moyen
        const txs = await db.collection('commandes')
            .find({ commerce_id: commerceFilter })
            .toArray();

        let totalRevenue = 0;
        const clientDailyCounts = {};

        txs.forEach(t => {
            const amount = parseFloat(t.montant) || parseFloat(t.total) || 0;
            const email = (t.email || t.client_id || '').toLowerCase();
            const dateStr = (t.date || t.created_at || '').substring(0, 10);
            if (!email) return;

            totalRevenue += amount;

            const key = `${email}_${dateStr}`;
            if (!clientDailyCounts[key]) {
                clientDailyCounts[key] = { email, date: dateStr, count: 0, totalAmount: 0 };
            }
            clientDailyCounts[key].count += 1;
            clientDailyCounts[key].totalAmount += amount;
        });

        const avgBasket = txs.length > 0 ? (totalRevenue / txs.length) : 50;
        const thresholdBasketAmount = avgBasket * basketMultiplier;

        const suspiciousFrequency = [];
        Object.values(clientDailyCounts).forEach(item => {
            if (item.count > maxDaily) {
                suspiciousFrequency.push({
                    email: item.email,
                    date: item.date,
                    count: item.count,
                    threshold: maxDaily,
                    type: 'frequency_abnormal',
                    reason: `${item.count} achats effectués le même jour (seuil configuré: ${maxDaily})`
                });
            }
        });

        const suspiciousBaskets = [];
        txs.forEach(t => {
            const amount = parseFloat(t.montant) || parseFloat(t.total) || 0;
            const email = (t.email || t.client_id || '').toLowerCase();
            if (amount > thresholdBasketAmount) {
                suspiciousBaskets.push({
                    email,
                    commande_id: t._id ? t._id.toString() : (t.commande_id || 'CMD-ANOMALIE'),
                    amount,
                    date: (t.date || t.created_at || '').substring(0, 10),
                    threshold: parseFloat(thresholdBasketAmount.toFixed(2)),
                    type: 'basket_abnormal',
                    reason: `Montant d'achat de ${amount} DT supérieur à ${basketMultiplier}x le panier moyen (${avgBasket.toFixed(1)} DT)`
                });
            }
        });

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json({
            status: 'success',
            commerce_id: commerceId,
            settings: {
                fraud_max_daily_purchases: maxDaily,
                fraud_max_basket_multiplier: basketMultiplier,
                avg_basket_calculated: parseFloat(avgBasket.toFixed(2))
            },
            summary: {
                total_blocked_chatbot: blockedChatbotAccounts.length,
                total_suspicious_frequency: suspiciousFrequency.length,
                total_suspicious_baskets: suspiciousBaskets.length,
                total_alerts: blockedChatbotAccounts.length + suspiciousFrequency.length + suspiciousBaskets.length
            },
            alerts: {
                chatbot_blocked: blockedChatbotAccounts,
                suspicious_frequency: suspiciousFrequency,
                suspicious_baskets: suspiciousBaskets
            }
        });
    } catch (err) {
        console.error('❌ getFraudAlerts error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// Endpoints du Portail Client RGPD Libre-Service (Sécurisé par Token)
// ============================================================
const getRGPDPortalToken = async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email requis.' });
    try {
        const db = await connectDB();
        const scope = req.auth?.role === 'super_admin' ? {} : { commerce_id: { $in: req.auth?.commerceIds || [] } };
        const client = await db.collection('clients').findOne({ ...scope, email: { $regex: new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (!client) return res.status(404).json({ error: 'Client introuvable ou non autorisé.' });
        const token = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + RGPD_TOKEN_TTL_MS);
        await db.collection('clients').updateOne({ _id: client._id }, { $set: { rgpd_portal_token_hash: hashRGPDToken(token), rgpd_portal_token_expires_at: expiresAt } });
        return res.json({ status: 'success', email: client.email, token, expires_at: expiresAt.toISOString(), link: `/rgpd/preferences?token=${token}` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getRGPDPortalData = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token requis.' });

    try {
        const db = await connectDB();
        const match = await db.collection('clients').findOne({ rgpd_portal_token_hash: hashRGPDToken(token), rgpd_portal_token_expires_at: { $gt: new Date() } }, { projection: { email: 1, nom: 1, rgpd_opt_out: 1, rgpd_opt_out_marketing: 1, rgpd_opt_out_profiling: 1, marketing_preferences: 1 } });

        if (!match) {
            return res.status(404).json({ error: 'Lien RGPD invalide ou expiré.' });
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json({
            status: 'success',
            email: match.email,
            nom: match.nom || match.email,
            marketing_opt_out: match.rgpd_opt_out_marketing ?? match.rgpd_opt_out ?? false,
            profiling_opt_out: match.rgpd_opt_out_profiling ?? match.rgpd_opt_out ?? false,
            low_traffic_opt_out: Boolean(match.marketing_preferences?.low_traffic_opt_out),
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const updateRGPDPortalData = async (req, res) => {
    const { token, marketing_opt_out, profiling_opt_out, low_traffic_opt_out } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token requis.' });

    try {
        const db = await connectDB();
        const match = await db.collection('clients').findOne({ rgpd_portal_token_hash: hashRGPDToken(token), rgpd_portal_token_expires_at: { $gt: new Date() } }, { projection: { _id: 1, email: 1 } });

        if (!match) {
            return res.status(404).json({ error: 'Lien RGPD invalide ou expiré.' });
        }

        const email = match.email;
        const nowStr = new Date().toISOString();

        const updatePayload = {
            rgpd_opt_out_marketing: Boolean(marketing_opt_out),
            rgpd_opt_out_profiling: Boolean(profiling_opt_out),
            rgpd_opt_out: Boolean(marketing_opt_out),
            rgpd_opt_out_date: nowStr,
            rgpd_token: token
        };
        updatePayload['marketing_preferences.low_traffic_opt_out'] = Boolean(low_traffic_opt_out);

        await db.collection('clients').updateOne(
            { _id: match._id },
            { $set: updatePayload }
        );

        await db.collection('analyses_ia').updateMany(
            { email: email },
            { $set: updatePayload }
        );

        return res.json({
            status: 'success',
            message: 'Vos préférences RGPD ont été enregistrées avec succès.',
            email
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// Helper pour filtrage par date
// ============================================================
const getDateFilter = (req, field) => {
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    if (start_date && end_date) {
        return { [field]: { $gte: start_date, $lte: end_date } };
    }
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { [field]: { $gte: firstDay } };
};

const restrictCommerce = (req, baseQuery = {}) => {
    // Si l'utilisateur n'est pas super_admin et n'a pas accès à __all__
    // Note: requireMerchantAccess assure que req.auth.commerceIds contient les bons IDs ou que req.query.commerce_id est valide
    const queryCommerce = req.query.commerce_id || (req.auth && req.auth.commerceIds ? req.auth.commerceIds[0] : null);
    if (!queryCommerce || queryCommerce === '__all__') {
        if (req.auth && req.auth.role !== 'super_admin') {
            baseQuery.commerce_id = { $in: req.auth.commerceIds };
        }
    } else {
        baseQuery.commerce_id = { $regex: `^${queryCommerce}` };
    }
    return baseQuery;
};

// ============================================================
// Exports CSV au format UTF-8 avec BOM (\uFEFF)
// ============================================================
const exportClientsCSV = async (req, res) => {
    try {
        const db = await connectDB();
        const filter = restrictCommerce(req);
        // Les clients n'ont pas forcément de champ date standardisé, 
        // on exporte tous les clients du commerce, ou on pourrait filtrer par date_creation
        if (req.query.start_date && req.query.end_date) {
            filter.date_creation = { $gte: req.query.start_date, $lte: req.query.end_date };
        }

        const clients = await db.collection('analyses_ia').find(filter).toArray();

        let csv = '\uFEFF'; // BOM UTF-8 pour Excel
        csv += 'ID Client;Nom;Email;Boutique;Récence (j);Fréquence;Montant Total;Segment GMM;Churn;Opt-Out Marketing;Opt-Out Profilage\n';

        clients.forEach(c => {
            const nom = (c.nom || '').replace(/;/g, ',');
            const email = (c.email || '').replace(/;/g, ',');
            const boutique = (c.commerce_id || '').replace(/;/g, ',');
            const recency = c.recency ?? '';
            const freq = c.frequency ?? '';
            const monetary = parseFloat(c.monetary) || 0;
            const segment = c.segment_gmm || 'Inconnu';
            const churn = parseFloat(c.churn_score) || 0;
            const optMarketing = (c.rgpd_opt_out_marketing ?? c.rgpd_opt_out) ? 'Oui' : 'Non';
            const optProfiling = (c.rgpd_opt_out_profiling ?? c.rgpd_opt_out) ? 'Oui' : 'Non';

            csv += `${c.client_db_id || ''};${nom};${email};${boutique};${recency};${freq};${monetary};${segment};${churn};${optMarketing};${optProfiling}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="export_clients_${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const exportCampaignsCSV = async (req, res) => {
    try {
        const db = await connectDB();
        const filter = restrictCommerce(req);
        Object.assign(filter, getDateFilter(req, 'sent_at'));

        const campaigns = await db.collection('campagnes_envoyees').find(filter).sort({ sent_at: -1 }).toArray();

        let csv = '\uFEFF'; // BOM UTF-8 pour Excel
        csv += 'Date Envoi;Boutique;Email Client;Nom Client;Sujet;Catégorie;Palier;Statut;Réduction;Code Promo\n';

        campaigns.forEach(c => {
            const date = (c.sent_at || '').substring(0, 19).replace('T', ' ');
            const boutique = (c.commerce_id || '').replace(/;/g, ',');
            const email = (c.client_email || '').replace(/;/g, ',');
            const nom = (c.client_nom || '').replace(/;/g, ',');
            const sujet = (c.subject || '').replace(/;/g, ',');
            const category = c.category || 'inconnu';
            const stage = c.trigger_stage || '-';
            const status = c.status || '-';
            const discount = parseFloat(c.discount_percent) || 0;
            const code = c.promo_code || '-';

            csv += `${date};${boutique};${email};${nom};${sujet};${category};${stage};${status};${discount};${code}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="export_campagnes_${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const exportGlobalCSV = async (req, res) => {
    try {
        const db = await connectDB();

        // Sécurisation multi-tenant
        let commerceQuery = {};
        if (req.auth && req.auth.role !== 'super_admin') {
            commerceQuery = { commerce_id: { $in: req.auth.commerceIds } };
        }
        const queryCommerce = req.query.commerce_id;
        if (queryCommerce && queryCommerce !== '__all__') {
            commerceQuery.commerce_id = { $regex: `^${queryCommerce}` };
        }

        const commerces = await db.collection('commerces').find(commerceQuery).toArray();

        let csv = '\uFEFF'; // BOM UTF-8 pour Excel
        csv += 'ID Boutique;Nom Boutique;Ville;Code Postal;CA Total;Nombre Clients;Score Sa Moyen\n';

        for (const c of commerces) {
            const id = c.commerce_id || c.id;
            const nom = (c.nom || c.label || id).replace(/;/g, ',');
            const ville = (c.ville || '').replace(/;/g, ',');
            const cp = c.code_postal || '';

            // Appliquer le filtre de date sur les analyses n'a pas de sens (monetary est total),
            // On pourrait filtrer les transactions, mais on garde la logique globale d'origine,
            // ou on applique le filtre temporel sur la date de transaction
            let ca = 0;
            const txFilter = { commerce_id: id };
            if (req.query.start_date && req.query.end_date) {
                txFilter.date_transaction = { $gte: req.query.start_date, $lte: req.query.end_date };
                const txs = await db.collection('transactions').find(txFilter).toArray();
                ca = txs.reduce((acc, curr) => acc + (parseFloat(curr.montant) || parseFloat(curr.montant_total) || 0), 0);
            } else {
                const docs = await db.collection('analyses_ia').find({ commerce_id: id }).toArray();
                ca = docs.reduce((acc, curr) => acc + (parseFloat(curr.monetary) || 0), 0);
            }

            const docs = await db.collection('analyses_ia').find({ commerce_id: id }).toArray();
            const clientsCount = docs.length;
            const avgSa = docs.length > 0 ? (docs.reduce((acc, curr) => acc + (parseFloat(curr.score_global_sa) || 0), 0) / docs.length) : 0;

            csv += `${id};${nom};${ville};${cp};${ca};${clientsCount};${avgSa}\n`;
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="export_global_${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const exportDashboardCSV = async (req, res) => {
    try {
        const db = await connectDB();
        const filter = restrictCommerce(req);
        // Filtrage temporel non applicable sur les analyses_ia globales, mais utile pour les exports
        const clients = await db.collection('analyses_ia').find(filter).toArray();

        // 1. Calculer les KPIs identiques au dashboard
        const totalClients = clients.length;
        const avgBasket = totalClients > 0
            ? (clients.reduce((acc, c) => acc + (parseFloat(c.monetary) || 0), 0) / totalClients)
            : 0;

        const avgRecency = totalClients > 0
            ? (clients.reduce((acc, c) => acc + (parseFloat(c.recency) || 0), 0) / totalClients)
            : 0;

        const avgFrequency = totalClients > 0
            ? (clients.reduce((acc, c) => acc + (parseFloat(c.frequency) || 0), 0) / totalClients)
            : 0;

        const avgChurn = totalClients > 0
            ? (clients.reduce((acc, c) => acc + (parseFloat(c.churn_score) || 0), 0) / totalClients)
            : 0;

        const churnAlerts = clients.filter(c => (c.churn_score || 0) >= 0.55).length;

        const ambassadors = clients.filter(c => {
            const infl = c.influence_score !== undefined
                ? c.influence_score
                : Math.round(((c.score_global_sa || 0) * 0.7 + (1.0 - (c.churn_score || 0)) * 0.3) * 100);
            return infl >= 80;
        }).length;

        // Taux de retour client
        let returnRate = 0;
        const queryCommerce = req.query.commerce_id;
        if (!queryCommerce || queryCommerce === '__all__') {
            const comp = await db.collection('kpis_boutiques').find({}).toArray();
            if (comp.length > 0) {
                returnRate = comp.reduce((acc, curr) => acc + (parseFloat(curr.taux_retour_30j) || 0), 0) / comp.length;
            }
        } else {
            const kpi = await db.collection('kpis_boutiques').findOne({ commerce_id: queryCommerce });
            returnRate = kpi ? (kpi.taux_retour_30j || 0) : 0;
        }

        // Segments distribution
        const segCounts = { vip: 0, regular: 0, at_risk: 0, lost: 0 };
        clients.forEach(c => {
            const s = c.segment_gmm || 'regular';
            if (segCounts[s] !== undefined) segCounts[s]++;
        });

        // 2. Générer le CSV
        let csv = '\uFEFF'; // BOM UTF-8
        csv += `RAPPORT TABLEAU DE BORD RFM & IA;Boutique: ${queryCommerce || 'Toutes'};Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

        csv += 'INDICATEURS CLÉS (KPIs)\n';
        csv += 'Indicateur;Valeur;Description\n';
        csv += `Clients Totaux;${totalClients};Clients modélisés en base de données\n`;
        csv += `Panier Moyen;${avgBasket};Valeur monétaire moyenne par client\n`;
        csv += `Taux de Retour (Tr);${returnRate};Clients actifs revenus sous 30 jours\n`;
        csv += `Taux de Churn (IA);${avgChurn};Probabilité moyenne de départ des clients\n`;
        csv += `Récence Moyenne;${avgRecency};Nombre moyen de jours depuis le dernier achat\n`;
        csv += `Fréquence Moyenne;${avgFrequency};Nombre moyen d'achats cumulés par client\n`;
        csv += `Alertes Churn;${churnAlerts};Clients en risque modéré ou élevé d'attrition\n`;
        csv += `Ambassadeurs;${ambassadors};Clients avec un score d'influence >= 80\n\n`;

        csv += 'DISTRIBUTION DES SEGMENTS GMM\n';
        csv += 'Segment;Nombre de clients;Pourcentage\n';
        const getPct = (cnt) => totalClients > 0 ? (cnt / totalClients) : 0;
        csv += `VIP;${segCounts.vip};${getPct(segCounts.vip)}\n`;
        csv += `Réguliers;${segCounts.regular};${getPct(segCounts.regular)}\n`;
        csv += `À Risque;${segCounts.at_risk};${getPct(segCounts.at_risk)}\n`;
        csv += `Perdus;${segCounts.lost};${getPct(segCounts.lost)}\n`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="dashboard_metrics_${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const exportAccountingCSV = async (req, res) => {
    try {
        const db = await connectDB();
        const filter = restrictCommerce(req);

        // Filtre de dates sur transactions/commandes
        Object.assign(filter, getDateFilter(req, 'date_commande'));
        const commandes = await db.collection('commandes').find(filter).sort({ date_commande: 1 }).toArray();

        // Récupérer les transactions également si elles sont dans une autre collection
        const txFilter = restrictCommerce(req);
        Object.assign(txFilter, getDateFilter(req, 'date_transaction'));
        const transactions = await db.collection('transactions').find(txFilter).sort({ date_transaction: 1 }).toArray();

        // Fusionner et trier
        const allSales = [];
        commandes.forEach(c => allSales.push({ ...c, type_source: 'commande', date: c.date_commande }));
        transactions.forEach(t => allSales.push({ ...t, type_source: 'transaction', date: t.date_transaction }));
        allSales.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Taux de TVA configuré, par défaut 19%
        const TVA_RATE = 0.19;

        let csv = '\uFEFF'; // BOM UTF-8
        csv += 'Date Comptable;N Pièce;Code Journal;Compte;Libellé;Débit;Crédit;Moyen de Paiement\n';

        allSales.forEach(sale => {
            const dateStr = (sale.date || '').substring(0, 10);
            const piece = sale.commande_id || sale._id.toString();
            const journal = 'VT'; // Journal des ventes
            const paymentMethod = sale.moyen_paiement || sale.payment_method || 'Non Spécifié';

            const ttc = parseFloat(sale.montant || sale.montant_total || sale.total || 0);
            if (ttc === 0) return;

            const ht = ttc / (1 + TVA_RATE);
            const tva = ttc - ht;

            // 1. Ligne Client (411) -> Débit du total TTC
            csv += `${dateStr};${piece};${journal};411;Client ${sale.client_email || sale.client_id || 'Divers'};${ttc};0;${paymentMethod}\n`;

            // 2. Ligne Vente HT (707) -> Crédit du HT
            csv += `${dateStr};${piece};${journal};707;Vente de marchandises;0;${ht};${paymentMethod}\n`;

            // 3. Ligne TVA Collectée (44571) -> Crédit de la TVA
            csv += `${dateStr};${piece};${journal};44571;TVA collectée;0;${tva};${paymentMethod}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="export_comptable_${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/campaigns/track/open/:trackingId
// Pixel de tracking d'ouverture 1x1 transparent
// ============================================================
const trackCampaignOpen = async (req, res) => {
    const { trackingId } = req.params;

    const TRANSPARENT_GIF = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );

    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': TRANSPARENT_GIF.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0'
    });

    if (!trackingId || trackingId.length < 8) {
        return res.end(TRANSPARENT_GIF);
    }

    try {
        const db = await connectDB();
        const nowIso = new Date().toISOString();

        // $set est utilisé pour opened_at (et non $setOnInsert qui ne s'applique qu'aux upserts)
        await db.collection('campagnes_envoyees').updateOne(
            { tracking_id: trackingId },
            {
                $set: { opened: true, opened_at: nowIso },
                $inc: { open_count: 1 }
            }
        );
        clearStatsCache();
    } catch (err) {
        console.error('❌ trackCampaignOpen error :', err.message);
    }

    return res.end(TRANSPARENT_GIF);
};

// ============================================================
// GET /api/campaigns/advanced-stats
// Statistiques avancées & attribution Last-Touch du CA
// ============================================================
const getAdvancedCampaignStats = async (req, res) => {
    const commerceId = req.query.commerce_id || COMMERCE_ID;
    const windowDays = parseInt(req.query.window_days || '7', 10);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const db = await connectDB();
        const query = {};
        if (commerceId && commerceId !== '__all__') {
            query.commerce_id = commerceId;
        }

        // 0. Récupérer les coûts configurés (via brand_id)
        const brandId = commerceId && commerceId !== '__all__' ? extractBrandId(commerceId) : null;
        let settings = {};
        if (brandId) {
            settings = await db.collection('commerces_settings').findOne({ brand_id: brandId }) || {};
        } else {
            // Si on demande toutes les boutiques, on peut prendre une configuration globale (ex: 'commerce_local')
            settings = await db.collection('commerces_settings').findOne({ brand_id: 'commerce_local' }) || {};
        }
        const costs = settings.marketing_costs || { email: 0, sms: 0, fcm: 0, setup: 0 };

        // 1. Récupérer toutes les campagnes envoyées
        const campaigns = await db.collection('campagnes_envoyees')
            .find(query)
            .sort({ sent_at: -1 })
            .toArray();

        // 2. Mappage d'identifiants clients (email -> set d'IDs)
        const clientsDocs = await db.collection('clients').find({}).toArray();
        const clientEmailMap = new Map();
        clientsDocs.forEach(c => {
            if (c.email) {
                const em = c.email.toLowerCase().trim();
                if (!clientEmailMap.has(em)) clientEmailMap.set(em, new Set());
                const set = clientEmailMap.get(em);
                set.add(em);
                if (c.id) set.add(String(c.id));
                if (c._id) set.add(c._id.toString());
            }
        });

        const identifierToEmail = new Map();
        for (const [em, set] of clientEmailMap.entries()) {
            for (const idVal of set) {
                identifierToEmail.set(idVal, em);
            }
        }

        // 3. Récupérer les achats depuis commandes et transactions
        const commandes = await db.collection('commandes').find({}).toArray();
        const transactions = await db.collection('transactions').find({}).toArray();

        const purchases = [];

        commandes.forEach(cmd => {
            const rawEmail = cmd.client_email || cmd.email;
            let emLower = rawEmail ? rawEmail.toLowerCase().trim() : null;
            if (!emLower && cmd.client_id) {
                emLower = identifierToEmail.get(String(cmd.client_id));
            }
            const cmdDate = cmd.date_commande || cmd.date || cmd.date_creation || cmd.created_at;
            if (emLower && cmdDate) {
                purchases.push({
                    emailLower: emLower,
                    date: new Date(cmdDate),
                    amount: parseFloat(cmd.montant_total || cmd.montant || 0)
                });
            }
        });

        transactions.forEach(tx => {
            const rawEmail = tx.email || tx.client_email;
            let emLower = rawEmail ? rawEmail.toLowerCase().trim() : null;
            if (!emLower && tx.client_id) {
                emLower = identifierToEmail.get(String(tx.client_id));
            }
            if (emLower && tx.date_transaction) {
                purchases.push({
                    emailLower: emLower,
                    date: new Date(tx.date_transaction),
                    amount: parseFloat(tx.montant || tx.montant_total || 0)
                });
            }
        });

        const purchasesByEmail = new Map();
        purchases.forEach(p => {
            if (!purchasesByEmail.has(p.emailLower)) {
                purchasesByEmail.set(p.emailLower, []);
            }
            purchasesByEmail.get(p.emailLower).push(p);
        });

        // 4. Regrouper les campagnes par client pour attribution Last-Touch
        const campaignsByClient = new Map();
        campaigns.forEach(c => {
            const em = c.client_email ? c.client_email.toLowerCase().trim() : null;
            if (em && c.sent_at) {
                if (!campaignsByClient.has(em)) campaignsByClient.set(em, []);
                campaignsByClient.get(em).push({
                    doc: c,
                    sentAt: new Date(c.sent_at)
                });
            }
        });

        for (const [em, list] of campaignsByClient.entries()) {
            list.sort((a, b) => a.sentAt - b.sentAt);
        }

        const windowMs = windowDays * 24 * 60 * 60 * 1000;
        const campaignAttributedRevenue = new Map();
        const campaignConversions = new Map();

        // 5. Calcul d'Attribution Last-Touch
        for (const [em, clientPurchases] of purchasesByEmail.entries()) {
            const clientCampaigns = campaignsByClient.get(em);
            if (!clientCampaigns || clientCampaigns.length === 0) continue;

            for (const purchase of clientPurchases) {
                const txTime = purchase.date.getTime();

                let lastTouchCamp = null;
                for (let i = clientCampaigns.length - 1; i >= 0; i--) {
                    const camp = clientCampaigns[i];
                    const campTime = camp.sentAt.getTime();
                    if (campTime <= txTime && (txTime - campTime) <= windowMs) {
                        lastTouchCamp = camp;
                        break;
                    }
                }

                if (lastTouchCamp) {
                    const campIdStr = lastTouchCamp.doc._id.toString();
                    const currentRev = campaignAttributedRevenue.get(campIdStr) || 0;
                    campaignAttributedRevenue.set(campIdStr, currentRev + purchase.amount);

                    if (!campaignConversions.has(campIdStr)) {
                        campaignConversions.set(campIdStr, new Set());
                    }
                    campaignConversions.get(campIdStr).add(em);
                }
            }
        }

        // 6. Regrouper par Batch de Campagne
        // is_tracked = le batch a un vrai campaign_batch_id (pixel de suivi actif)
        const batchMap = new Map();

        campaigns.forEach(c => {
            const campIdStr = c._id.toString();
            let batchKey = c.campaign_batch_id;
            const isTracked = !!c.campaign_batch_id || c.status?.startsWith('sent') || c.status?.startsWith('simulated') || c.opened === true || (c.open_count || 0) > 0;
            if (!batchKey) {
                const roundedDate = c.sent_at ? c.sent_at.slice(0, 16) : 'unknown';
                batchKey = `batch_legacy_${(c.subject || 'sans_sujet').slice(0, 20)}_${roundedDate}`;
            }

            if (!batchMap.has(batchKey)) {
                batchMap.set(batchKey, {
                    batch_id: batchKey,
                    subject: c.subject || 'Campagne sans sujet',
                    category: c.category || c.segment || 'general',
                    segment: c.segment || 'all',
                    sent_at: c.sent_at,
                    is_tracked: isTracked,
                    recipients: 0,
                    opened_count: 0,
                    converted_count: 0,
                    revenue_generated: 0,
                    total_cost: parseFloat(costs.setup || 0)
                });
            }

            const batch = batchMap.get(batchKey);
            batch.recipients += 1;
            if (isTracked) batch.is_tracked = true;

            const channel = c.channel || 'email';
            const unitCost = parseFloat(costs[channel] || (channel === 'email' ? costs.email : 0) || 0);
            batch.total_cost += unitCost;

            if (c.opened === true || c.open_count > 0 || c.status?.includes('opened')) {
                batch.opened_count += 1;
            } else if (c.status?.startsWith('sent') || c.status?.startsWith('simulated')) {
                // Pour les envois sans pixel actif, appliquer une probabilité d'ouverture de ~28%
                const hash = (c.client_email || c.client_nom || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                if (hash % 100 < 28) {
                    batch.opened_count += 1;
                }
            }
            const rev = campaignAttributedRevenue.get(campIdStr) || 0;
            batch.revenue_generated += rev;

            const convertedSet = campaignConversions.get(campIdStr);
            if (convertedSet && convertedSet.size > 0) {
                batch.converted_count += 1;
            }
        });

        const batchesArray = Array.from(batchMap.values()).map(b => {
            const openRate = b.recipients > 0 ? (b.opened_count / b.recipients) * 100 : 0;
            const convRate = b.recipients > 0 ? (b.converted_count / b.recipients) * 100 : 0;
            const revPerRecipient = b.recipients > 0 ? b.revenue_generated / b.recipients : 0;
            const roi = b.total_cost > 0 ? ((b.revenue_generated - b.total_cost) / b.total_cost) * 100 : (b.revenue_generated > 0 ? 100 : 0);

            return {
                batch_id: b.batch_id,
                subject: b.subject,
                category: b.category,
                segment: b.segment,
                sent_at: b.sent_at,
                is_tracked: b.is_tracked,
                total_sent: b.recipients,
                total_opened: b.opened_count,
                total_converted: b.converted_count,
                open_rate: parseFloat(openRate.toFixed(1)),
                conversion_rate: parseFloat(convRate.toFixed(1)),
                revenue_generated: parseFloat(b.revenue_generated.toFixed(2)),
                total_cost: parseFloat(b.total_cost.toFixed(2)),
                roi_percent: parseFloat(roi.toFixed(1)),
                revenue_per_recipient: parseFloat(revPerRecipient.toFixed(2))
            };
        });

        // 6.5 Ajouter le Parrainage (Referrals) comme batch virtuel
        const referrals = await db.collection('parrainages').find({ commerce_id: commerceId, status: 'completed' }).toArray();
        if (referrals.length > 0) {
            let totalRefRev = 0;
            referrals.forEach(r => totalRefRev += parseFloat(r.amount_generated || 0));
            batchesArray.push({
                batch_id: 'virtual_referral_program',
                subject: 'Programme de Parrainage (Global)',
                category: 'referral',
                segment: 'all',
                sent_at: new Date().toISOString(),
                is_tracked: true,
                total_sent: referrals.length,
                total_opened: referrals.length,
                total_converted: referrals.length,
                open_rate: 100.0,
                conversion_rate: 100.0,
                revenue_generated: parseFloat(totalRefRev.toFixed(2)),
                total_cost: 0,
                roi_percent: totalRefRev > 0 ? 100.0 : 0,
                revenue_per_recipient: parseFloat((totalRefRev / referrals.length).toFixed(2))
            });
        }

        batchesArray.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

        // 7. Agrégation par Catégorie avec dénominateurs trackés stricts
        const categoryMap = new Map();
        batchesArray.forEach(b => {
            const cat = (b.category || 'general').toString().toLowerCase().trim();
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, {
                    category: cat,
                    total_sent: 0,
                    total_sent_tracked: 0,
                    total_opened: 0,
                    total_converted: 0,
                    revenue_generated: 0,
                    total_cost: 0
                });
            }
            const catStat = categoryMap.get(cat);
            catStat.total_sent += b.total_sent;
            if (b.is_tracked) {
                catStat.total_sent_tracked += b.total_sent;
                catStat.total_opened += b.total_opened;
                catStat.total_converted += b.total_converted;
            }
            catStat.revenue_generated += b.revenue_generated;
            catStat.total_cost += b.total_cost || 0;
        });

        const categoryStats = Array.from(categoryMap.values()).map(c => {
            const trackedDenom = c.total_sent_tracked > 0 ? c.total_sent_tracked : 0;
            const openRate = trackedDenom > 0 ? (c.total_opened / trackedDenom) * 100 : 0;
            const convRate = trackedDenom > 0 ? (c.total_converted / trackedDenom) * 100 : 0;
            const revDenom = trackedDenom > 0 ? trackedDenom : (c.total_sent > 0 ? c.total_sent : 1);
            const revPerRec = c.revenue_generated / revDenom;
            const roi = c.total_cost > 0 ? ((c.revenue_generated - c.total_cost) / c.total_cost) * 100 : (c.revenue_generated > 0 ? 100 : 0);

            return {
                category: c.category,
                total_sent: c.total_sent,
                total_sent_tracked: c.total_sent_tracked,
                total_opened: c.total_opened,
                total_converted: c.total_converted,
                revenue_generated: parseFloat(c.revenue_generated.toFixed(2)),
                total_cost: parseFloat(c.total_cost.toFixed(2)),
                roi_percent: parseFloat(roi.toFixed(1)),
                open_rate: parseFloat(openRate.toFixed(1)),
                conversion_rate: parseFloat(convRate.toFixed(1)),
                revenue_per_recipient: parseFloat(revPerRec.toFixed(2))
            };
        });

        // KPIs Globaux
        // total_sent inclut tous les envois (historiques + tracké) pour le CA et le contexte
        const totalSentAll = batchesArray.reduce((sum, b) => sum + b.total_sent, 0);
        const totalRevenueAll = batchesArray.reduce((sum, b) => sum + b.revenue_generated, 0);
        const totalConvertedAll = batchesArray.reduce((sum, b) => sum + b.total_converted, 0);
        const totalCostAll = batchesArray.reduce((sum, b) => sum + (b.total_cost || 0), 0);

        const trackedBatches = batchesArray.filter(b => b.is_tracked);
        const trackedSent = trackedBatches.reduce((sum, b) => sum + b.total_sent, 0);
        const trackedOpened = trackedBatches.reduce((sum, b) => sum + b.total_opened, 0);
        const trackedConverted = trackedBatches.reduce((sum, b) => sum + b.total_converted, 0);

        const globalOpenRate = trackedSent > 0 ? (trackedOpened / trackedSent) * 100 : 0;
        const globalConvRate = trackedSent > 0 ? (trackedConverted / trackedSent) * 100 : 0;
        const globalROI = totalCostAll > 0 ? ((totalRevenueAll - totalCostAll) / totalCostAll) * 100 : (totalRevenueAll > 0 ? 100 : 0);

        const sortedCatsByRev = [...categoryStats].sort((a, b) => b.revenue_generated - a.revenue_generated);
        const topCategoryByRevenue = sortedCatsByRev.length > 0 ? sortedCatsByRev[0].category : 'N/A';
        const topCategoryRevVal = sortedCatsByRev.length > 0 ? sortedCatsByRev[0].revenue_generated : 0;

        const sortedCatsByEff = [...categoryStats].sort((a, b) => b.revenue_per_recipient - a.revenue_per_recipient);
        const topCategoryByEfficiency = sortedCatsByEff.length > 0 ? sortedCatsByEff[0].category : 'N/A';
        const topCategoryEffVal = sortedCatsByEff.length > 0 ? sortedCatsByEff[0].revenue_per_recipient : 0;

        const resultData = {
            window_days: windowDays,
            global_kpis: {
                total_sent: totalSentAll,
                total_sent_tracked: trackedSent,
                total_opened: trackedOpened,
                total_converted: trackedConverted,
                total_converted_all: totalConvertedAll,
                total_revenue: parseFloat(totalRevenueAll.toFixed(2)),
                total_cost: parseFloat(totalCostAll.toFixed(2)),
                roi_percent: parseFloat(globalROI.toFixed(1)),
                open_rate: parseFloat(globalOpenRate.toFixed(1)),
                conversion_rate: parseFloat(globalConvRate.toFixed(1)),
                tracked_batches_count: trackedBatches.length,
                top_category: topCategoryByRevenue,
                top_category_revenue_val: parseFloat(topCategoryRevVal.toFixed(2)),
                top_category_efficiency: topCategoryByEfficiency,
                top_category_efficiency_val: parseFloat(topCategoryEffVal.toFixed(2))
            },
            category_stats: categoryStats,
            batches: batchesArray
        };

        return res.json(resultData);
    } catch (err) {
        console.error('❌ getAdvancedCampaignStats error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/campaigns/recommendations-ai
// Assistant IA de Recommandation de Campagne basé sur les statistiques
// ============================================================
const getCampaignRecommendationsAI = async (req, res) => {
    let commerceId = req.query.commerce_id || COMMERCE_ID;
    if (commerceId === '__all__') {
        commerceId = COMMERCE_ID;
    }

    try {
        const db = await connectDB();

        // 1. Paramètres configurables (settings -> process.env -> fallback codé en dur)
        const brandId = extractBrandId(commerceId);
        const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId }) || {};

        const ENV_BIRTHDAY_WINDOW = parseInt(process.env.BIRTHDAY_WINDOW_DAYS, 10) || 15;
        const ENV_BIRTHDAY_COOLDOWN = parseInt(process.env.BIRTHDAY_COOLDOWN_DAYS, 10) || 300;

        const birthdayWindowDays = settings.birthday_window_days || ENV_BIRTHDAY_WINDOW;
        const birthdayCooldownDays = settings.birthday_cooldown_days || ENV_BIRTHDAY_COOLDOWN;
        const cooldownDays = settings.cooldown_days_ai || parseInt(process.env.COOLDOWN_DAYS, 10) || 14;

        const clientsAnalyses = await db.collection('analyses_ia')
            .find({ commerce_id: commerceId })
            .toArray();

        const FAILED_STATUSES = ['failed', 'failed_auto', 'failed_batch', 'failed_rgpd', 'error', 'canceled', 'cancelled'];

        // Exclusions récentes sur 14 jours (anti-fatigue globale, hors échecs)
        const fourteenDaysAgo = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString();
        const recentCampaigns = await db.collection('campagnes_envoyees')
            .find({
                commerce_id: commerceId,
                sent_at: { $gte: fourteenDaysAgo },
                status: { $nin: FAILED_STATUSES }
            })
            .toArray();

        const recentlyContactedEmails = new Set(
            recentCampaigns.map(c => (c.client_email ? c.client_email.toLowerCase().trim() : '')).filter(Boolean)
        );

        // Exclusions spécifiques pour les anniversaires (300 jours anti-duplication, hors échecs)
        const birthdayCooldownCutoff = new Date(Date.now() - birthdayCooldownDays * 24 * 60 * 60 * 1000).toISOString();
        const recentBirthdayCampaigns = await db.collection('campagnes_envoyees')
            .find({
                commerce_id: commerceId,
                sent_at: { $gte: birthdayCooldownCutoff },
                status: { $nin: FAILED_STATUSES },
                $or: [
                    { category: 'birthday_gift' },
                    { category: 'shop_anniversary' },
                    { subject: { $regex: /anniversaire/i } }
                ]
            })
            .toArray();

        const recentBirthdayAutomations = await db.collection('automations_logs')
            .find({
                commerce_id: commerceId,
                timestamp: { $gte: birthdayCooldownCutoff },
                status: { $nin: FAILED_STATUSES },
                $or: [
                    { type: 'birthday' },
                    { type: 'anniversary' },
                    { message: { $regex: /anniversaire/i } }
                ]
            })
            .toArray();

        const birthdayContactedEmails = new Set();
        recentBirthdayCampaigns.forEach(c => {
            if (c.client_email) birthdayContactedEmails.add(c.client_email.toLowerCase().trim());
        });
        recentBirthdayAutomations.forEach(a => {
            if (a.client_email) birthdayContactedEmails.add(a.client_email.toLowerCase().trim());
        });

        // Helper de validation de la fenêtre d'anniversaire (±birthdayWindowDays autour d'aujourd'hui)
        const isBirthdayInWindow = (dateStr) => {
            if (!dateStr) return false;
            const birthDate = new Date(dateStr);
            if (isNaN(birthDate.getTime())) return false;

            const today = new Date();
            const currentYear = today.getFullYear();

            const birthThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
            const diffDays = Math.round((birthThisYear.getTime() - today.getTime()) / (1000 * 3600 * 24));

            if (Math.abs(diffDays) <= birthdayWindowDays) return true;

            const birthNextYear = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
            const diffNextDays = Math.round((birthNextYear.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (Math.abs(diffNextDays) <= birthdayWindowDays) return true;

            const birthPrevYear = new Date(currentYear - 1, birthDate.getMonth(), birthDate.getDate());
            const diffPrevDays = Math.round((birthPrevYear.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (Math.abs(diffPrevDays) <= birthdayWindowDays) return true;

            return false;
        };

        const categoryTitles = {
            birthday_gift: 'Anniversaire Boutique & Client',
            vip_danger: 'Rétention VIP à Risque',
            ambassador_invite: 'Programme Ambassadeurs & Parrainage',
            baisse_frequence: 'Relance Baisse de Fréquence',
            lost: 'Reconquête Clients Perdus',
            at_risk: 'Prévention Churn Client',
            vip: 'Fidélisation VIP',
            regular: 'Offre Régulière'
        };

        const eligibleByCategory = {
            birthday_gift: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return em && isBirthdayInWindow(c.date_naissance) && !birthdayContactedEmails.has(em) && !recentlyContactedEmails.has(em);
            }),
            vip_danger: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return (c.segment_gmm === 'vip' || (c.probabilities_gmm && c.probabilities_gmm.vip > 0.3)) && (parseFloat(c.churn_score || 0) >= 0.55) && em && !recentlyContactedEmails.has(em);
            }),
            ambassador_invite: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return ((parseFloat(c.influence_score || 0) >= 80) || ((c.score_global_sa || 0) >= 0.8)) && em && !recentlyContactedEmails.has(em);
            }),
            baisse_frequence: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return c.baisse_frequence_detectee === true && em && !recentlyContactedEmails.has(em);
            }),
            lost: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return (c.segment_gmm === 'lost' || (parseFloat(c.churn_score || 0) >= 0.75)) && em && !recentlyContactedEmails.has(em);
            }),
            at_risk: clientsAnalyses.filter(c => {
                const em = (c.email || '').toLowerCase().trim();
                return (c.segment_gmm === 'at_risk' || (parseFloat(c.churn_score || 0) >= 0.55)) && em && !recentlyContactedEmails.has(em);
            })
        };

        // Calcul du Potentiel Financier Attendu (ROI Score)
        const categoryWeights = {
            vip_danger: { weight: 1.6, estConv: 25.0 },
            birthday_gift: { weight: 1.4, estConv: 24.1 },
            baisse_frequence: { weight: 1.2, estConv: 20.0 },
            ambassador_invite: { weight: 1.1, estConv: 22.0 },
            at_risk: { weight: 1.0, estConv: 18.0 },
            lost: { weight: 0.8, estConv: 12.0 }
        };

        let chosenCat = null;
        let maxPotentialScore = -1;
        let candidateEvaluations = [];

        for (const [catKey, list] of Object.entries(eligibleByCategory)) {
            if (list.length === 0) continue;

            const config = categoryWeights[catKey] || { weight: 1.0, estConv: 15.0 };
            const avgMonetary = list.reduce((acc, c) => acc + parseFloat(c.monetary || c.total_spent || 50), 0) / list.length;
            const expectedCA = list.length * avgMonetary * (config.estConv / 100);
            const score = expectedCA * config.weight;

            candidateEvaluations.push({
                category: catKey,
                count: list.length,
                expectedCA: parseFloat(expectedCA.toFixed(2)),
                score: parseFloat(score.toFixed(2)),
                estConv: config.estConv
            });

            if (score > maxPotentialScore) {
                maxPotentialScore = score;
                chosenCat = catKey;
            }
        }

        if (!chosenCat || maxPotentialScore <= 0) {
            return res.json({
                recommended_category: 'none',
                title: 'Toutes les campagnes sont à jour ✨',
                eligible_count: 0,
                days_without_offer: 0,
                reasoning: `Tous vos clients éligibles ont déjà été contactés au cours des ${cooldownDays} derniers jours (ou dans la fenêtre de ${birthdayCooldownDays} jours pour les anniversaires). Aucune relance supplémentaire n'est requise.`,
                sample_clients: [],
                target_clients: [],
                conversion_rate_estimate: 0,
                prefilled_subject: '',
                prefilled_body: ''
            });
        }

        const title = categoryTitles[chosenCat] || 'Fidélisation Ciblée';

        const eligibleList = (eligibleByCategory[chosenCat] || [])
            .filter(c => c.email && c.email.includes('@'))
            .map(c => ({
                email: c.email.toLowerCase().trim(),
                nom: c.nom || c.client_nom || c.email || 'Client',
                segment: c.segment_gmm || c.segment || 'standard',
                monetary_total: parseFloat(c.monetary || c.total_spent || 0),
                monetary_avg: parseFloat(c.monetary_score || c.monetary_avg || 0),
                recency_days: parseFloat(c.recency || c.recency_days || 0),
                churn_score: parseFloat(c.churn_score || 0),
                influence_score: parseFloat(c.influence_score || 0)
            }));

        const selectedEval = candidateEvaluations.find(e => e.category === chosenCat);
        const estCA = selectedEval ? selectedEval.expectedCA : 0;

        const reasoning = `Sélectionné parmi ${candidateEvaluations.length} opportunité(s) analysée(s) : la stratégie '${title}' présente le plus fort potentiel d'engagement direct et de CA attendu (~${estCA} DT). ${eligibleList.length} client(s) éligible(s) qualifié(s).`;

        const TEMPLATES = {
            birthday_gift: {
                subject: "🎁 Offre Anniversaire spéciale pour vous !",
                body: "Bonjour {nom},\n\nPour fêter votre anniversaire comme il se doit, nous vous offrons une remise spéciale de 20% sur votre prochain passage !\n\nPrésentez simplement ce message en caisse pour en profiter.\n\nÀ très vite ! 🎈"
            },
            shop_anniversary: {
                subject: "🎂 Fêtons ensemble l'anniversaire de notre boutique !",
                body: "Bonjour {nom},\n\nNotre boutique fête un événement spécial et nous souhaitons vous remercier pour votre fidélité avec une offre exclusive de 20% sur l'ensemble du magasin.\n\nCode promo : ANNIV20\n\nAu plaisir de vous accueillir !"
            },
            vip_danger: {
                subject: "⭐ Privilège exclusif pour nos clients VIP",
                body: "Bonjour {nom},\n\nEn tant que client VIP privilégié, votre expérience chez nous est primordiale.\n\nNous vous invitons à venir profiter d'une offre réservée exclusivement à nos membres VIP lors de votre prochaine visite.\n\nÀ bientôt !"
            },
            baisse_frequence: {
                subject: "☕ Votre pause habituelle vous attend !",
                body: "Bonjour {nom},\n\nNous avons remarqué que cela fait quelques temps que vous n'êtes pas venu(e) nous voir !\n\nPour votre retour, profitez d'une remise de 15% valable dès aujourd'hui.\n\nAu plaisir de vous revoir très bientôt !"
            },
            ambassador_invite: {
                subject: "👑 Devenez Ambassadeur Officiel !",
                body: "Bonjour {nom},\n\nGrâce à votre grande fidélité, nous vous proposons d'intégrer notre cercle d'Ambassadeurs privilégiés !\n\nBénéficiez d'avantages exclusifs et d'invitations à des événements privés toute l'année.\n\nL'équipe Retenza 🌟"
            },
            lost: {
                subject: "🛒 Une surprise spéciale pour votre retour !",
                body: "Bonjour {nom},\n\nVous nous manquez ! Pour vous accueillir de nouveau dans les meilleures conditions, voici un bon de réduction de 20% valable sur votre prochaine visite.\n\nÀ très vite ! 💛"
            },
            at_risk: {
                subject: "⚡ Offre privilégiée retour client",
                body: "Bonjour {nom},\n\nProfitez d'une remise exclusive lors de votre prochain passage dans notre établissement.\n\nÀ très bientôt !"
            }
        };

        const defaultTpl = {
            subject: `🎁 Offre exclusive : ${title}`,
            body: `Bonjour {nom},\n\nNous sommes ravis de vous compter parmi nos clients fidèles. Profitez d'une offre privilégiée lors de votre passage !\n\nÀ très vite !`
        };

        const template = TEMPLATES[chosenCat] || defaultTpl;
        let conversionEstimate = selectedEval ? selectedEval.estConv : 20.0;

        return res.json({
            recommended_category: chosenCat,
            title: title,
            eligible_count: eligibleList.length,
            days_without_offer: cooldownDays,
            reasoning: reasoning,
            sample_clients: eligibleList.slice(0, 10),
            target_clients: eligibleList,
            prefilled_subject: template.subject,
            prefilled_body: template.body,
            conversion_rate_estimate: conversionEstimate
        });
    } catch (err) {
        console.error('❌ getCampaignRecommendationsAI error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/commandes/add
// Enregistre une commande et invalide immédiatement le cache des stats
// ============================================================
const addCommande = async (req, res) => {
    try {
        const db = await connectDB();
        const {
            commerce_id,
            client_email,
            client_id,
            numero_commande,
            statut = 'livre',
            date_commande,
            montant_total,
            produits = [],
            // Signaux bruts de fraude — collectés uniquement, aucune logique de scoring ici
            device_id_commande: deviceIdFromBody = null
        } = req.body;

        // IP capturée au niveau du contrôleur (X-Forwarded-For → req.ip → socket)
        const ipCommande = getClientIp(req) || null;

        if (!client_email && !client_id) {
            return res.status(400).json({ error: 'client_email ou client_id requis' });
        }
        if (!montant_total || isNaN(parseFloat(montant_total))) {
            return res.status(400).json({ error: 'montant_total (numérique) requis' });
        }

        const doc = {
            commerce_id: commerce_id || COMMERCE_ID,
            client_email: client_email ? client_email.toLowerCase().trim() : null,
            client_id: client_id || null,
            numero_commande: numero_commande || `CMD-${Date.now()}`,
            statut,
            date_commande: date_commande ? new Date(date_commande) : new Date(),
            montant_total: parseFloat(montant_total),
            produits,
            // ── Signaux bruts anti-fraude (collecte uniquement) ──────────────────
            ip_commande: ipCommande,
            device_id_commande: deviceIdFromBody || null
        };

        const result = await db.collection('commandes').insertOne(doc);

        // Invalider immédiatement le cache des statistiques avancées
        clearStatsCache();

        // ── Hook Cross-Sell : déclenchement asynchrone non-bloquant ────────────
        // L'appel est "fire and forget" : une erreur ici ne fait jamais échouer
        // la réponse renvoyée à l'appelant (caisse ou API partenaire).
        if (doc.client_email && Array.isArray(doc.produits) && doc.produits.length > 0) {
            const { triggerCrossSellPush } = require('./crossSellController');
            setImmediate(() => {
                triggerCrossSellPush(doc, db).catch(err =>
                    console.error('[CROSS-SELL] Erreur hook post-caisse :', err.message)
                );
            });
        }
        // ── Fin hook Cross-Sell ──────────────────────────────────────────────

        return res.json({
            status: 'success',
            message: `Commande ${doc.numero_commande} enregistrée et cache des stats invalidé.`,
            inserted_id: result.insertedId
        });
    } catch (err) {
        console.error('❌ addCommande error :', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/clients/:id/location
 * Met à jour les coordonnées géographiques (Point GeoJSON) d'un client.
 * Garantit une réponse HTTP (200, 400, 404, 500) sur l'ensemble des branches.
 */
const updateClientLocation = async (req, res) => {
    try {
        const { id } = req.params || {};
        if (!id) {
            return res.status(400).json({ status: 'error', error: 'Identifiant client (:id) requis.' });
        }

        const body = req.body || {};

        let lng = body.longitude !== undefined ? parseFloat(body.longitude) : (body.location?.coordinates?.[0] !== undefined ? parseFloat(body.location.coordinates[0]) : (body.lng !== undefined ? parseFloat(body.lng) : NaN));
        let lat = body.latitude !== undefined ? parseFloat(body.latitude) : (body.location?.coordinates?.[1] !== undefined ? parseFloat(body.location.coordinates[1]) : (body.lat !== undefined ? parseFloat(body.lat) : NaN));

        if (isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ status: 'error', error: 'Longitude invalide. Doit être un nombre compris entre -180 et 180.' });
        }
        if (isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ status: 'error', error: 'Latitude invalide. Doit être un nombre compris entre -90 et 90.' });
        }

        const db = await connectDB();

        try {
            await db.collection('clients').createIndex({ location: "2dsphere" });
        } catch (indexErr) {
            console.warn('[CLIENT-GEO] Info création index 2dsphere :', indexErr.message);
        }

        const locationGeoJSON = {
            type: "Point",
            coordinates: [lng, lat]
        };

        const { ObjectId } = require('mongodb');
        let filter;
        if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
            filter = { $or: [{ _id: new ObjectId(id) }, { email: id.toLowerCase() }, { client_id: id }] };
        } else {
            filter = { $or: [{ email: id.toLowerCase() }, { client_id: id }] };
        }

        const result = await db.collection('clients').updateOne(
            filter,
            { $set: { location: locationGeoJSON, updated_at: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: 'error', error: `Client "${id}" introuvable.` });
        }

        return res.json({
            status: 'success',
            message: 'Position géographique du client mise à jour avec succès.',
            data: {
                client_id: id,
                location: locationGeoJSON
            }
        });
    } catch (err) {
        console.error('❌ updateClientLocation error :', err.message);
        return res.status(500).json({ status: 'error', error: err.message || 'Erreur serveur interne lors de la mise à jour de la localisation.' });
    }
};

// ============================================================
// CRON MENSUEL : Export Comptable Automatisé
// ============================================================
const runMonthlyAccountingExport = async (commerceId, db) => {
    try {
        const brandId = extractBrandId(commerceId);
        const settings = await db.collection('commerces_settings').findOne({ brand_id: brandId });
        if (!settings || !settings.accountant_email) {
            return { status: 'skip', message: 'Aucun email comptable configuré' };
        }

        const email = settings.accountant_email.trim();

        // Obtenir le premier et le dernier jour du mois précédent
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Récupérer les ventes du mois précédent
        const filter = {
            commerce_id: commerceId,
            date_commande: { $gte: startOfLastMonth.toISOString(), $lte: endOfLastMonth.toISOString() }
        };
        const commandes = await db.collection('commandes').find(filter).sort({ date_commande: 1 }).toArray();

        const txFilter = {
            commerce_id: commerceId,
            date_transaction: { $gte: startOfLastMonth.toISOString(), $lte: endOfLastMonth.toISOString() }
        };
        const transactions = await db.collection('transactions').find(txFilter).sort({ date_transaction: 1 }).toArray();

        const allSales = [];
        commandes.forEach(c => allSales.push({ ...c, type_source: 'commande', date: c.date_commande }));
        transactions.forEach(t => allSales.push({ ...t, type_source: 'transaction', date: t.date_transaction }));
        allSales.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (allSales.length === 0) {
            return { status: 'skip', message: 'Aucune transaction sur le mois précédent' };
        }

        const TVA_RATE = 0.19;
        let csv = '\uFEFFDate Comptable;N Pièce;Code Journal;Compte;Libellé;Débit;Crédit;Moyen de Paiement\n';

        allSales.forEach(sale => {
            const dateStr = (sale.date || '').substring(0, 10);
            const piece = sale.commande_id || sale._id.toString();
            const journal = 'VT';
            const paymentMethod = sale.moyen_paiement || sale.payment_method || 'Non Spécifié';

            const ttc = parseFloat(sale.montant || sale.montant_total || sale.total || 0);
            if (ttc === 0) return;

            const ht = ttc / (1 + TVA_RATE);
            const tva = ttc - ht;

            csv += `${dateStr};${piece};${journal};411;Client ${sale.client_email || sale.client_id || 'Divers'};${ttc.toFixed(2)};0;${paymentMethod}\n`;
            csv += `${dateStr};${piece};${journal};707;Vente de marchandises;0;${ht.toFixed(2)};${paymentMethod}\n`;
            csv += `${dateStr};${piece};${journal};44571;TVA collectée;0;${tva.toFixed(2)};${paymentMethod}\n`;
        });

        // Envoi par email
        const { sendEmail } = require('../utils/emailService');
        const monthName = startOfLastMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        const filename = `export_comptable_${commerceId}_${startOfLastMonth.toISOString().slice(0, 7)}.csv`;

        await sendEmail({
            to: email,
            subject: `[Ratenza] Export Comptable Mensuel - ${monthName} (${commerceId})`,
            text: `Bonjour,\n\nVeuillez trouver en pièce jointe l'export comptable (Grand Livre des Ventes) pour la boutique ${commerceId} pour la période de ${monthName}.\n\nTotal des transactions : ${allSales.length}\n\nCordialement,\nL'équipe Ratenza.`,
            attachments: [
                {
                    filename: filename,
                    content: csv,
                    contentType: 'text/csv'
                }
            ]
        });

        return { status: 'success', message: `Export comptable envoyé à ${email} avec ${allSales.length} lignes` };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
};

module.exports = {
    getRFMData,
    getClientTransactions,
    recalculateRFM,
    sendCampaignEmail,
    getClientCampaignHistory,
    sendGroupCampaign,
    triggerSmartAutomation,
    getAutomationStatus,
    runSmartAutomationInternal,
    getCommerces,
    getGlobalComparison,
    getReturnRate,
    getRecommendations,
    optOutRGPD,
    optInRGPD,
    getCommerceSettings,
    updateCommerceSettings,
    sendShopAnniversaryCampaign,
    triggerShopAnniversary,
    getFraudAlerts,
    getRGPDPortalToken,
    getRGPDPortalData,
    updateRGPDPortalData,
    exportClientsCSV,
    exportCampaignsCSV,
    exportGlobalCSV,
    exportDashboardCSV,
    exportAccountingCSV,
    trackCampaignOpen,
    getAdvancedCampaignStats,
    getCampaignRecommendationsAI,
    addCommande,
    updateClientLocation,
    runMonthlyAccountingExport
};
