export type Role = 'client' | 'merchant' | 'admin';

export interface Commerce {
  _id?: string;
  name?: string;
  category?: string;
  description?: string;
  logoUrl?: string;
  address?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  commerce?: string | Commerce;
}

// Helper to safely get the commerce name regardless of whether it's populated or just an ID
export function getCommerceName(commerce?: string | Commerce): string | undefined {
  if (!commerce) return undefined;
  if (typeof commerce === 'string') return undefined;
  return commerce.name;
}
