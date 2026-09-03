import React from 'react';
import { getMerchantClients } from '@/services/merchantDashboardActions';
import MerchantClientsContent from './MerchantClientsContent';

export default async function MerchantClientsPage() {
  const clients = await getMerchantClients();

  return <MerchantClientsContent initialClients={clients} />;
}
