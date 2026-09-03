import { cookies } from 'next/headers';
import { User } from '../types/user';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const COOKIE_NAME = 'auth_token';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // Do not cache this, as it depends on the user's session
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.data?.user) {
      return data.data.user as User;
    }

    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
