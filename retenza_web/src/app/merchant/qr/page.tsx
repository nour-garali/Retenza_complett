import React from 'react';
import { getMerchantQr } from '@/services/merchantDashboardActions';
import { getCurrentUser } from '@/services/serverAuth';
import MerchantQrContent from './MerchantQrContent';

export default async function MerchantQrPage() {
  const qrData = await getMerchantQr();
  const user = await getCurrentUser();

  const commerce = user?.commerce as any;
  return <MerchantQrContent qrUrl={qrData?.url} merchantCode={commerce?.merchantCode} commerceName={commerce?.name} />;
}
