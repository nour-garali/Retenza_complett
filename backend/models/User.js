const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,   // Obligatoire pour les commerçants, null pour les clients OTP
      minlength: 6,
      select: false,
    },
    authMethod: {
      type: String,
      enum: ['password', 'otp'],
      default: 'password',
      // 'password' → commerçants & admin
      // 'otp'      → clients (aucun mot de passe)
    },
    role: {
      type: String,
      enum: ['merchant', 'client', 'admin'],
      required: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ─── Statut du compte (source de vérité unique) ────────────────────────────
    // ACTIVE           → accès normal
    // PENDING_ACTIVATION → compte créé mais pas encore activé par le commerçant
    // SUSPENDED        → accès bloqué par l'admin
    status: {
      type: String,
      enum: ['active', 'pending_activation', 'suspended'],
      default: 'active',
    },
    // ─── Token d'activation (commerçants uniquement) ──────────────────────────
    activationTokenHash:      { type: String, default: null, select: false },
    activationTokenExpiresAt: { type: Date,   default: null },
    emailVerified: { type: Boolean, default: false },
    // ── Onboarding commerçant ─────────────────────────────────────────────────
    // false = premier login → rediriger vers la page de configuration initiale
    isOnboardingComplete: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commerce',
      },
    ],
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      language: { type: String, default: 'fr' },
      privacy: {
        dataSharing: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
