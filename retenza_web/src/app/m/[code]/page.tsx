import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicMerchant, recordQrScan } from '@/services/publicMerchantActions';
import MerchantLandingClient from './MerchantLandingClient';
import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ code: string }>;
}

// ── Dynamic metadata per merchant ─────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const merchant = await fetchPublicMerchant(code);

  if (!merchant) {
    return { title: 'Commerce introuvable — Retenza' };
  }

  return {
    title: `${merchant.name} — Programme de fidélité | Retenza`,
    description: `Créez votre carte de fidélité gratuite pour ${merchant.name}. ${merchant.description}`,
    openGraph: {
      title: `${merchant.name} — Programme de fidélité`,
      description: merchant.description,
      images: merchant.logoUrl ? [merchant.logoUrl] : [],
    },
  };
}

// ── Page (Server Component) ───────────────────────────────────────────────────
export default async function MerchantLandingPage({ params }: PageProps) {
  const { code } = await params;

  // Fetch the public merchant profile (no auth required)
  const merchant = await fetchPublicMerchant(code);

  // Merchant not found or inactive → 404
  if (!merchant || !merchant.isActive) {
    notFound();
  }

  // Record the scan asynchronously (fire & forget — does not block page render)
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') ?? 'unknown';
  recordQrScan(code, { userAgent, source: 'qr_camera' }).catch(() => {
    // Silently ignore scan recording errors
  });

  return <MerchantLandingClient merchant={merchant} merchantCode={code} />;
}
