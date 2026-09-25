const crypto = require('crypto');
const User = require('../models/User');
const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { reconcileGuestCards } = require('../services/reconciliationService');
const { sendClientActivationEmail } = require('../services/emailService');

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
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
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
  
  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');

  if (user) {
    if (user.authMethod === 'otp') {
      // The user was created via the OTP guest flow. Upgrade their account.
      user.password = password;
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.authMethod = 'password';
      user.status = 'pending_activation';
      user.activationTokenHash = activationTokenHash;
      user.activationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
      status: 'pending_activation',
      activationTokenHash,
      activationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
    });

    await Client.create({
      firstName,
      lastName,
      email,
      phone,
      user: user._id,
    });
  }
  
  await sendClientActivationEmail({
    to: email,
    firstName,
    activationUrl: `${process.env.API_URL || 'http://127.0.0.1:3000/api'}/auth/verify-email/${activationToken}`
  });

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
    success: true,
    message: 'Client registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        status: user.status,
      },
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

  // ── Mise à jour du tracking de connexion ──────────────────────────────────
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  await user.save({ validateBeforeSave: false });

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

exports.checkClientVerificationStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.status === 'active') {
    return res.status(200).json({
      success: true,
      verified: true,
      data: { token: generateToken(user._id, user.role) },
    });
  }

  res.status(200).json({ success: true, verified: false });
});

exports.verifyClientEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const user = await User.findOne({
    activationTokenHash: hashedToken,
    activationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:50px;">
        <h1 style="color:#D73E26;">Lien invalide ou expiré</h1>
        <p>Le lien de vérification est invalide ou a expiré. Veuillez vous reconnecter pour en demander un nouveau.</p>
      </body></html>
    `);
  }

  user.status = 'active';
  user.isActive = true;
  user.activationTokenHash = undefined;
  user.activationTokenExpiresAt = undefined;
  await user.save();

  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#F5F0EB;">
      <h1 style="color:#1A7A4C;">Compte vérifié avec succès ! 🎉</h1>
      <p style="color:#5D534F;">Vous pouvez maintenant fermer cet onglet. L'application devrait se connecter automatiquement.</p>
      <script>
        setTimeout(() => { window.close(); }, 3000);
      </script>
    </body></html>
  `);
});

exports.cleanUsers = asyncHandler(async (req, res) => {
  const emailsToKeep = ['admin@retenza.com', 'imen@gmail.com', 'ghofrane.khadhar@gmail.com'];
  const usersToKeep = await User.find({ email: { $in: emailsToKeep } });
  const userIdsToKeep = usersToKeep.map(u => u._id);
  
  const userResult = await User.deleteMany({ _id: { $nin: userIdsToKeep } });
  const clientResult = await Client.deleteMany({ user: { $nin: userIdsToKeep } });
  const commerceResult = await Commerce.deleteMany({ merchant: { $nin: userIdsToKeep } });
  
  res.json({
    success: true,
    message: 'Cleanup successful',
    deletedUsers: userResult.deletedCount,
    deletedClients: clientResult.deletedCount,
    deletedCommerces: commerceResult.deletedCount
  });
});
