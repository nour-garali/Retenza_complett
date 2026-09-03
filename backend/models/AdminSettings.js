const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    singletonId: {
      type: String,
      default: 'admin_settings',
      unique: true,
    },
    monthlyAcquisitionGoal: {
      type: Number,
      default: 50,
      min: 1,
    },
    notificationPreferences: {
      securityAlerts: { type: Boolean, default: true },
      newPartnerNotif: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
