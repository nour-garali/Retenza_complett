import React from 'react';
import { getMerchantDashboardStats, getMerchantBillingStats } from '@/services/merchantDashboardActions';
import { getCurrentUser } from '@/services/serverAuth';
import MerchantHomeContent from './MerchantHomeContent';

export default async function MerchantHomePage() {
  const user = await getCurrentUser();
  
  const [stats, billingStats] = await Promise.all([
    getMerchantDashboardStats(),
    getMerchantBillingStats(),
  ]);

  return <MerchantHomeContent user={user} stats={stats} billingStats={billingStats} />;
}
