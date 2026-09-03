'use strict';
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config/db'));

(async () => {
    try {
        const db = await connectDB();
        console.log('🔄 Démarrage du dédoublonnage de chatbot_message_feedbacks...');

        const allDocs = await db.collection('chatbot_message_feedbacks')
            .find({})
            .sort({ timestamp: -1, _id: -1 })
            .toArray();

        console.log(`📊 Nombre total de documents actuels : ${allDocs.length}`);

        const seenKeys = new Set();
        const idsToDelete = [];
        let keepCount = 0;

        for (const doc of allDocs) {
            const email = (doc.email || 'anonymous').trim().toLowerCase();
            const commerce_id = doc.commerce_id || 'unknown';
            const message_id = doc.message_id || null;
            const session_id = doc.session_id || 'unknown';
            const message_idx = doc.message_idx;
            const text = doc.text ? doc.text.substring(0, 300) : '';

            let key = null;
            if (message_id) {
                key = `${email}_${commerce_id}_${message_id}`;
            } else if (session_id !== 'unknown' && message_idx !== undefined && message_idx !== null && Number(message_idx) > 0) {
                key = `${email}_${commerce_id}_${session_id}_${message_idx}`;
            } else if (session_id !== 'unknown' && text) {
                key = `${email}_${commerce_id}_${session_id}_${text}`;
            } else if (text) {
                key = `${email}_${commerce_id}_${text}`;
            } else {
                key = `${email}_${commerce_id}_${session_id}_${doc._id.toString()}`;
            }

            if (seenKeys.has(key)) {
                idsToDelete.push(doc._id);
            } else {
                seenKeys.add(key);
                keepCount++;
            }
        }

        console.log(`✨ Documents uniques conservés (les plus récents) : ${keepCount}`);
        console.log(`🗑️ Doublons détectés à supprimer : ${idsToDelete.length}`);

        if (idsToDelete.length > 0) {
            const res = await db.collection('chatbot_message_feedbacks').deleteMany({
                _id: { $in: idsToDelete }
            });
            console.log(`✅ ${res.deletedCount} doublons supprimés avec succès de chatbot_message_feedbacks.`);
        } else {
            console.log('✅ Aucun doublon à supprimer.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur lors du dédoublonnage :', err);
        process.exit(1);
    }
})();
