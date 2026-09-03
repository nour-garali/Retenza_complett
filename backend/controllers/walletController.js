const Client = require('../models/Client');
const Commerce = require('../models/Commerce');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const asyncHandler = require('../utils/asyncHandler');

exports.getAppleWalletPass = asyncHandler(async (req, res) => {
  const { clientId, commerceId } = req.params;

  const [client, commerce, account] = await Promise.all([
    Client.findById(clientId),
    Commerce.findById(commerceId),
    LoyaltyAccount.findOne({ client: clientId, commerce: commerceId }),
  ]);

  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
  if (!commerce) return res.status(404).json({ success: false, message: 'Commerce not found' });

  const programType = commerce.loyaltyProgram?.type || 'points';
  const balance =
    programType === 'points'
      ? account?.points || 0
      : programType === 'stamps'
        ? account?.stamps || 0
        : account?.cashbackBalance || 0;

  const passData = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.retenza.loyalty',
    serialNumber: `${clientId}-${commerceId}`,
    teamIdentifier: 'RETEAM01',
    organizationName: commerce.name,
    description: `${commerce.name} Loyalty Card`,
    logoText: commerce.name,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(215, 62, 38)',
    barcode: {
      message: `RETEZA-${clientId}`,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
    storeCard: {
      primaryFields: [
        {
          key: 'balance',
          label: programType === 'cashback' ? 'Cashback' : programType,
          value: programType === 'cashback' ? `${balance.toFixed(2)} €` : String(balance),
        },
      ],
      secondaryFields: [
        { key: 'member', label: 'Member', value: `${client.firstName} ${client.lastName}` },
        { key: 'commerce', label: 'Commerce', value: commerce.name },
      ],
    },
    _mock: true,
    _note: 'Mock Apple Wallet pass structure. Production requires Apple Developer certificates.',
  };

  res.json({ success: true, data: { appleWalletPass: passData } });
});

exports.getGoogleWalletPass = asyncHandler(async (req, res) => {
  const { clientId, commerceId } = req.params;

  const [client, commerce, account] = await Promise.all([
    Client.findById(clientId),
    Commerce.findById(commerceId),
    LoyaltyAccount.findOne({ client: clientId, commerce: commerceId }),
  ]);

  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
  if (!commerce) return res.status(404).json({ success: false, message: 'Commerce not found' });

  const programType = commerce.loyaltyProgram?.type || 'points';
  const balance =
    programType === 'points'
      ? account?.points || 0
      : programType === 'stamps'
        ? account?.stamps || 0
        : account?.cashbackBalance || 0;

  const passData = {
    iss: 'retenza@retenza.com',
    aud: 'google',
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [
        {
          id: `${process.env.GOOGLE_ISSUER_ID || '3388000000022290000'}.${clientId}`,
          classId: `${process.env.GOOGLE_ISSUER_ID || '3388000000022290000'}.${commerceId}`,
          state: 'ACTIVE',
          accountId: client.email,
          accountName: `${client.firstName} ${client.lastName}`,
          loyaltyPoints: {
            label: programType,
            balance: { string: String(balance) },
          },
          barcode: {
            type: 'QR_CODE',
            value: `RETEZA-${clientId}`,
          },
          hexBackgroundColor: '#D73E26',
        },
      ],
    },
    _mock: true,
    _note: 'Mock Google Wallet JWT structure. Production requires Google Wallet API credentials.',
  };

  res.json({ success: true, data: { googleWalletPass: passData } });
});
