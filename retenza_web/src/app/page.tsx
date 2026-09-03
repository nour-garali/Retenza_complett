import { getCurrentUser } from '@/services/serverAuth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export const metadata = {
  title: 'Retenza Connect — La Fidélité, Réinventée.',
  description: 'Connectez vos commerçants à leurs clients avec une élégance technologique absolue. Scannez, gagnez, fidélisez. La plateforme de fidélisation nouvelle génération.',
};

export default async function Home() {
  const user = await getCurrentUser();

  // If authenticated, redirect to dashboard
  if (user) {
    switch (user.role) {
      case 'merchant':
        redirect('/merchant');
      case 'admin':
        redirect('/admin');
      case 'client':
      default:
        redirect('/client');
    }
  }

  // Not authenticated → show the landing page
  return <LandingPage />;
}
