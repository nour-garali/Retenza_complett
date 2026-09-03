const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['technical', 'fraud', 'abuse', 'billing', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'dismissed'],
      default: 'reported',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commerce',
    },
    adminResponses: [
      {
        message: { type: String, required: true, trim: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    merchantComments: [
      {
        message: { type: String, required: true, trim: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolutionConfirmedByMerchant: { type: Boolean, default: false },
    resolutionConfirmedAt: Date,
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
