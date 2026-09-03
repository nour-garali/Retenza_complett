const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QRCode', qrCodeSchema);
