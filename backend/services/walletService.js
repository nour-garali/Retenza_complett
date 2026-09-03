/**
 * walletService.js
 * Real Google Wallet API integration for Retenza loyalty passes.
 * Uses google-auth-library for JWT signing and REST API calls.
 * Follows Google Wallet best practices: 1 LoyaltyClass per commerce,
 * PATCH for updates, exponential backoff on errors.
 */

const { GoogleAuth } = require('google-auth-library');
const path = require('path');

// Allow self-signed certificates in development (corporate proxy / Windows CA issues)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const KEY_FILE = path.resolve(__dirname, '..', process.env.GOOGLE_WALLET_KEY_FILE || './config/google-wallet-key.json');
const WALLET_API_BASE = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPES = ['https://www.googleapis.com/auth/wallet_object.issuer'];

// ─── Auth Client (singleton) ──────────────────────────────────────────────────
let _authClient = null;
const getAuthClient = async () => {
  if (_authClient) return _authClient;
  _authClient = new GoogleAuth({ keyFile: KEY_FILE, scopes: SCOPES });
  return _authClient;
};

/**
 * Makes an authenticated HTTP request to the Google Wallet REST API.
 * Implements retry with exponential backoff on 429 (rate limit) errors.
 */
const walletRequest = async (method, endpoint, body = null, retries = 3) => {
  const auth = await getAuthClient();
  const client = await auth.getClient();
  const url = `${WALLET_API_BASE}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const options = { url, method, headers: { 'Content-Type': 'application/json' } };
      if (body) options.data = body;

      const response = await client.request(options);
      return response.data;
    } catch (err) {
      const status = err?.response?.status;
      const isLastAttempt = attempt === retries;

      if (status === 429 && !isLastAttempt) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[WalletService] Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // 409 = resource already exists — not really an error for our use case
      if (status === 409) {
        console.log(`[WalletService] Resource already exists (409) — continuing.`);
        return err.response.data;
      }

      console.error(`[WalletService] API Error ${status}:`, err?.response?.data || err.message);
      throw err;
    }
  }
};

// ─── LoyaltyClass ─────────────────────────────────────────────────────────────

/**
 * Builds the class ID for a commerce.
 * Format: {ISSUER_ID}.commerce_{mongoId}
 */
const buildClassId = (commerceId) => `${ISSUER_ID}.commerce_${commerceId}`;

/**
 * Checks if a LoyaltyClass exists for a commerce. If not, creates it.
 * Should be called once when a commerce is created/activated.
 * Returns the classId.
 */
const ensureLoyaltyClass = async (commerce) => {
  const classId = buildClassId(commerce._id);

  console.log(`[WalletService] Checking LoyaltyClass: ${classId}`);

  // Try to GET the class first (to check existence)
  try {
    await walletRequest('GET', `/loyaltyClass/${classId}`);
    console.log(`[WalletService] LoyaltyClass already exists: ${classId}`);
    return classId;
  } catch (err) {
    if (err?.response?.status !== 404) throw err;
  }

  // Class not found — create it
  console.log(`[WalletService] Creating new LoyaltyClass: ${classId}`);

  // Only include programLogo if it's a real public HTTPS URL
  // (local server URLs like 127.0.0.1 are unreachable by Google servers)
  const hasPublicLogo = commerce.logo &&
    typeof commerce.logo === 'string' &&
    commerce.logo.startsWith('https://') &&
    !commerce.logo.includes('127.0.0.1') &&
    !commerce.logo.includes('localhost');

  // Fallback logo: a reliable public HTTPS image hosted by Google
  // (Google Wallet requires a logo — local/localhost URLs are rejected)
  const FALLBACK_LOGO = 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png';

  const logoUri = hasPublicLogo ? commerce.logo : FALLBACK_LOGO;

  const loyaltyClass = {
    id: classId,
    issuerName: 'Retenza',
    programName: commerce.name || 'Programme Fidélité',
    hexBackgroundColor: commerce.brandColor || '#D73E26',
    reviewStatus: 'UNDER_REVIEW',
    loyaltyPoints: {
      label: _getLoyaltyLabel(commerce),
    },
    textModulesData: [
      {
        header: 'Programme de fidélité',
        body: _getProgramDescription(commerce),
        id: 'program_info',
      },
      {
        header: 'Plateforme',
        body: 'Retenza — Fidélité Simplifiée',
        id: 'platform_info',
      },
    ],
  };

  // Google Wallet requires a logo
  loyaltyClass.programLogo = {
    sourceUri: {
      uri: logoUri,
      description: `Logo ${commerce.name || 'Retenza'}`,
    },
  };
  
  if (hasPublicLogo) {
    console.log(`[WalletService] Using commerce logo: ${commerce.logo}`);
  } else {
    console.log(`[WalletService] No public logo available — using Google fallback logo`);
  }

  await walletRequest('POST', '/loyaltyClass', loyaltyClass);
  console.log(`[WalletService] ✅ LoyaltyClass created: ${classId}`);
  return classId;
};


// ─── LoyaltyObject ────────────────────────────────────────────────────────────

/**
 * Builds the object ID for a client+loyalty account.
 * Format: {ISSUER_ID}.account_{loyaltyAccountId}
 */
const buildObjectId = (loyaltyAccountId) => `${ISSUER_ID}.account_${loyaltyAccountId}`;

/**
 * Creates a LoyaltyObject for a specific client on a specific commerce.
 * Returns the objectId.
 */
const createLoyaltyObject = async (client, commerce, loyaltyAccount) => {
  const classId = buildClassId(commerce._id);
  const objectId = buildObjectId(loyaltyAccount._id);

  console.log(`[WalletService] Creating LoyaltyObject: ${objectId}`);

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountId: String(client._id),
    accountName: `${client.firstName} ${client.lastName}`,
    loyaltyPoints: {
      balance: {
        string: _formatBalance(loyaltyAccount, commerce),
      },
      label: _getLoyaltyLabel(commerce),
    },
    barcode: {
      type: 'QR_CODE',
      // If cardPublicId is provided (Guest card), use it as the barcode value.
      // The Flutter app scans this QR to find and import the card automatically.
      // For regular Retenza accounts, fall back to the legacy commerce+client format.
      value: loyaltyAccount.cardPublicId
        ? loyaltyAccount.cardPublicId
        : `${commerce._id}_${client._id}`,
      alternateText: loyaltyAccount.cardPublicId
        ? loyaltyAccount.cardPublicId
        : `ID: ${String(loyaltyAccount._id).slice(-8).toUpperCase()}`,
    },
    textModulesData: [
      {
        header: 'Membre depuis',
        body: new Date(loyaltyAccount.createdAt || Date.now()).toLocaleDateString('fr-FR'),
        id: 'member_since',
      },
    ],
    groupingInfo: {
      groupingId: String(commerce._id),
    },
  };

  await walletRequest('POST', '/loyaltyObject', loyaltyObject);
  console.log(`[WalletService] ✅ LoyaltyObject created: ${objectId}`);
  return objectId;
};

// ─── JWT Signing & Save URL ───────────────────────────────────────────────────

/**
 * Generates a signed JWT and returns the official "Add to Google Wallet" URL.
 * The JWT references an already-created LoyaltyObject by its ID.
 */
const generateSaveUrl = async (objectId) => {
  const auth = await getAuthClient();
  const client = await auth.getClient();
  const serviceAccountEmail = client.email;

  const now = Math.floor(Date.now() / 1000);

  const jwtPayload = {
    iss: serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    payload: {
      loyaltyObjects: [{ id: objectId }],
    },
  };

  // Sign JWT using the service account private key
  const { private_key } = require(KEY_FILE);
  const jwt = require('jsonwebtoken');
  const signedJwt = jwt.sign(jwtPayload, private_key, { algorithm: 'RS256' });

  const saveUrl = `https://pay.google.com/gp/v/save/${signedJwt}`;
  console.log(`[WalletService] ✅ Save URL generated for objectId: ${objectId}`);
  return saveUrl;
};

// ─── OTA Update (PATCH) ───────────────────────────────────────────────────────

/**
 * Updates a LoyaltyObject's balance via PATCH after a loyalty transaction.
 * This triggers an OTA push to the user's Google Wallet automatically.
 */
const updateLoyaltyObject = async (loyaltyAccountId, loyaltyAccount, commerce) => {
  const objectId = buildObjectId(loyaltyAccountId);

  console.log(`[WalletService] PATCH update for objectId: ${objectId}`);

  const patchBody = {
    loyaltyPoints: {
      balance: {
        string: _formatBalance(loyaltyAccount, commerce),
      },
      label: _getLoyaltyLabel(commerce),
    },
  };

  try {
    await walletRequest('PATCH', `/loyaltyObject/${objectId}`, patchBody);
    console.log(`[WalletService] ✅ OTA update sent. New balance: ${_formatBalance(loyaltyAccount, commerce)}`);
    return { success: true, updated: true, objectId };
  } catch (err) {
    // If object doesn't exist (404), it means the client never added to wallet — not a critical error
    if (err?.response?.status === 404) {
      console.log(`[WalletService] Object not found for OTA update (client may not have added to wallet yet): ${objectId}`);
      return { success: true, updated: false, reason: 'object_not_found' };
    }
    console.error(`[WalletService] OTA update failed:`, err?.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

// ─── Main Export Function ─────────────────────────────────────────────────────

/**
 * Full flow: ensure class exists, create object, generate signed URL.
 * Called from clientController.getWalletPass().
 */
const generateWalletPass = async (client, commerce, loyaltyAccount, platform) => {
  console.log(`[WalletService] 🚀 Starting full wallet pass flow`);
  console.log(`[WalletService] Client: ${client.firstName} ${client.lastName} | Commerce: ${commerce.name}`);

  if (!ISSUER_ID) {
    throw new Error('GOOGLE_WALLET_ISSUER_ID is not set in environment variables.');
  }

  // Step 1: Ensure LoyaltyClass exists for this commerce
  await ensureLoyaltyClass(commerce);

  // Step 2: Create the LoyaltyObject for this client
  const objectId = buildObjectId(loyaltyAccount._id);

  // Check if object already exists to avoid duplicates
  try {
    await walletRequest('GET', `/loyaltyObject/${objectId}`);
    console.log(`[WalletService] LoyaltyObject already exists: ${objectId}`);
  } catch (err) {
    if (err?.response?.status === 404) {
      await createLoyaltyObject(client, commerce, loyaltyAccount);
    } else {
      throw err;
    }
  }

  // Step 3: Generate the signed Save URL
  const passUrl = await generateSaveUrl(objectId);

  return {
    success: true,
    platform: platform || 'google',
    passUrl,
    objectId,
    cardInfo: {
      clientName: `${client.firstName} ${client.lastName}`,
      commerceName: commerce.name,
      points: loyaltyAccount.points || 0,
      stamps: loyaltyAccount.stamps || 0,
      cashbackBalance: loyaltyAccount.cashbackBalance || 0,
    },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _getLoyaltyLabel = (commerce) => {
  const type = commerce?.loyaltyProgram?.type || 'points';
  if (type === 'stamps') return 'Tampons';
  if (type === 'cashback') return 'Cashback (€)';
  return 'Points';
};

const _getProgramDescription = (commerce) => {
  const prog = commerce?.loyaltyProgram;
  if (!prog) return 'Programme de fidélité Retenza';
  const type = prog.type || 'points';
  if (type === 'points') return `${prog.pointsPerEuro || 1} point(s) par euro dépensé`;
  if (type === 'stamps') return `${prog.stampsRequired || 10} tampons pour une récompense`;
  if (type === 'cashback') return `${prog.cashbackPercentage || 5}% de cashback`;
  return 'Programme de fidélité';
};

const _formatBalance = (loyaltyAccount, commerce) => {
  const type = commerce?.loyaltyProgram?.type || 'points';
  if (type === 'stamps') return `${loyaltyAccount.stamps || 0}`;
  if (type === 'cashback') return `${(loyaltyAccount.cashbackBalance || 0).toFixed(2)} €`;
  return `${loyaltyAccount.points || 0}`;
};

module.exports = {
  generateWalletPass,
  ensureLoyaltyClass,
  createLoyaltyObject,
  updateLoyaltyObject,
  buildClassId,
  buildObjectId,
};
