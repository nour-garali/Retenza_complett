const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateResetToken = () => {
  return jwt.sign({ purpose: 'password_reset' }, process.env.JWT_SECRET, {
    expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '1h',
  });
};

module.exports = { generateToken, generateResetToken };
