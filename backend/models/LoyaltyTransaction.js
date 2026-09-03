const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema(
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
    loyaltyAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoyaltyAccount',
      required: true,
    },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'adjustment'],
      required: true,
    },
    programType: {
      type: String,
      enum: ['points', 'stamps', 'cashback'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    purchaseAmount: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
