"use client";

import { AppShell } from "@/components/AppShell";
import type { ReactNode } from "react";

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
