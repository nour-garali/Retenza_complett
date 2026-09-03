"use client";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // Vérification d'authentification désactivée
  return <>{children}</>;
}
