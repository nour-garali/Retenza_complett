import React from 'react';
import { getClientDashboardData } from '@/services/clientDashboardActions';
import { getCurrentUser } from '@/services/serverAuth';
import ClientHomeContent from './ClientHomeContent';

export default async function ClientHomePage() {
  const user = await getCurrentUser();
  const dashboardData = await getClientDashboardData();

  return <ClientHomeContent user={user} data={dashboardData} />;
}
