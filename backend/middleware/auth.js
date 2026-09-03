const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // ── Source de vérité unique : user.status ──────────────────────────────────
    // PENDING_ACTIVATION → compte créé mais pas encore activé par le commerçant
    if (user.status === 'pending_activation') {
      return res.status(403).json({
        success: false,
        code: 'PENDING_ACTIVATION',
        message: 'Votre compte n\'est pas encore activé. Consultez votre email pour terminer l\'activation.',
      });
    }

    // SUSPENDED → accès bloqué par l'admin
    if (user.status === 'suspended' || !user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Votre compte a été suspendu. Contactez le support Retenza.',
      });
    }

    // ACTIVE → accès normal
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.',
    });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
