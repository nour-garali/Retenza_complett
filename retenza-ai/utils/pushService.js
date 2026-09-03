/**
 * pushService.js
 * ──────────────
 * Service de notification push mobile (FCM via Firebase Admin SDK).
 *
 * Pattern identique à emailService.js :
 *   - Si les variables d'environnement Firebase sont configurées  → envoi réel
 *   - Sinon                                                        → simulation en log
 *
 * Variables d'environnement requises pour l'envoi réel :
 *   FIREBASE_PROJECT_ID     : ID du projet Firebase
 *   FIREBASE_PRIVATE_KEY    : Clé privée du compte de service (JSON stringifié ou valeur brute)
 *   FIREBASE_CLIENT_EMAIL   : Email du compte de service
 *
 * Pour brancher Firebase Admin réellement :
 *   1. npm install firebase-admin
 *   2. Renseigner les 3 variables ci-dessus dans .env
 *   3. Décommenter le bloc d'initialisation Firebase ci-dessous
 *
 * Collections MongoDB utilisées (en amont, par le contrôleur) :
 *   - clients : pour récupérer le fcm_token du client (champ optionnel)
 *
 * @module pushService
 */

'use strict';

// ============================================================
// Détection de la configuration Firebase
// ============================================================
const isFirebaseConfigured = () =>
    !!(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
    );

// ============================================================
// Initialisation Firebase Admin SDK (désactivée tant que les
// variables d'environnement ne sont pas renseignées)
// ============================================================
// Pour activer :
//   1. npm install firebase-admin
//   2. Décommenter le bloc ci-dessous
//   3. Renseigner FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL dans .env
//
// let admin = null;
// if (isFirebaseConfigured()) {
//     admin = require('firebase-admin');
//     if (!admin.apps.length) {
//         admin.initializeApp({
//             credential: admin.credential.cert({
//                 projectId    : process.env.FIREBASE_PROJECT_ID,
//                 privateKey   : (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
//                 clientEmail  : process.env.FIREBASE_CLIENT_EMAIL,
//             }),
//         });
//     }
//     console.log(`🔔 [PUSH SERVICE] Firebase Admin initialisé (projet : ${process.env.FIREBASE_PROJECT_ID}).`);
// } else {
//     console.log('⚠️  [PUSH SERVICE] Firebase non configuré dans .env → MODE SIMULATION activé.');
// }

if (isFirebaseConfigured()) {
    console.log(`🔔 [PUSH SERVICE] Firebase configuré (projet : ${process.env.FIREBASE_PROJECT_ID}).`);
} else {
    console.log('⚠️  [PUSH SERVICE] Firebase non configuré dans .env — Les notifications push seront simulées en log.');
}

// ============================================================
// sendPush({ token, title, body, data })
// ============================================================
/**
 * Envoie une notification push à un appareil mobile via FCM,
 * ou la simule en log si Firebase n'est pas configuré.
 *
 * @param {Object} options
 * @param {string} options.token   - Token FCM de l'appareil destinataire
 * @param {string} options.title   - Titre de la notification
 * @param {string} options.body    - Corps du message
 * @param {Object} [options.data]  - Payload de données supplémentaires (key/value strings)
 * @returns {Promise<{ status: 'sent' | 'simulated', messageId?: string, info?: string }>}
 */
const sendPush = async ({ token, title, body, data = {} }) => {
    if (!token) {
        console.warn('⚠️  [PUSH SERVICE] sendPush appelé sans token FCM — notification ignorée.');
        return { status: 'simulated', info: 'Token FCM absent — notification ignorée.' };
    }

    // ─── Mode simulation (Firebase non configuré) ───────────────────────────
    if (!isFirebaseConfigured()) {
        console.log('');
        console.log('🔔 ─── [SIMULATION PUSH FCM (Firebase non configuré)] ───');
        console.log(`   Token     : ${token.slice(0, 20)}...`);
        console.log(`   Titre     : ${title}`);
        console.log(`   Message   : ${body}`);
        if (Object.keys(data).length > 0) {
            console.log(`   Données   : ${JSON.stringify(data)}`);
        }
        console.log('🔔 ────────────────────────────────────────────────────────');
        console.log('');
        return { status: 'simulated', info: 'Simulation active : Firebase non configuré.' };
    }

    // ─── Envoi réel via Firebase Admin SDK ──────────────────────────────────
    // Décommenter après avoir activé l'initialisation Firebase ci-dessus
    //
    // try {
    //     const message = {
    //         token,
    //         notification: { title, body },
    //         data: Object.fromEntries(
    //             Object.entries(data).map(([k, v]) => [k, String(v)])
    //         ),
    //         android : { priority: 'high' },
    //         apns    : { payload: { aps: { sound: 'default' } } },
    //     };
    //     const response = await admin.messaging().send(message);
    //     console.log(`🔔 [PUSH SENT] Notification envoyée (ID: ${response})`);
    //     return { status: 'sent', messageId: response };
    // } catch (err) {
    //     console.error('❌ [PUSH ERROR] Échec de l\'envoi FCM :', err.message);
    //     throw err;
    // }

    // Fallback (ne devrait pas être atteint tant que le bloc ci-dessus est commenté)
    return { status: 'simulated', info: 'Firebase Admin SDK non initialisé (décommenter le bloc d\'initialisation).' };
};

// ============================================================
// sendCrossSellPush({ clientEmail, fcmToken, produitA, produitB, confiance, commerceId })
// ============================================================
/**
 * Envoie une notification push de suggestion cross-sell post-caisse.
 * Enveloppe sendPush() avec un message formaté pour le cross-sell.
 *
 * @param {Object} options
 * @param {string} options.clientEmail  - Email du client (pour les logs)
 * @param {string} options.fcmToken     - Token FCM de l'appareil (peut être null/absent)
 * @param {string} options.produitA     - Produit acheté déclencheur
 * @param {string} options.produitB     - Produit recommandé
 * @param {number} options.confiance    - Score de confiance (0–1)
 * @param {string} options.commerceId  - ID du commerce
 * @returns {Promise<{ status: string, info?: string }>}
 */
const sendCrossSellPush = async ({ clientEmail, fcmToken, produitA, produitB, confiance, commerceId }) => {
    const title = '💡 Avez-vous pensé à...';
    const body  = `Les clients qui achètent "${produitA}" aiment aussi "${produitB}" (${Math.round(confiance * 100)}% des cas). Disponible maintenant !`;

    const data = {
        type        : 'cross_sell',
        produit_a   : produitA,
        produit_b   : produitB,
        confiance   : String(Math.round(confiance * 100)),
        commerce_id : commerceId,
    };

    console.log(`🔔 [PUSH CROSS-SELL] ${clientEmail} → "${produitA}" ➜ "${produitB}" (${Math.round(confiance * 100)}%)`);

    return sendPush({ token: fcmToken, title, body, data });
};

module.exports = {
    sendPush,
    sendCrossSellPush,
    isFirebaseConfigured,
};
