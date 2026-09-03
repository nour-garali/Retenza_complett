import { User } from './user';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface ActionResponse {
  success: boolean;
  message: string;
  role?: string;
  code?: string;
  isOnboardingComplete?: boolean;
}
