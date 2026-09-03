const mongoose = require('mongoose');

const loyaltyAccountSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
      required: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    stamps: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashbackBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    qrCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRCode',
    },
    acquisitionSource: {
      type: String,
      enum: ['qr_scan', 'manual', 'import'],
      default: 'qr_scan',
    },
    lastVisitAt: {
      type: Date,
      default: Date.now,
    },
    // Google Wallet integration
    walletObjectId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

loyaltyAccountSchema.index({ client: 1, commerce: 1 }, { unique: true });

module.exports = mongoose.model('LoyaltyAccount', loyaltyAccountSchema);
