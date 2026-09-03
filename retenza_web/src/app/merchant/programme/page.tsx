import React from 'react';
import { getMerchantLoyaltyProgram } from '@/services/merchantDashboardActions';
import MerchantProgramContent from './MerchantProgramContent';

export default async function MerchantProgramPage() {
  const program = await getMerchantLoyaltyProgram();

  return <MerchantProgramContent initialProgram={program} />;
}
