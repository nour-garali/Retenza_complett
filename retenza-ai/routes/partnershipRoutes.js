/**
 * partnershipRoutes.js
 * Routes pour les demandes de partenariat commerçants.
 * Utilise la connexion MongoDB Atlas déjà active de retenza-ai,
 * mais opère sur la base 'retenza_connect' (partagée).
 */

const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const CONNECT_URI = process.env.MONGODB_CONNECT_URI || process.env.MONGODB_URI;
const CONNECT_DB  = 'retenza_connect';

// Singleton de connexion vers retenza_connect
let _connectDb = null;
async function getConnectDb() {
    if (_connectDb) return _connectDb;
    const client = new MongoClient(CONNECT_URI, {
        serverSelectionTimeoutMS: 30000,
        tlsAllowInvalidCertificates: true,
    });
    await client.connect();
    _connectDb = client.db(CONNECT_DB);
    console.log(`✅ [Partnership] Connecté à MongoDB : ${CONNECT_DB}`);
    return _connectDb;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/partnership-requests/check-email?email=...
// ─────────────────────────────────────────────────────────────────────────────
router.get('/check-email', async (req, res) => {
    try {
        const email = (req.query.email || '').toLowerCase().trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.json({ available: false, code: 'INVALID_EMAIL', message: 'Adresse email invalide.' });
        }

        const db = await getConnectDb();
        const requests = db.collection('partnershiprequests');
        const users    = db.collection('users');

        // Règle 1 : Demande PENDING déjà en cours
        const pending = await requests.findOne({ contactEmail: email, status: 'PENDING' });
        if (pending) {
            return res.json({
                available: false,
                code: 'ALREADY_PENDING',
                message: "Une demande de partenariat est déjà en cours pour cet email. Notre équipe l'examine, veuillez patienter.",
            });
        }

        // Règle 2 : Demande APPROVED ou compte en attente d'activation
        const approved    = await requests.findOne({ contactEmail: email, status: 'APPROVED' });
        const pendingUser = await users.findOne({ email, status: 'pending_activation' });
        if (approved || pendingUser) {
            return res.json({
                available: false,
                code: 'PENDING_ACTIVATION',
                message: 'Votre demande a déjà été approuvée. Consultez votre email pour activer votre compte.',
            });
        }

        // Règle 3 : Compte actif existant
        const activeUser = await users.findOne({ email, status: 'active' });
        if (activeUser) {
            return res.json({
                available: false,
                code: 'ALREADY_ACTIVE',
                message: 'Un compte Retenza est déjà actif pour cet email. Connectez-vous pour accéder à votre espace.',
            });
        }

        return res.json({ available: true, code: 'OK', message: 'Email disponible.' });

    } catch (err) {
        console.error('[partnership] check-email error:', err.message);
        // Fail-open : ne pas bloquer l'inscription en cas d'erreur BD
        return res.json({ available: true, code: 'OK', message: 'Email disponible.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/partnership-requests
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const {
            businessName, category, address, city, phone, contactEmail, website,
            ownerFirstName, ownerLastName, ownerRole, ownerPhone,
            numberOfLocations, loyaltyProgramType, message,
        } = req.body;

        // Validation
        if (!contactEmail || !businessName || !ownerFirstName || !ownerLastName || !category) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants (businessName, category, contactEmail, ownerFirstName, ownerLastName).',
            });
        }

        const emailLower = contactEmail.toLowerCase().trim();
        const db = await getConnectDb();
        const requests = db.collection('partnershiprequests');
        const users    = db.collection('users');

        // Règle 1 : Demande PENDING déjà en cours
        const existingPending = await requests.findOne({ contactEmail: emailLower, status: 'PENDING' });
        if (existingPending) {
            return res.status(409).json({
                success: false,
                code: 'ALREADY_PENDING',
                message: "Une demande de partenariat est déjà en cours pour cet email. Notre équipe l'examine. Veuillez patienter.",
            });
        }

        // Règle 2 : Déjà approuvé ou en attente d'activation
        const existingApproved    = await requests.findOne({ contactEmail: emailLower, status: 'APPROVED' });
        const existingPendingUser = await users.findOne({ email: emailLower, status: 'pending_activation' });
        if (existingApproved || existingPendingUser) {
            return res.status(409).json({
                success: false,
                code: 'PENDING_ACTIVATION',
                message: "Votre demande a déjà été approuvée. Consultez votre boîte email pour activer votre compte.",
            });
        }

        // Règle 3 : Compte actif
        const existingActiveUser = await users.findOne({ email: emailLower, status: 'active' });
        if (existingActiveUser) {
            return res.status(409).json({
                success: false,
                code: 'ALREADY_ACTIVE',
                message: 'Un compte commerçant Retenza est déjà actif pour cet email. Connectez-vous pour accéder à votre espace.',
            });
        }

        // Créer la demande
        const now = new Date();
        const result = await requests.insertOne({
            businessName:       businessName.trim(),
            category:           category.trim(),
            address:            address?.trim() || '',
            city:               city?.trim() || '',
            phone:              phone?.trim() || '',
            contactEmail:       emailLower,
            website:            website?.trim() || null,
            ownerFirstName:     ownerFirstName.trim(),
            ownerLastName:      ownerLastName.trim(),
            ownerRole:          ownerRole?.trim() || 'Gérant',
            ownerPhone:         ownerPhone?.trim() || '',
            numberOfLocations:  numberOfLocations || 1,
            loyaltyProgramType: loyaltyProgramType || 'unknown',
            message:            message?.trim() || '',
            status:             'PENDING',
            createdAt:          now,
            updatedAt:          now,
        });

        return res.status(201).json({
            success: true,
            message: 'Votre demande de partenariat a bien été envoyée. Elle est en cours de vérification par notre équipe.',
            data: {
                requestId:     result.insertedId,
                businessName:  businessName.trim(),
                status:        'PENDING',
                submittedAt:   now,
            },
        });

    } catch (err) {
        console.error('[partnership] submit error:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }
});

module.exports = router;
