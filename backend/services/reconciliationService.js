/**
 * reconciliationService.js
 *
 * Phase 4 — Guest → Retanza Account Reconciliation
 *
 * When a user registers (or explicitly requests reconciliation), this service
 * searches for GuestLoyaltyCards matching their email OR phone, and links them
 * to the new Retenza account.
 *
 * Rules:
 * - A card is only merged if its status is 'active' (not already merged or suspended)
 * - The card is NEVER deleted — it keeps working in Wallet after merge
 * - Multiple cards from different merchants are all reconciled in a single pass
 * - The operation is idempotent: running it twice produces the same result
 *
 * Events emitted (logged):
 * - GUEST_ACCOUNT_MERGED — for each successfully merged card
 */

const GuestLoyaltyCard = require('../models/GuestLoyaltyCard');
const LoyaltyAccount   = require('../models/LoyaltyAccount');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main reconciliation function.
 *
 * @param {Object} params
 * @param {string} params.retenzaUserId  — MongoDB ObjectId of the newly registered User
 * @param {string} params.email          — User's email (normalized, lowercase)
 * @param {string} params.phone          — User's phone number
 * @returns {Promise<ReconciliationResult>}
 */
const reconcileGuestCards = async ({ retenzaUserId, email, phone }) => {
  const result = {
    mergedCount: 0,
    mergedCards: [],
    errors: [],
  };

  try {
    // 1. Find all active guest cards matching email OR phone
    const guestCards = await GuestLoyaltyCard.find({
      status: 'active',
      $or: [
        ...(email ? [{ email: email.toLowerCase().trim() }] : []),
        ...(phone ? [{ phone: phone.trim() }]               : []),
      ],
    });

    if (guestCards.length === 0) {
      console.log(`[Reconciliation] No guest cards found for email=${email} phone=${phone}`);
      return result;
    }

    console.log(`[Reconciliation] Found ${guestCards.length} card(s) to reconcile for userId=${retenzaUserId}`);

    // 2. Process each card
    for (const card of guestCards) {
      try {
        // Mark card as merged — link to Retenza account
        card.status       = 'merged';
        card.retenzaUserId = retenzaUserId;
        card.mergedAt      = new Date();
        await card.save();

        // 3. Optionally transfer loyalty balance to a real LoyaltyAccount
        // This is a best-effort migration — failures don't block the merge
        try {
          await transferBalanceToLoyaltyAccount(card, retenzaUserId);
        } catch (transferErr) {
          console.warn(
            `[Reconciliation] Balance transfer failed for card ${card.cardPublicId}:`,
            transferErr.message
          );
          result.errors.push({
            cardPublicId: card.cardPublicId,
            step: 'balance_transfer',
            error: transferErr.message,
          });
        }

        // 4. Emit business event (log for now — connect to EventBus in future)
        console.log(
          `[Reconciliation] GUEST_ACCOUNT_MERGED: cardPublicId=${card.cardPublicId} ` +
          `merchant=${card.merchantPublicCode} userId=${retenzaUserId}`
        );

        result.mergedCards.push({
          cardPublicId:       card.cardPublicId,
          merchantPublicCode: card.merchantPublicCode,
          merchantId:         card.merchantId,
          points:             card.points,
          stamps:             card.stamps,
          cashback:           card.cashback,
        });

        result.mergedCount++;
      } catch (cardErr) {
        console.error(
          `[Reconciliation] Failed to merge card ${card.cardPublicId}:`,
          cardErr.message
        );
        result.errors.push({
          cardPublicId: card.cardPublicId,
          step: 'merge',
          error: cardErr.message,
        });
      }
    }

    console.log(
      `[Reconciliation] ✅ Done — ${result.mergedCount}/${guestCards.length} cards merged ` +
      `(${result.errors.length} error(s))`
    );
  } catch (err) {
    console.error('[Reconciliation] Fatal error:', err.message);
    result.errors.push({ step: 'global', error: err.message });
  }

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Balance transfer
// ─────────────────────────────────────────────────────────────────────────────

const Client = require('../models/Client');

/**
 * Transfers the loyalty balance from a GuestLoyaltyCard to the real LoyaltyAccount.
 * If no LoyaltyAccount exists yet for this merchant, it creates one.
 */
const transferBalanceToLoyaltyAccount = async (guestCard, retenzaUserId) => {
  // Find the Client profile associated with this User
  const client = await Client.findOne({ user: retenzaUserId });
  
  if (!client) {
    console.warn(`[Reconciliation] No Client profile found for User ${retenzaUserId} — skipping balance transfer.`);
    return;
  }

  // Find or create the LoyaltyAccount for this client + merchant
  let loyaltyAccount = await LoyaltyAccount.findOne({
    client: client._id,
    commerce: guestCard.merchantId,
  });

  if (!loyaltyAccount) {
    loyaltyAccount = new LoyaltyAccount({
      client: client._id,
      commerce: guestCard.merchantId,
      points: 0,
      stamps: 0,
      cashbackBalance: 0,
    });
    console.log(`[Reconciliation] Created new LoyaltyAccount for client=${client._id} merchant=${guestCard.merchantPublicCode}`);
  }

  // Add the guest card balance to the existing account
  if (guestCard.points > 0)   loyaltyAccount.points          = (loyaltyAccount.points          || 0) + guestCard.points;
  if (guestCard.stamps > 0)   loyaltyAccount.stamps          = (loyaltyAccount.stamps          || 0) + guestCard.stamps;
  if (guestCard.cashback > 0) loyaltyAccount.cashbackBalance = (loyaltyAccount.cashbackBalance || 0) + guestCard.cashback;

  await loyaltyAccount.save();

  console.log(
    `[Reconciliation] Balance transferred: +${guestCard.points}pts +${guestCard.stamps}stamps ` +
    `+${guestCard.cashback}€ to loyaltyAccount ${loyaltyAccount._id}`
  );
};

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { reconcileGuestCards };
