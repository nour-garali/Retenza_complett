const connectDB = require('../config/db');

/**
 * GET /api/chatbot/blocks
 * Récupère la liste de tous les clients bloqués.
 */
const getBlockedClients = async (req, res) => {
    const { commerce_id } = req.query;

    try {
        const db = await connectDB();
        const query = { is_blocked: true };
        
        if (commerce_id && commerce_id !== '__all__') {
            if (commerce_id.startsWith('commerce_local')) {
                query.commerce_id = { $regex: /^commerce_local/i };
            } else {
                query.commerce_id = commerce_id;
            }
        }

        const blockedList = await db.collection('chatbot_status')
            .find(query)
            .sort({ blocked_at: -1 })
            .toArray();

        return res.json({
            status: 'success',
            data: blockedList
        });
    } catch (err) {
        console.error('❌ Error getBlockedClients:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * Helper de formatage des messages avec fallback séquentiel du champ channel
 */
const formatConversationMessages = (rawMessages = []) => {
    let hasSupportMessageSoFar = false;

    return rawMessages.map((m) => {
        let actualContent = m.text || m.message || m.user_message || m.bot_message || m.content || '';
        let timestampStr = m.timestamp || m.date || '';

        const isSupportMessage = m.role === 'support' || m.role === 'client_support';
        if (isSupportMessage) {
            hasSupportMessageSoFar = true;
        }

        // Rétrocompatibilité et fallback séquentiel du champ channel
        let resolvedChannel = m.channel;
        if (!resolvedChannel) {
            if (isSupportMessage) {
                resolvedChannel = 'support';
            } else if (m.role === 'assistant') {
                resolvedChannel = 'bot';
            } else if (m.role === 'user') {
                resolvedChannel = hasSupportMessageSoFar ? 'support' : 'bot';
            } else {
                resolvedChannel = 'bot';
            }
        }

        if (typeof actualContent === 'string') {
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(actualContent)) {
                if (!timestampStr) timestampStr = actualContent;
                actualContent = m.text || m.message || '';
            }
            actualContent = actualContent.replace(/^🎧\s*\[Conseiller Support\]\s*:\s*/i, '').trim();
        }

        let formattedTime = '';
        if (timestampStr) {
            try {
                const dt = new Date(timestampStr);
                if (!isNaN(dt.getTime())) {
                    formattedTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (typeof timestampStr === 'string' && timestampStr.includes('T')) {
                    formattedTime = timestampStr.split('T')[1].substring(0, 5);
                } else {
                    formattedTime = String(timestampStr);
                }
            } catch (e) {
                formattedTime = String(timestampStr);
            }
        }

        return {
            role: m.role === 'client_support' ? 'user' : (m.role || 'assistant'),
            channel: resolvedChannel,
            content: actualContent || '[Message]',
            timestamp: formattedTime
        };
    });
};

/**
 * GET /api/chatbot/conversation/:email
 * Récupère l'historique complet des messages pour un client.
 */
const getConversation = async (req, res) => {
    const { email } = req.params;
    const { commerce_id, session_id } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email requis.' });
    }

    try {
        const db = await connectDB();
        const query = { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } };
        
        if (commerce_id && commerce_id !== '__all__') {
            query.commerce_id = commerce_id;
        }

        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            query.session_id = session_id;
        }

        let conv = await db.collection('chatbot_conversations').findOne(query);

        // Fallback si la session_id spécifique n'est pas trouvée
        if (!conv && session_id) {
            delete query.session_id;
            conv = await db.collection('chatbot_conversations').findOne(query, { sort: { updated_at: -1 } });
        }

        const rawMessages = conv ? (conv.messages || []) : [];
        const formattedMessages = formatConversationMessages(rawMessages);

        return res.json({
            status: 'success',
            data: formattedMessages
        });
    } catch (err) {
        console.error('❌ Error getConversation:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/unblock
 * Débloque un client (remet les warnings à 0 et is_blocked à false).
 */
const unblockClient = async (req, res) => {
    const { email, commerce_id } = req.body;

    if (!email || !commerce_id) {
        return res.status(400).json({ error: 'Email et commerce_id requis.' });
    }

    try {
        const db = await connectDB();

        await db.collection('chatbot_status').updateOne(
            {
                email: { $regex: new RegExp(`^${email}$`, 'i') },
                commerce_id
            },
            {
                $set: {
                    email: email.toLowerCase(),
                    commerce_id,
                    warnings: 0,
                    is_blocked: false,
                    blocked_at: null,
                    block_reason: null
                }
            },
            { upsert: true }
        );

        return res.json({
            status: 'success',
            message: `Le client ${email} a été débloqué avec succès.`
        });
    } catch (err) {
        console.error('❌ Error unblockClient:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/audit-logs
 * Récupère le journal d'audit des infractions, avertissements et événements de modération.
 * Supporte commerce_id et period (7d | 30d | 90d | all)
 */
const getAuditLogs = async (req, res) => {
    const { commerce_id, period, limit = 500 } = req.query;

    try {
        const db = await connectDB();
        const query = {};
        if (commerce_id && commerce_id !== '__all__') {
            query.commerce_id = commerce_id;
        }

        if (period && period !== 'all') {
            const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
            const days = daysMap[period];
            if (days) {
                const since = new Date();
                since.setDate(since.getDate() - days);
                query.timestamp = { $gte: since.toISOString() };
            }
        }

        // 1. Récupérer les entrées directes de la collection audit_logs
        let logs = await db.collection('audit_logs')
            .find(query)
            .sort({ timestamp: -1, _id: -1 })
            .limit(parseInt(limit, 10))
            .toArray();

        // 2. Extraire l'historique des warnings depuis chatbot_status s'il existe
        const statusQuery = { warnings_history: { $exists: true, $not: { $size: 0 } } };
        if (commerce_id && commerce_id !== '__all__') {
            statusQuery.commerce_id = commerce_id;
        }

        const statuses = await db.collection('chatbot_status').find(statusQuery).toArray();
        const synthesizedLogs = [];

        for (const st of statuses) {
            if (Array.isArray(st.warnings_history)) {
                for (const w of st.warnings_history) {
                    const wTime = w.timestamp || st.blocked_at || new Date().toISOString();
                    if (period && period !== 'all') {
                        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
                        const days = daysMap[period];
                        if (days) {
                            const since = new Date();
                            since.setDate(since.getDate() - days);
                            if (new Date(wTime) < since) continue;
                        }
                    }
                    synthesizedLogs.push({
                        _id: `status_${st._id}_${wTime}`,
                        timestamp: wTime,
                        type: st.is_blocked ? 'BLOCK' : 'WARNING',
                        email: st.email,
                        commerce_id: st.commerce_id,
                        details: `Message: "${w.text || 'Message inapproprié'}" — Catégorie: ${w.category || 'INAPPROPRIÉ'} (Sévérité: ${w.severity || 'LOW'})`
                    });
                }
            }
        }

        const allLogs = [...logs, ...synthesizedLogs];
        allLogs.sort((a, b) => new Date(b.timestamp || b.occurred_at || 0) - new Date(a.timestamp || a.occurred_at || 0));

        return res.json({
            status: 'success',
            data: allLogs.slice(0, parseInt(limit, 10))
        });
    } catch (err) {
        console.error('❌ Error getAuditLogs:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/support-tickets
 * Récupère les tickets d'escalade humaine créés par le chatbot.
 */
const getSupportTickets = async (req, res) => {
    const { commerce_id, email, limit = 50 } = req.query;

    try {
        const db = await connectDB();
        const query = {};
        if (commerce_id && commerce_id !== '__all__') {
            if (commerce_id.startsWith('commerce_local')) {
                query.commerce_id = { $regex: /^commerce_local/i };
            } else {
                query.commerce_id = commerce_id;
            }
        }
        // Filtre par email (utilisé côté client pour retrouver ses propres tickets)
        if (email) {
            query.email = { $regex: new RegExp(`^${email.trim()}$`, 'i') };
        }

        const unreadCount = await db.collection('support_tickets').countDocuments({
            ...query,
            unread_by_admin: true,
            status: { $ne: 'CLOSED' }
        });

        const tickets = await db.collection('support_tickets')
            .find(query)
            .sort({ unread_by_admin: -1, last_message_at: -1, created_at: -1 })
            .limit(parseInt(limit, 10))
            .toArray();

        return res.json({
            status: 'success',
            data: tickets,
            unread_tickets_count: unreadCount
        });
    } catch (err) {
        console.error('❌ Error getSupportTickets:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/chatbot/support-tickets/:id/read
 * Marque un ticket d'escalade comme lu par l'administrateur.
 */
const markSupportTicketRead = async (req, res) => {
    const { id } = req.params;

    try {
        const { ObjectId } = require('mongodb');
        const db = await connectDB();
        let ticketId;
        try {
            ticketId = new ObjectId(id);
        } catch (e) {
            ticketId = id;
        }

        await db.collection('support_tickets').updateOne(
            { _id: ticketId },
            {
                $set: {
                    unread_by_admin: false,
                    unread_count: 0,
                    admin_last_read_at: new Date().toISOString()
                }
            }
        );

        return res.json({
            status: 'success',
            message: 'Ticket marqué comme lu avec succès.'
        });
    } catch (err) {
        console.error('❌ Error markSupportTicketRead:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/chatbot/support-tickets/:id
 * Met à jour le statut d'un ticket d'escalade (OPEN, IN_PROGRESS, CLOSED).
 */
const updateSupportTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide (OPEN, IN_PROGRESS, CLOSED requis).' });
    }

    try {
        const { ObjectId } = require('mongodb');
        const db = await connectDB();
        let ticketId;
        try {
            ticketId = new ObjectId(id);
        } catch (e) {
            ticketId = id;
        }

        const result = await db.collection('support_tickets').updateOne(
            { _id: ticketId },
            { $set: { status, updated_at: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Ticket non trouvé.' });
        }

        return res.json({
            status: 'success',
            message: `Statut du ticket mis à jour vers ${status}.`
        });
    } catch (err) {
        console.error('❌ Error updateSupportTicketStatus:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/language-feedbacks
 * Récupère les retours/signalements de langue inadaptée.
 */
const getLanguageFeedbacks = async (req, res) => {
    const { commerce_id, limit = 50 } = req.query;

    try {
        const db = await connectDB();
        const query = {};
        if (commerce_id && commerce_id !== '__all__') {
            query.commerce_id = commerce_id;
        }

        const feedbacks = await db.collection('chatbot_language_feedbacks')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit, 10))
            .toArray();

        return res.json({
            status: 'success',
            data: feedbacks
        });
    } catch (err) {
        console.error('❌ Error getLanguageFeedbacks:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/metrics
 * Récupère les métriques de santé et de performance du Chatbot SAV.
 * Supporte les filtres : commerce_id, period (7d | 30d | 90d | all)
 */
const getChatbotMetrics = async (req, res) => {
    const { commerce_id, period } = req.query;

    try {
        const db = await connectDB();

        // ─── Filtre boutique ───────────────────────────────────────────────────────
        const baseQuery = {};
        if (commerce_id && commerce_id !== '__all__') {
            baseQuery.commerce_id = commerce_id;
        }

        // ─── Filtre période ────────────────────────────────────────────────────────
        let dateFilter = null;
        if (period && period !== 'all') {
            const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
            const days = daysMap[period];
            if (days) {
                const since = new Date();
                since.setDate(since.getDate() - days);
                dateFilter = since;
            }
        }

        // Construit un filtre date pour un champ donné
        const withDate = (field) => {
            if (!dateFilter) return { ...baseQuery };
            return { ...baseQuery, [field]: { $gte: dateFilter } };
        };

        const [
            totalTickets,
            openTickets,
            totalMessageFeedbacks,
            totalLanguageFeedbacks,
            totalBlocked,
            totalAuditLogs,
            conversationsCount
        ] = await Promise.all([
            db.collection('support_tickets').countDocuments(withDate('created_at')),
            db.collection('support_tickets').countDocuments({ ...withDate('created_at'), status: 'OPEN' }),
            db.collection('chatbot_message_feedbacks').countDocuments(withDate('timestamp')),
            db.collection('chatbot_language_feedbacks').countDocuments(withDate('timestamp')),
            db.collection('chatbot_status').countDocuments({ ...withDate('blocked_at'), is_blocked: true }),
            db.collection('audit_logs').countDocuments(withDate('timestamp')),
            db.collection('chatbot_conversations').countDocuments(withDate('created_at'))
        ]);

        return res.json({
            status: 'success',
            metrics: {
                total_tickets: totalTickets,
                open_tickets: openTickets,
                total_feedbacks: totalMessageFeedbacks,
                total_language_feedbacks: totalLanguageFeedbacks,
                total_blocked: totalBlocked,
                total_audit_logs: totalAuditLogs,
                total_conversations: conversationsCount,
                health: 'HEALTHY'
            }
        });
    } catch (err) {
        console.error('❌ Error getChatbotMetrics:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/message-feedback
 * Enregistre ou met à jour le feedback (J'aime / Je n'aime pas) d'un message chatbot.
 * Si le feedback est ré-exécuté avec la même valeur (toggle off), il est retiré.
 */
const saveMessageFeedback = async (req, res) => {
    const { email, commerce_id, commerce_name, session_id, message_id, msg_id, message_idx, feedback, text } = req.body || {};

    try {
        const db = await connectDB();
        const timestamp = new Date().toISOString();
        const cleanEmail = (email || 'anonymous').trim().toLowerCase();
        const cleanCommerceId = commerce_id || 'unknown';
        const cleanSessionId = session_id || 'unknown';
        const targetMessageId = message_id || msg_id || null;
        const targetText = text ? text.substring(0, 300) : '';

        // 1. Déterminer le filtre d'identification unique du message
        let filter = null;
        if (targetMessageId) {
            filter = { email: cleanEmail, commerce_id: cleanCommerceId, message_id: targetMessageId };
        } else if (cleanSessionId !== 'unknown' && message_idx !== undefined && message_idx !== null && Number(message_idx) > 0) {
            filter = { email: cleanEmail, commerce_id: cleanCommerceId, session_id: cleanSessionId, message_idx: Number(message_idx) };
        } else if (cleanSessionId !== 'unknown' && targetText) {
            filter = { email: cleanEmail, commerce_id: cleanCommerceId, session_id: cleanSessionId, text: targetText };
        } else if (targetText) {
            filter = { email: cleanEmail, commerce_id: cleanCommerceId, text: targetText };
        } else {
            filter = { email: cleanEmail, commerce_id: cleanCommerceId, session_id: cleanSessionId };
        }

        // 2. Si le feedback est réinitialisé / annulé (null, 'none', ''), SUPPRIMER la réaction existante
        if (!feedback || feedback === 'none' || feedback === 'null' || feedback === 'remove') {
            await db.collection('chatbot_message_feedbacks').deleteMany(filter);
            return res.json({ status: 'success', message: 'Feedback réinitialisé avec succès !' });
        }

        // 3. Sinon ('like' ou 'dislike') : UPSERT (update si existe déjà pour ce message, insert sinon)
        const activeFeedback = feedback === 'dislike' ? 'dislike' : 'like';
        const updateDoc = {
            timestamp,
            email: cleanEmail,
            commerce_id: cleanCommerceId,
            session_id: cleanSessionId,
            message_idx: message_idx || 0,
            feedback: activeFeedback,
            text: targetText
        };
        if (commerce_name) updateDoc.commerce_name = commerce_name;
        if (targetMessageId) {
            updateDoc.message_id = targetMessageId;
        }

        await db.collection('chatbot_message_feedbacks').updateOne(
            filter,
            { $set: updateDoc },
            { upsert: true }
        );

        // 4. Enregistrer aussi dans audit_logs pour visibilité dans l'interface de modération
        const feedbackLabel = (activeFeedback === 'like') ? '👍 J\'aime' : '👎 Je n\'aime pas';
        await db.collection('audit_logs').insertOne({
            timestamp,
            type: 'MESSAGE_FEEDBACK',
            email: cleanEmail,
            commerce_id: cleanCommerceId,
            session_id: cleanSessionId,
            details: `${feedbackLabel} sur le message #${message_idx || 0} (${(targetText || targetMessageId || 'chatbot').substring(0, 30)})`
        });

        return res.json({ status: 'success', message: 'Feedback enregistré avec succès !' });
    } catch (err) {
        console.error('❌ Error saveMessageFeedback:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/stream
 * Gère le streaming mot par mot (SSE) de la réponse du chatbot.
 */
const streamChat = async (req, res) => {
    const { user_message, email, commerce_id, commerce_name, client_name, history, session_id } = req.body || {};

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) {
        res.flushHeaders();
    }

    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    let venvPython = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
    if (!fs.existsSync(venvPython)) {
        venvPython = 'python';
    }
    const bridgeScript = path.join(__dirname, '..', 'chatbot_stream_bridge.py');

    const payload = JSON.stringify({
        user_message: user_message || '',
        email: email || 'ghofrane.khadhar@gmail.com',
        commerce_id: commerce_id || 'commerce_local_1',
        commerce_name: commerce_name || 'Boutique Tunis',
        client_name: client_name || 'Ghofrane',
        history: history || [],
        session_id: session_id || null
    });

    const pythonProcess = spawn(venvPython, [bridgeScript], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    pythonProcess.stdin.write(payload);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        const text = data.toString('utf-8');
        res.write(text);
    });

    pythonProcess.stderr.on('data', (data) => {
        const errText = data.toString('utf-8');
        if (errText.includes('ERROR') || errText.includes('Exception') || errText.includes('Traceback')) {
            console.error('🐍 [Python Bridge Error]:', errText);
        }
    });

    pythonProcess.on('error', (err) => {
        console.error('[streamChat] spawn error:', err.message);
        if (!res.writableEnded) res.end();
    });

    pythonProcess.on('close', () => {
        if (!res.writableEnded) res.end();
    });

    res.on('close', () => {
        if (!res.writableEnded) {
            pythonProcess.kill();
        }
    });
};

/**
 * GET /api/chatbot/message-feedbacks
 * Récupère les métriques de satisfaction (👍/👎), l'évolution temporelle pour Recharts,
 * et la liste détaillée des feedbacks enregistrés.
 */
const getMessageFeedbacks = async (req, res) => {
    const { commerce_id, period = '30d', page = 1, limit = 50 } = req.query;

    try {
        const db = await connectDB();
        const query = {};

        // 1. Filtrage par boutique
        if (commerce_id && commerce_id !== '__all__') {
            query.commerce_id = commerce_id;
        }

        // 2. Filtrage par période
        if (period && period !== 'all') {
            const now = new Date();
            let days = 30;
            if (period === '7d') days = 7;
            if (period === '90d') days = 90;
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
            query.timestamp = { $gte: startDate };
        }

        // 3. Récupérer et dédoublonner tous les feedbacks pour la période
        const allFeedbacksForPeriod = await db.collection('chatbot_message_feedbacks')
            .find(query)
            .sort({ timestamp: -1 })
            .toArray();

        // Dédoublonnage par message unique (garantit qu'un seul feedback actif est comptabilisé par message)
        const dedupedMap = new Map();
        allFeedbacksForPeriod.forEach(item => {
            const key = item.message_id
                ? `${item.email}_${item.commerce_id}_${item.message_id}`
                : (item.session_id && item.session_id !== 'unknown' && item.message_idx)
                ? `${item.email}_${item.commerce_id}_${item.session_id}_${item.message_idx}`
                : (item.session_id && item.session_id !== 'unknown' && item.text)
                ? `${item.email}_${item.commerce_id}_${item.session_id}_${item.text}`
                : `${item.email}_${item.commerce_id}_${item.text || item._id}`;

            if (!dedupedMap.has(key)) {
                dedupedMap.set(key, item);
            }
        });

        const dedupedList = Array.from(dedupedMap.values());

        // Totaux & Métriques sur la liste dédoublonnée
        const total = dedupedList.length;
        const likes = dedupedList.filter(f => f.feedback === 'like').length;
        const dislikes = dedupedList.filter(f => f.feedback === 'dislike').length;
        const satisfactionRate = total > 0 ? Math.round((likes / total) * 1000) / 10 : 100;

        // 4. Liste détaillée paginée
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const rawFeedbacks = dedupedList.slice(skip, skip + limitNum);

        // Formater les noms réels de boutique pour l'affichage
        const feedbacks = rawFeedbacks.map(f => {
            let shopName = f.commerce_name;
            if (!shopName || shopName === 'unknown' || shopName.startsWith('commerce_')) {
                if (f.commerce_id === 'commerce_local' || f.commerce_id === 'commerce_local_1') {
                    shopName = 'Boutique Tunis';
                } else if (f.commerce_id && f.commerce_id !== '__all__') {
                    const clean = f.commerce_id.replace(/^commerce_/, 'Boutique ').replace(/_/g, ' ');
                    shopName = clean.charAt(0).toUpperCase() + clean.slice(1);
                } else {
                    shopName = 'Boutique Tunis';
                }
            }
            return { ...f, commerce_name: shopName };
        });

        // 5. Série temporelle pour Recharts (groupée par jour à partir de la liste dédoublonnée)
        const timeSeriesMap = {};
        dedupedList.forEach(item => {
            if (!item.timestamp) return;
            const dateStr = item.timestamp.substring(0, 10);
            if (!timeSeriesMap[dateStr]) {
                timeSeriesMap[dateStr] = { date: dateStr, likes: 0, dislikes: 0, total: 0 };
            }
            if (item.feedback === 'like') {
                timeSeriesMap[dateStr].likes += 1;
            } else if (item.feedback === 'dislike') {
                timeSeriesMap[dateStr].dislikes += 1;
            }
            timeSeriesMap[dateStr].total += 1;
        });

        const timeSeries = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));

        return res.json({
            status: 'success',
            metrics: {
                total,
                likes,
                dislikes,
                satisfaction_rate: satisfactionRate
            },
            time_series: timeSeries,
            data: feedbacks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        console.error('❌ Error getMessageFeedbacks:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/verify-session
 * Vérifie que l'email appartient bien au commerce_id sélectionné dans la collection clients.
 */
const verifySession = async (req, res) => {
    const { email, commerce_id } = req.body || {};

    if (!email || !commerce_id) {
        return res.status(400).json({ status: 'error', error: 'Email et boutique requis.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
        const db = await connectDB();
        const client = await db.collection('clients').findOne({
            email: { $regex: new RegExp(`^${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            commerce_id: commerce_id
        });

        if (!client) {
            return res.status(404).json({
                status: 'error',
                error: "Cet email n'est pas associé à cette boutique."
            });
        }

        return res.json({
            status: 'success',
            client: {
                email: client.email,
                nom: client.nom || client.email,
                commerce_id: client.commerce_id
            }
        });
    } catch (err) {
        console.error('❌ Error verifySession:', err.message);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * POST /api/chatbot/support-tickets
 * Crée un ticket d'escalade support pour un conseiller humain.
 */
const createSupportTicket = async (req, res) => {
    const { email, commerce_id, commerce_name, reason, summary, messages_count, session_id, bot_context_messages, truncated_bot_messages_count } = req.body || {};

    if (!email || !commerce_id) {
        return res.status(400).json({ error: 'Email et commerce_id requis.' });
    }

    try {
        const db = await connectDB();
        const cleanEmail = email.toLowerCase().trim();
        const nowIso = new Date().toISOString();
        const sid = session_id || `session_${Date.now()}`;

        // 1. RECHERCHER OU CRÉER DE MANIÈRE ATOMIQUE UN TICKET ACTIF (OPEN ou IN_PROGRESS)
        const filter = {
            email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
            commerce_id,
            status: { $in: ['OPEN', 'IN_PROGRESS'] }
        };

        const update = {
            $set: { updated_at: nowIso, last_message_at: nowIso, unread_by_admin: true },
            $inc: { messages_count: 1, unread_count: 1 },
            $setOnInsert: {
                created_at: nowIso,
                email: cleanEmail,
                commerce_id,
                commerce_name: commerce_name || commerce_id,
                session_id: sid,
                status: 'OPEN',
                reason: reason || 'Demande de conseiller humain',
                summary: summary || 'Le client a demandé à parler à un conseiller support.'
            }
        };

        const result = await db.collection('support_tickets').findOneAndUpdate(
            filter,
            update,
            { upsert: true, returnDocument: 'after' }
        );

        // Compatible MongoDB driver v4 (result.value) et v5+ (retourne le document directement)
        let activeTicket = null;
        if (result && result._id) {
            activeTicket = result;                  // driver v5+
        } else if (result && result.value && result.value._id) {
            activeTicket = result.value;            // driver v4
        } else {
            // Fallback : relire depuis la base
            activeTicket = await db.collection('support_tickets').findOne(filter);
            if (!activeTicket) {
                // Après upsert, le filtre peut ne pas matcher (statut = OPEN sur $setOnInsert)
                const newFilter = { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }, commerce_id, session_id: sid };
                activeTicket = await db.collection('support_tickets').findOne(newFilter);
            }
        }

        const ticketId = activeTicket ? activeTicket._id : null;
        const activeSessionId = (activeTicket && activeTicket.session_id) || sid;

        // 2. Si du contexte bot (15 derniers messages) est fourni pour une nouvelle session, l'enregistrer dans chatbot_conversations avec channel: "bot_context"
        if (Array.isArray(bot_context_messages) && bot_context_messages.length > 0) {
            const contextList = [];
            if (truncated_bot_messages_count && truncated_bot_messages_count > 0) {
                contextList.push({
                    role: 'assistant',
                    channel: 'bot_context',
                    text: `... et ${truncated_bot_messages_count} messages précédents`,
                    content: `... et ${truncated_bot_messages_count} messages précédents`,
                    timestamp: nowIso
                });
            }
            bot_context_messages.forEach((m) => {
                contextList.push({
                    role: m.role || 'assistant',
                    channel: 'bot_context',
                    text: m.content || m.text || '',
                    content: m.content || m.text || '',
                    timestamp: m.timestamp || nowIso
                });
            });

            await db.collection('chatbot_conversations').updateOne(
                { session_id: activeSessionId },
                {
                    $set: { email: cleanEmail, commerce_id, session_id: activeSessionId, updated_at: nowIso },
                    $setOnInsert: { messages: contextList }
                },
                { upsert: true }
            );
        }

        // Ajouter une entrée d'audit
        await db.collection('audit_logs').insertOne({
            timestamp: nowIso,
            type: 'SUPPORT_ESCALATION',
            email: cleanEmail,
            commerce_id,
            details: `Escalade support active réutilisée ou créée. Ticket ID: ${ticketId}`
        });

        return res.json({
            status: 'success',
            message: 'Ticket d\'escalade géré avec succès.',
            ticket_id: ticketId,
            session_id: activeSessionId
        });
    } catch (err) {
        console.error('❌ Error createSupportTicket:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/client-status
 * Retourne le nombre d'avertissements et le statut blocked d'un client.
 * Query params : email, commerce_id
 */
const getClientStatus = async (req, res) => {
    const { email, commerce_id } = req.query;

    if (!email || !commerce_id) {
        return res.status(400).json({ error: 'email et commerce_id sont requis.' });
    }

    try {
        const db = await connectDB();
        const status = await db.collection('chatbot_status').findOne({
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
            commerce_id
        });

        return res.json({
            status: 'success',
            warnings: status ? (status.warnings || 0) : 0,
            is_blocked: status ? (status.is_blocked || false) : false
        });
    } catch (err) {
        console.error('\u274c Error getClientStatus:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/save-warning
 * Enregistre un avertissement de modération dans audit_logs et incrémente le compteur dans chatbot_status.
 */
const saveWarning = async (req, res) => {
    const { email, commerce_id, commerce_name, user_message, reason } = req.body || {};

    if (!email || !commerce_id) {
        return res.status(400).json({ error: 'email et commerce_id sont requis.' });
    }

    try {
        const db = await connectDB();
        const timestamp = new Date().toISOString();
        const cleanEmail = email.toLowerCase().trim();

        // 1. Enregistrer dans audit_logs (visible dans Journal d'audit & Modération)
        await db.collection('audit_logs').insertOne({
            timestamp,
            type: 'WARNING',
            email: cleanEmail,
            commerce_id,
            commerce_name: commerce_name || commerce_id,
            details: `Avertissement : ${reason || 'Message inapproprié détecté.'}`,
            user_message: user_message ? user_message.substring(0, 200) : ''
        });

        // 2. Incrémenter le compteur warnings dans chatbot_status
        const result = await db.collection('chatbot_status').findOneAndUpdate(
            {
                email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
                commerce_id
            },
            {
                $inc: { warnings: 1 },
                $setOnInsert: { is_blocked: false, email: cleanEmail, commerce_id }
            },
            { upsert: true, returnDocument: 'after' }
        );

        const updatedDoc = result || {};
        const warnings = updatedDoc.warnings || 1;
        const is_blocked = updatedDoc.is_blocked || false;

        return res.json({
            status: 'success',
            warnings,
            is_blocked,
            message: `Avertissement enregistré. Total : ${warnings}`
        });
    } catch (err) {
        console.error('\u274c Error saveWarning:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/reply
 * Permet à un administrateur d'envoyer un message en direct au client dans sa conversation.
 */
const replyToClient = async (req, res) => {
    const { email, commerce_id, message, session_id } = req.body || {};

    if (!email || !commerce_id || !message) {
        return res.status(400).json({ error: 'Email, commerce_id et message sont requis.' });
    }

    try {
        const db = await connectDB();
        const timestamp = new Date().toISOString();
        const cleanText = message.replace(/^🎧\s*\[Conseiller Support\]\s*:\s*/i, '').trim();

        // Vérifier si le ticket est CLOSED
        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            const ticket = await db.collection('support_tickets').findOne({ session_id });
            if (ticket && ticket.status === 'CLOSED') {
                return res.status(400).json({ error: 'Ce ticket est marqué comme résolu. L\'envoi de messages est désactivé.' });
            }
        }

        const newMessage = {
            role: 'support',
            text: cleanText,
            content: cleanText,
            timestamp
        };

        // Construire la query avec session_id si fourni
        const query = {
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
            commerce_id
        };
        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            query.session_id = session_id;
        }

        const result = await db.collection('chatbot_conversations').updateOne(
            query,
            {
                $push: { messages: newMessage },
                $set: { updated_at: timestamp }
            },
            { upsert: true }
        );

        return res.json({
            status: 'success',
            message: 'Réponse transmise au client avec succès.',
            newMessage: {
                role: 'support',
                channel: 'support',
                content: cleanText,
                text: cleanText,
                timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        });
    } catch (err) {
        console.error('❌ Error replyToClient:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/chatbot/support-message
 * Sauvegarde un message envoyé par le CLIENT dans la session de chat support.
 */
const sendSupportMessage = async (req, res) => {
    const { email, commerce_id, session_id, message } = req.body || {};

    if (!email || !commerce_id || !message) {
        return res.status(400).json({ error: 'Email, commerce_id et message sont requis.' });
    }

    try {
        const db = await connectDB();
        const timestamp = new Date().toISOString();

        // Vérifier si le ticket est CLOSED
        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            const ticket = await db.collection('support_tickets').findOne({ session_id });
            if (ticket && ticket.status === 'CLOSED') {
                return res.status(400).json({ error: 'Cette session support est résolue. Veuillez rouvrir un ticket.' });
            }
        }

        const newMessage = {
            role: 'user',
            channel: 'support',
            text: message.trim(),
            content: message.trim(),
            timestamp
        };

        const query = {
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
            commerce_id
        };
        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            query.session_id = session_id;
        }

        await db.collection('chatbot_conversations').updateOne(
            query,
            {
                $push: { messages: newMessage },
                $set: { updated_at: timestamp, email: email.trim(), commerce_id, session_id }
            },
            { upsert: true }
        );

        // Marquer le ticket support correspondant comme non lu pour l'admin
        const ticketFilter = {
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
            status: { $in: ['OPEN', 'IN_PROGRESS'] }
        };
        if (session_id && session_id !== 'undefined' && session_id !== 'null') {
            ticketFilter.session_id = session_id;
        } else if (commerce_id && commerce_id !== '__all__') {
            if (commerce_id.startsWith('commerce_local')) {
                ticketFilter.commerce_id = { $regex: /^commerce_local/i };
            } else {
                ticketFilter.commerce_id = commerce_id;
            }
        }

        await db.collection('support_tickets').updateOne(
            ticketFilter,
            {
                $set: { unread_by_admin: true, last_message_at: timestamp, updated_at: timestamp },
                $inc: { unread_count: 1, messages_count: 1 }
            }
        );

        return res.json({
            status: 'success',
            newMessage: {
                role: 'user',
                channel: 'support',
                content: message.trim(),
                text: message.trim(),
                timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        });
    } catch (err) {
        console.error('❌ Error sendSupportMessage:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/chatbot/support-sessions/:session_id
 * Récupère l'historique complet d'une session de chat support par session_id.
 */
const getSupportSession = async (req, res) => {
    const { session_id } = req.params;

    if (!session_id) {
        return res.status(400).json({ error: 'session_id requis.' });
    }

    try {
        const db = await connectDB();
        const conv = await db.collection('chatbot_conversations').findOne({ session_id });

        const rawMessages = conv ? (conv.messages || []) : [];
        const formattedMessages = formatConversationMessages(rawMessages);

        return res.json({
            status: 'success',
            data: formattedMessages,
            session_id
        });
    } catch (err) {
        console.error('❌ Error getSupportSession:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getBlockedClients,
    getConversation,
    getSupportSession,
    unblockClient,
    getAuditLogs,
    getSupportTickets,
    createSupportTicket,
    updateSupportTicketStatus,
    getLanguageFeedbacks,
    getChatbotMetrics,
    saveMessageFeedback,
    getMessageFeedbacks,
    verifySession,
    streamChat,
    getClientStatus,
    saveWarning,
    replyToClient,
    sendSupportMessage,
    markSupportTicketRead
};
