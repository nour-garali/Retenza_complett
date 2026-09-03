"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GlobalRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=global");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#B0A49C]">
      <Loader2 className="w-8 h-8 animate-spin text-[#E8462F]" />
      <span className="text-sm font-bold mt-3">Redirection vers le comparatif multi-boutiques...</span>
    </div>
  );
}
