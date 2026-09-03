const Commerce = require('../models/Commerce');

const getMerchantCommerce = async (userId) => {
  const commerce = await Commerce.findOne({ merchant: userId });
  if (!commerce) {
    const error = new Error('No commerce found for this merchant');
    error.statusCode = 404;
    throw error;
  }
  return commerce;
};

const assertMerchantOwnsCommerce = (commerce, userId) => {
  if (commerce.merchant.toString() !== userId.toString()) {
    const error = new Error('Not authorized for this commerce');
    error.statusCode = 403;
    throw error;
  }
};

module.exports = { getMerchantCommerce, assertMerchantOwnsCommerce };
