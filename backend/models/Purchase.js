const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'validated', 'cancelled'],
      default: 'pending',
    },
    rewards: {
      points: { type: Number, default: 0 },
      stamps: { type: Number, default: 0 },
      cashback: { type: Number, default: 0 },
      assigned: { type: Boolean, default: false },
    },
    validatedAt: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
