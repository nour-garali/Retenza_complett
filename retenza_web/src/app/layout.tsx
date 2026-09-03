import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/services/serverAuth";

export const metadata: Metadata = {
  title: "Retenza Connect — La Fidélité, Réinventée.",
  description: "Connectez vos commerçants à leurs clients avec une élégance technologique absolue. La plateforme de fidélisation nouvelle génération.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUser();

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthProvider initialUser={initialUser}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
