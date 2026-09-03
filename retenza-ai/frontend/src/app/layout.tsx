import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retenza AI - Console de Pilotage",
  description: "Console d'administration intelligente de marketing et fidélisation Retenza AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex bg-[#FAF3EE] text-[#1A1A1A]" suppressHydrationWarning>
        <AuthGate>
        <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
