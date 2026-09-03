import React from 'react';
import { getMerchantDashboardStats } from '@/services/merchantDashboardActions';
import { getCurrentUser } from '@/services/serverAuth';
import MerchantHomeContent from './MerchantHomeContent';

export default async function MerchantHomePage() {
  const user = await getCurrentUser();
  const stats = await getMerchantDashboardStats();

  return <MerchantHomeContent user={user} stats={stats} />;
}
