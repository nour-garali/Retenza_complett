const mongoose = require('mongoose');

/**
 * GuestLoyaltyCard — Carte de fidélité créée par un visiteur sans compte Retanza.
 *
 * Règles importantes :
 *  - cardPublicId est l'identifiant permanent (jamais modifié) utilisé dans Wallet, stats, dashboard.
 *  - email + phone = clés de réconciliation uniquement (pas des identifiants).
 *  - Un client peut posséder N cartes (une par commerçant) — jamais de relation 1-to-1 supposée.
 *  - Lors d'une fusion (GUEST_ACCOUNT_MERGED), le statut passe à 'merged' et retenzaUserId est renseigné.
 *    La carte n'est JAMAIS supprimée, les passes Wallet continuent de fonctionner.
 */

const walletPassRefSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google', 'apple'],
      required: true,
    },
    objectId: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: null, // renseigné quand l'utilisateur ajoute réellement la carte à son Wallet
    },
  },
  { _id: false }
);

const guestLoyaltyCardSchema = new mongoose.Schema(
  {
    // ── Identité permanente ────────────────────────────────────────────────────
    cardPublicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Format : RTC-XXXX-XXXX (généré par le controller à la création)
    },

    // ── Clés de réconciliation (jamais des identifiants) ──────────────────────
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true, // Pour la recherche de réconciliation
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true, // Pour la recherche de réconciliation
    },

    // ── Relation commerçant ───────────────────────────────────────────────────
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
      required: true,
      index: true,
    },
    merchantPublicCode: {
      type: String,
      required: true,
    },

    // ── Programme fidélité ────────────────────────────────────────────────────
    points:   { type: Number, default: 0, min: 0 },
    stamps:   { type: Number, default: 0, min: 0 },
    cashback: { type: Number, default: 0, min: 0 },

    // ── État de la carte ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'merged', 'suspended'],
      default: 'active',
      index: true,
    },

    // ── Rattachement futur à un compte Retanza (Phase 4) ──────────────────────
    retenzaUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true, // Sparse car null par défaut
    },
    mergedAt: {
      type: Date,
      default: null,
    },

    // ── Références aux passes Wallet ──────────────────────────────────────────
    walletPasses: {
      type: [walletPassRefSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatiques
  }
);

// ── Index composé : unicité d'une carte par (email OU phone) + commerçant ─────
// Permet de retrouver rapidement une carte existante avant d'en créer une nouvelle
guestLoyaltyCardSchema.index({ email: 1, merchantId: 1 });
guestLoyaltyCardSchema.index({ phone: 1, merchantId: 1 });

module.exports = mongoose.model('GuestLoyaltyCard', guestLoyaltyCardSchema);
