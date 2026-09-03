"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith('/super-admin') || pathname.startsWith('/client-chatbot')) return <main className="min-h-screen w-full">{children}</main>;
  return <><Sidebar /><main className="flex-1 flex flex-col h-screen overflow-hidden"><Topbar /><div className="flex-1 overflow-y-auto">{children}</div></main></>;
}
