const { v4: uuidv4 } = require('uuid');
const QRCode = require('../models/QRCode');
const Commerce = require('../models/Commerce');
const ScanHistory = require('../models/ScanHistory');
const asyncHandler = require('../utils/asyncHandler');

const generateUniqueCode = () => `RC-${uuidv4().split('-')[0].toUpperCase()}`;

exports.generateQRCode = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findById(req.params.commerceId);

  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (
    req.user.role === 'merchant' &&
    commerce.merchant.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  let qrCode = await QRCode.findOne({ commerce: commerce._id });

  if (qrCode) {
    return res.json({
      success: true,
      message: 'QR code already exists for this commerce',
      data: { qrCode },
    });
  }

  const code = generateUniqueCode();
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  qrCode = await QRCode.create({
    commerce: commerce._id,
    code,
    url: `${baseUrl}/api/qrcodes/scan/${code}`,
  });

  res.status(201).json({
    success: true,
    message: 'QR code generated successfully',
    data: { qrCode },
  });
});

exports.getQRCode = asyncHandler(async (req, res) => {
  const qrCode = await QRCode.findOne({ commerce: req.params.commerceId }).populate(
    'commerce',
    'name category logo status'
  );

  if (!qrCode) {
    return res.status(404).json({ success: false, message: 'QR code not found' });
  }

  res.json({ success: true, data: { qrCode } });
});

exports.getQRCodeByCode = asyncHandler(async (req, res) => {
  const qrCode = await QRCode.findOne({ code: req.params.code }).populate(
    'commerce',
    'name category logo contact openingHours loyaltyProgram'
  );

  if (!qrCode || !qrCode.isActive) {
    return res.status(404).json({ success: false, message: 'QR code not found or inactive' });
  }

  res.json({ success: true, data: { qrCode } });
});

exports.trackScan = asyncHandler(async (req, res) => {
  const qrCode = await QRCode.findOne({ code: req.params.code });

  if (!qrCode || !qrCode.isActive) {
    return res.status(404).json({ success: false, message: 'QR code not found or inactive' });
  }

  const scannedAt = new Date();

  qrCode.scanCount += 1;
  qrCode.lastScannedAt = scannedAt;
  await qrCode.save();

  const scanRecord = await ScanHistory.create({
    qrCode: qrCode._id,
    commerce: qrCode.commerce,
    scannedAt,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  const commerce = await Commerce.findById(qrCode.commerce).select(
    'name category logo loyaltyProgram'
  );

  res.json({
    success: true,
    message: 'Scan recorded successfully',
    data: {
      scan: scanRecord,
      commerce,
      qrCode: {
        code: qrCode.code,
        scanCount: qrCode.scanCount,
        lastScannedAt: qrCode.lastScannedAt,
      },
    },
  });
});

exports.getScanHistory = asyncHandler(async (req, res) => {
  const { commerceId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const commerce = await Commerce.findById(commerceId);
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (
    req.user.role === 'merchant' &&
    commerce.merchant.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [scans, total] = await Promise.all([
    ScanHistory.find({ commerce: commerceId })
      .populate('client', 'firstName lastName email')
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ScanHistory.countDocuments({ commerce: commerceId }),
  ]);

  res.json({
    success: true,
    data: {
      scans,
      pagination: { total, page: Number(page), limit: Number(limit) },
    },
  });
});
