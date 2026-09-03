import React from 'react';
import { getAdminDashboardStats, getAdminCommerces } from '@/services/adminDashboardActions';
import AdminHomeContent from './AdminHomeContent';

export default async function AdminHomePage() {
  const stats = await getAdminDashboardStats();
  const commerces = await getAdminCommerces();

  return <AdminHomeContent stats={stats} commerces={commerces} />;
}
