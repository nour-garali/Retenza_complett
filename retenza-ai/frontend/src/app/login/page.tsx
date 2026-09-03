"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique puisque l'authentification est désactivée
    router.replace("/");
  }, [router]);

  return null;
}
