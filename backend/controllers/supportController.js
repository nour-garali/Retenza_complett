const SupportRequest = require('../models/SupportRequest');
const Incident = require('../models/Incident');
const asyncHandler = require('../utils/asyncHandler');

exports.createSupportRequest = asyncHandler(async (req, res) => {
  const { subject, message, priority } = req.body;

  const request = await SupportRequest.create({
    subject,
    message,
    priority,
    submittedBy: req.user._id,
    commerce: req.user.commerce,
  });

  res.status(201).json({
    success: true,
    message: 'Support request submitted',
    data: { request },
  });
});

exports.createIncident = asyncHandler(async (req, res) => {
  const { title, description, type, priority, commerceId } = req.body;

  const incident = await Incident.create({
    title,
    description,
    type,
    priority,
    reportedBy: req.user._id,
    commerce: commerceId || req.user.commerce,
  });

  res.status(201).json({
    success: true,
    message: 'Incident reported',
    data: { incident },
  });
});
