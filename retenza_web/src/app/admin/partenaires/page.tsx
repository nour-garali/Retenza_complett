import React from 'react';
import { getAdminCommerces } from '@/services/adminDashboardActions';
import AdminMerchantsContent from './AdminMerchantsContent';

export default async function AdminMerchantsPage() {
  const commerces = await getAdminCommerces();

  return <AdminMerchantsContent initialCommerces={commerces} />;
}
