// ─────────────────────────────────────────────────────────────────────────────
// guest.ts — Types for the Guest QR Loyalty Card feature
// Phase 1: used with mock data  |  Phase 2: connected to real backend
// ─────────────────────────────────────────────────────────────────────────────

// ── Merchant public profile (returned by GET /api/public/merchant/:code) ─────

export interface MerchantPublicProfile {
  name: string;
  category: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  /** Hex color — dominant brand color (used for CTA buttons, hero background) */
  primaryColor: string;
  /** Hex color — secondary/background color */
  secondaryColor: string;
  address?: string;
  loyaltyProgram: LoyaltyProgramPublic;
  isActive: boolean;
}

export interface LoyaltyProgramPublic {
  type: 'points' | 'stamps' | 'cashback';
  // Stamps
  totalStamps?: number;
  currentStamps?: number;
  reward?: string;
  // Points
  pointsPerEuro?: number;
  // Cashback
  cashbackRate?: number;
}

// ── Guest card form ──────────────────────────────────────────────────────────

export interface GuestCardFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface GuestCardFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ── Card creation result (returned by POST /api/public/loyalty-card/create) ──

export interface GuestCardCreationResult {
  /** Permanent public identifier — used across Wallet, dashboard, stats */
  cardPublicId: string;
  /** false = an existing card was found and returned (no duplicate created) */
  isNewCard: boolean;
  /**
   * Wallet URLs are intentionally NOT returned here.
   * Per architecture decision: passes are generated lazily on demand
   * when the user clicks "Add to Google Wallet" or "Add to Apple Wallet".
   * Phase 2 will add: generateWalletPass(cardPublicId, provider)
   */
  message: string;
}

// ── Wallet (Lazy Pass Generation) ────────────────────────────────────────────

export type WalletProvider = 'google' | 'apple';

export interface WalletPassRequest {
  cardPublicId: string;
  provider: WalletProvider;
}

export interface WalletPassResult {
  provider: WalletProvider;
  /** The URL to redirect the user to for adding the pass to their Wallet */
  addUrl: string;
}

// ── Business events (compatible with future Event Bus) ───────────────────────

export type BusinessEventType =
  | 'QR_SCANNED'
  | 'GUEST_CARD_CREATED'
  | 'WALLET_PASS_GENERATED'
  | 'WALLET_PASS_ADDED'
  | 'GUEST_ACCOUNT_MERGED'
  | 'LOYALTY_UPDATED';

// ── QR Scan metadata (sent to POST /api/public/merchant/:code/scan) ──────────

export interface QrScanMetadata {
  userAgent: string;
  source: 'qr_camera' | 'link' | 'app';
}

// ── Utility ─────────────────────────────────────────────────────────────────

/** Detects which wallet platform the current device supports. */
export type WalletPlatform = 'google' | 'apple' | 'both';
