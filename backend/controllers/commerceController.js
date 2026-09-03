const Commerce = require('../models/Commerce');
const asyncHandler = require('../utils/asyncHandler');

exports.createCommerce = asyncHandler(async (req, res) => {
  const commerce = await Commerce.create({
    ...req.body,
    merchant: req.user._id,
    status: 'pending',
  });

  req.user.commerce = commerce._id;
  await req.user.save();

  res.status(201).json({
    success: true,
    message: 'Commerce created successfully',
    data: { commerce },
  });
});

exports.getCommerces = asyncHandler(async (req, res) => {
  const { category, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  else filter.status = 'active';

  const skip = (Number(page) - 1) * Number(limit);
  const [commerces, total] = await Promise.all([
    Commerce.find(filter)
      .populate('merchant', 'firstName lastName email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Commerce.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      commerces,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

exports.getCommerceById = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findById(req.params.id).populate(
    'merchant',
    'firstName lastName email phone'
  );

  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  res.json({ success: true, data: { commerce } });
});

exports.updateCommerce = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findById(req.params.id);

  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (
    req.user.role === 'merchant' &&
    commerce.merchant.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const allowedFields = [
    'name',
    'description',
    'category',
    'contact',
    'openingHours',
    'loyaltyProgram',
    'isConfigured',
    'brandColor',
    'coverImage',
    'website',
    'notifications',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      commerce[field] = req.body[field];
    }
  });

  await commerce.save();

  res.json({
    success: true,
    message: 'Commerce updated successfully',
    data: { commerce },
  });
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findById(req.params.id);

  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce not found' });
  }

  if (commerce.merchant.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  commerce.logo = `/uploads/${req.file.filename}`;
  await commerce.save();

  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    data: { logo: commerce.logo },
  });
});

exports.getMyCommerce = asyncHandler(async (req, res) => {
  const commerce = await Commerce.findOne({ merchant: req.user._id });
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'No commerce found for this merchant' });
  }
  res.json({ success: true, data: { commerce } });
});
