const crypto = require('crypto');
const User = require('../models/User');
const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { reconcileGuestCards } = require('../services/reconciliationService');

const buildAuthResponse = (user) => ({
  success: true,
  message: 'Success',
  data: {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      commerce: user.commerce,
    },
    token: generateToken(user._id, user.role),
  },
});

exports.registerMerchant = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, commerceName, category } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    role: 'merchant',
  });

  const commerce = await Commerce.create({
    name: commerceName,
    category,
    merchant: user._id,
    status: 'active', // Set to active immediately for testing so the QR code works
    contact: { email, phone },
  });

  user.commerce = commerce._id;
  await user.save();

  res.status(201).json({
    ...buildAuthResponse(user),
    message: 'Merchant registered successfully',
  });
});

exports.registerClient = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  let user = await User.findOne({ email });
  
  if (user) {
    if (user.authMethod === 'otp') {
      // The user was created via the OTP guest flow. Upgrade their account.
      user.password = password;
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.authMethod = 'password';
      await user.save();

      // Update or create the associated Client profile
      await Client.findOneAndUpdate(
        { email },
        { firstName, lastName, phone, user: user._id },
        { upsert: true }
      );
    } else {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
  } else {
    user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'client',
      authMethod: 'password',
    });

    await Client.create({
      firstName,
      lastName,
      email,
      phone,
      user: user._id,
    });
  }

  // ── Phase 4: Auto-reconcile Guest Loyalty Cards ───────────────────────────
  // Run asynchronously — never blocks or fails the registration response.
  // Any guest cards matching this email/phone are linked to the new account.
  let reconciliation = { mergedCount: 0, mergedCards: [] };
  try {
    reconciliation = await reconcileGuestCards({
      retenzaUserId: user._id,
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
    });
    if (reconciliation.mergedCount > 0) {
      console.log(
        `[Auth] Auto-reconciliation: ${reconciliation.mergedCount} guest card(s) merged for new user ${user._id}`
      );
    }
  } catch (err) {
    // Reconciliation failure must never break registration
    console.error('[Auth] Auto-reconciliation failed (non-blocking):', err.message);
  }
  // ─────────────────────────────────────────────────────────────────────────

  res.status(201).json({
    ...buildAuthResponse(user),
    message: 'Client registered successfully',
    // Include reconciliation info so the frontend can display a welcome message
    data: {
      ...buildAuthResponse(user).data,
      reconciliation: {
        mergedCount: reconciliation.mergedCount,
        mergedCards: reconciliation.mergedCards,
      },
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
  }

  // ── Vérification du statut (source de vérité unique) ─────────────────────
  if (user.status === 'pending_activation') {
    return res.status(403).json({
      success: false,
      code: 'PENDING_ACTIVATION',
      message: 'Votre compte n\'est pas encore activé. Consultez votre email pour terminer l\'activation.',
    });
  }

  if (user.status === 'suspended' || !user.isActive) {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Votre compte a été suspendu. Contactez le support Retenza.',
    });
  }

  res.json({
    ...buildAuthResponse(user),
    message: 'Login successful',
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { sendPasswordResetEmail } = require('../services/emailService');

  const user = await User.findOne({ email });
  if (!user) {
    // Sécurité : ne pas révéler si l'email existe ou non
    return res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  }

  const resetToken = generateResetToken();
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail({ to: user.email, resetUrl });

  res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful',
    data: { token: generateToken(user._id, user.role) },
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('commerce');
  res.json({ success: true, data: { user } });
});
