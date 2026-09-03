const mongoose = require('mongoose');

/**
 * OTPCode — Stockage des codes OTP envoyés aux clients.
 *
 * Règles :
 * - Le code est toujours stocké haché (bcrypt), jamais en clair.
 * - TTL MongoDB supprime automatiquement le document après expiration.
 * - Après 5 tentatives échouées, l'OTP est bloqué (locked).
 * - Après vérification réussie, `verified` passe à true (usage unique).
 * - `purpose` permet de distinguer les usages (guest_card, login...).
 */
const otpCodeSchema = new mongoose.Schema(
  {
    // ── Identifiant (email pour v1, phone pour v2) ─────────────────────────
    identifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    identifierType: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
      default: 'email',
    },

    // ── Le code OTP haché (jamais stocké en clair) ─────────────────────────
    codeHash: {
      type: String,
      required: true,
      select: false, // Jamais retourné dans les queries par défaut
    },

    // ── Expiration automatique (TTL index) ─────────────────────────────────
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — supprime le doc à l'expiration
    },

    // ── Anti-bruteforce ────────────────────────────────────────────────────
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    locked: {
      type: Boolean,
      default: false,
    },

    // ── État ───────────────────────────────────────────────────────────────
    verified: {
      type: Boolean,
      default: false,
    },

    // ── Contexte d'utilisation ─────────────────────────────────────────────
    purpose: {
      type: String,
      enum: ['guest_card', 'login'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Exemple pour guest_card: { merchantCode: 'RC-XXXX' }
    },

    // ── Audit log (sécurité) ───────────────────────────────────────────────
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour retrouver rapidement l'OTP actif d'un identifier
otpCodeSchema.index({ identifier: 1, purpose: 1, verified: 1 });

module.exports = mongoose.model('OTPCode', otpCodeSchema);
