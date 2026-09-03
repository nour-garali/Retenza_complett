import React from 'react';
import { getAdminClients } from '@/services/adminDashboardActions';
import AdminClientsContent from './AdminClientsContent';

export default async function AdminClientsPage() {
  const clients = await getAdminClients();

  return <AdminClientsContent initialClients={clients} />;
}
