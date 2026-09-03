const mongoose = require('mongoose');

/**
 * PartnershipRequest
 * ------------------
 * Représente une demande de partenariat soumise par un commerçant.
 * N'est PAS un compte utilisateur — aucun accès au Dashboard.
 *
 * Workflow :
 *   PENDING → (Admin) → APPROVED  → User créé (PENDING_ACTIVATION) → token → ACTIVE
 *                      → REJECTED → Email de refus
 */
const partnershipRequestSchema = new mongoose.Schema(
  {
    // ── Informations commerce ──────────────────────────────────────
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    address:      { type: String, trim: true },
    city:         { type: String, trim: true },
    phone:        { type: String, trim: true },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    website: { type: String, trim: true, default: null },

    // ── Informations responsable ───────────────────────────────────
    ownerFirstName: {
      type: String,
      required: [true, 'Owner first name is required'],
      trim: true,
    },
    ownerLastName: {
      type: String,
      required: [true, 'Owner last name is required'],
      trim: true,
    },
    ownerRole:  { type: String, trim: true, default: 'Gérant' },
    ownerPhone: { type: String, trim: true },

    // ── Informations complémentaires ───────────────────────────────
    numberOfLocations: { type: Number, default: 1, min: 1 },
    loyaltyProgramType: {
      type: String,
      enum: ['points', 'stamps', 'cashback', 'unknown'],
      default: 'unknown',
    },
    message: { type: String, trim: true, maxlength: 1000, default: '' },

    // ── Statut de la demande ───────────────────────────────────────
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },

    // ── Informations de review (admin) ─────────────────────────────
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: { type: String, trim: true, default: null },

    // ── Référence vers les entités créées après approbation ────────
    // Le token d'activation EST stocké dans User uniquement
    createdUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdCommerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
      default: null,
    },
  },
  { timestamps: true }
);

// Index de recherche
partnershipRequestSchema.index({ contactEmail: 1 });
partnershipRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PartnershipRequest', partnershipRequestSchema);
