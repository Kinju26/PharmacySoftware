"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { Topbar } from "@/components/Topbar";
import { usePharmacy } from "@/context/PharmacyContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, currentUser } = usePharmacy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) router.replace("/");
  }, [currentUser, ready, router]);

  if (!ready || !currentUser) {
    return <div className="content">Loading workspace…</div>;
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">{children}</div>
      </main>
      <Toast />
      <SessionTimeoutWarning />
    </div>
  );
}
